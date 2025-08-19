import { supabase } from '@/lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export class StorageService {
  private static readonly DEFAULT_BUCKET = 'property-images';
  private static readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Upload d'une image avec compression optionnelle
  static async uploadImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        bucket = this.DEFAULT_BUCKET,
        folder = 'properties',
        maxSizeBytes = this.DEFAULT_MAX_SIZE,
        allowedTypes = this.ALLOWED_TYPES,
        compress = true,
        maxWidth = 1920,
        maxHeight = 1080
      } = options;

      // Validation du fichier
      const validation = this.validateFile(file, maxSizeBytes, allowedTypes);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Compression de l'image si nécessaire
      let processedFile = file;
      if (compress && file.type.startsWith('image/')) {
        processedFile = await this.compressImage(file, maxWidth, maxHeight);
      }

      // Génération du nom de fichier unique
      const fileName = this.generateFileName(processedFile);
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload Supabase:', error);
        return { success: false, error: error.message };
      }

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrl
      };

    } catch (error) {
      console.error('Erreur upload image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Upload multiple d'images
  static async uploadMultipleImages(
    files: File[],
    options: ImageUploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  // Suppression d'une image
  static async deleteImage(url: string, bucket = this.DEFAULT_BUCKET): Promise<boolean> {
    try {
      // Extraction du chemin depuis l'URL
      const path = this.extractPathFromUrl(url, bucket);
      if (!path) return false;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Erreur suppression image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression image:', error);
      return false;
    }
  }

  // Validation du fichier
  private static validateFile(
    file: File,
    maxSize: number,
    allowedTypes: string[]
  ): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximum: ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Compression d'image
  private static async compressImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calcul des nouvelles dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Dessin de l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Conversion en blob puis en File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Génération d'un nom de fichier unique
  private static generateFileName(file: File): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || 'jpg';
    return `${timestamp}_${random}.${extension}`;
  }

  // Extraction du chemin depuis l'URL Supabase
  private static extractPathFromUrl(url: string, bucket: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === bucket);
      
      if (bucketIndex === -1) return null;
      
      return pathParts.slice(bucketIndex + 1).join('/');
    } catch {
      return null;
    }
  }

  // Création du bucket s'il n'existe pas
  static async createBucketIfNotExists(bucketName: string): Promise<boolean> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.DEFAULT_MAX_SIZE
        });

        if (error) {
          console.error('Erreur création bucket:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification bucket:', error);
      return false;
    }
  }
}
