import { supabase } from '@/lib/supabase';

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  duration?: number;
  size?: number;
}

export interface VideoUploadProgress {
  progress: number;
  stage: 'validation' | 'processing' | 'uploading' | 'complete' | 'error';
  message: string;
}

export class VideoService {
  private static readonly MAX_DURATION = 120; // 2 minutes en secondes
  private static readonly MAX_SIZE = 50 * 1024 * 1024; // 50MB en bytes
  private static readonly ALLOWED_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
  private static readonly BUCKET_NAME = 'property-videos';

  // Valider un fichier vidéo
  static async validateVideo(file: File): Promise<VideoValidationResult> {
    const errors: string[] = [];
    
    try {
      // Vérifier la taille
      if (file.size > this.MAX_SIZE) {
        errors.push(`La vidéo ne doit pas dépasser ${this.MAX_SIZE / (1024 * 1024)}MB`);
      }

      // Vérifier le format
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !this.ALLOWED_FORMATS.includes(extension)) {
        errors.push(`Format non supporté. Formats acceptés: ${this.ALLOWED_FORMATS.join(', ')}`);
      }

      // Vérifier la durée via un élément vidéo temporaire
      const duration = await this.getVideoDuration(file);
      if (duration > this.MAX_DURATION) {
        errors.push(`La vidéo ne doit pas dépasser ${this.MAX_DURATION / 60} minutes`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        duration,
        size: file.size
      };
    } catch (error) {
      console.error('Erreur validation vidéo:', error);
      return {
        isValid: false,
        errors: ['Erreur lors de la validation de la vidéo']
      };
    }
  }

  // Obtenir la durée d'une vidéo
  private static getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Impossible de lire la vidéo'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  // Générer une miniature de vidéo
  static async generateThumbnail(file: File, timeOffset: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = Math.min(timeOffset, video.duration);
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('Impossible de générer la miniature'));
          }
        }, 'image/jpeg', 0.8);
        
        window.URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Erreur lors du chargement de la vidéo'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  // Compresser une vidéo (simulation - nécessiterait FFmpeg.js pour une vraie compression)
  static async compressVideo(
    file: File, 
    onProgress?: (progress: VideoUploadProgress) => void
  ): Promise<File> {
    // Pour l'instant, on retourne le fichier original
    // Dans une implémentation complète, on utiliserait FFmpeg.js
    onProgress?.({
      progress: 100,
      stage: 'processing',
      message: 'Compression terminée'
    });
    
    return file;
  }

  // Uploader une vidéo vers Supabase Storage
  static async uploadVideo(
    file: File,
    propertyId: string,
    onProgress?: (progress: VideoUploadProgress) => void
  ): Promise<string> {
    try {
      // Validation
      onProgress?.({
        progress: 0,
        stage: 'validation',
        message: 'Validation de la vidéo...'
      });

      const validation = await this.validateVideo(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Vérifier que le bucket existe
      await this.ensureBucketExists();

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${propertyId}/${timestamp}.${extension}`;

      onProgress?.({
        progress: 25,
        stage: 'uploading',
        message: 'Upload en cours...'
      });

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erreur upload: ${error.message}`);
      }

      onProgress?.({
        progress: 75,
        stage: 'processing',
        message: 'Traitement final...'
      });

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      onProgress?.({
        progress: 100,
        stage: 'complete',
        message: 'Upload terminé'
      });

      return urlData.publicUrl;
    } catch (error) {
      onProgress?.({
        progress: 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }

  // Supprimer une vidéo
  static async deleteVideo(videoUrl: string): Promise<void> {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const url = new URL(videoUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const propertyId = pathParts[pathParts.length - 2];
      const filePath = `${propertyId}/${fileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw new Error(`Erreur suppression: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur suppression vidéo:', error);
      throw error;
    }
  }

  // Vérifier que le bucket existe
  private static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Erreur liste buckets: ${listError.message}`);
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
          fileSizeLimit: this.MAX_SIZE
        });

        if (createError) {
          throw new Error(`Erreur création bucket: ${createError.message}`);
        }
      }
    } catch (error) {
      console.error('Erreur vérification bucket:', error);
      throw error;
    }
  }

  // Obtenir les métadonnées d'une vidéo
  static async getVideoMetadata(videoUrl: string): Promise<{
    duration: number;
    size: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        // Estimer la taille (pas toujours disponible via l'élément vidéo)
        const estimatedSize = video.duration * 1000000; // Estimation approximative
        
        resolve({
          duration: video.duration,
          size: estimatedSize,
          format: videoUrl.split('.').pop() || 'unknown'
        });
        
        window.URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Impossible de charger les métadonnées'));
      };

      video.src = videoUrl;
    });
  }

  // Créer une URL de streaming optimisée (pour les gros fichiers)
  static getStreamingUrl(videoUrl: string): string {
    // Pour l'instant, retourne l'URL originale
    // Dans une implémentation avancée, on pourrait utiliser un CDN ou un service de streaming
    return videoUrl;
  }

  // Vérifier si le navigateur supporte un format vidéo
  static isFormatSupported(mimeType: string): boolean {
    const video = document.createElement('video');
    return video.canPlayType(mimeType) !== '';
  }

  // Obtenir les formats supportés par le navigateur
  static getSupportedFormats(): string[] {
    const video = document.createElement('video');
    const formats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime'
    ];

    return formats.filter(format => video.canPlayType(format) !== '');
  }

  // Convertir la durée en format lisible
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Convertir la taille en format lisible
  static formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
