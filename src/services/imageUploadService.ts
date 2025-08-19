import { supabase } from '@/lib/supabase';

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export interface ImageUploadProgress {
  progress: number;
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'property-images';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private static readonly QUALITY = 0.8;
  private static readonly MAX_WIDTH = 1920;
  private static readonly MAX_HEIGHT = 1080;

  // Valider un fichier image
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non supporté. Formats acceptés: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximum: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  // Redimensionner et compresser une image
  static async processImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions en gardant le ratio
        let { width, height } = img;
        
        if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
          const ratio = Math.min(this.MAX_WIDTH / width, this.MAX_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('Erreur lors du traitement de l\'image'));
            }
          },
          'image/jpeg',
          this.QUALITY
        );
      };

      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Générer un nom de fichier unique
  static generateFileName(originalName: string, propertyId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const prefix = propertyId ? `${propertyId}_` : '';
    
    return `${prefix}${timestamp}_${random}.${extension}`;
  }

  // Upload d'une image vers Supabase Storage
  static async uploadImage(
    file: File,
    propertyId?: string,
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult> {
    try {
      // Validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      onProgress?.({
        progress: 10,
        stage: 'processing',
        message: 'Traitement de l\'image...'
      });

      // Traitement de l'image
      const processedFile = await this.processImage(file);

      onProgress?.({
        progress: 30,
        stage: 'uploading',
        message: 'Upload en cours...'
      });

      // Génération du nom de fichier
      const fileName = this.generateFileName(file.name, propertyId);
      const filePath = `properties/${fileName}`;

      // Upload vers Supabase
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erreur upload: ${error.message}`);
      }

      onProgress?.({
        progress: 80,
        stage: 'processing',
        message: 'Finalisation...'
      });

      // Récupération de l'URL publique
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      onProgress?.({
        progress: 100,
        stage: 'complete',
        message: 'Upload terminé'
      });

      return {
        url: urlData.publicUrl,
        path: filePath,
        size: processedFile.size,
        type: processedFile.type
      };

    } catch (error) {
      onProgress?.({
        progress: 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }

  // Upload multiple d'images
  static async uploadMultipleImages(
    files: File[],
    propertyId?: string,
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.uploadImage(
          file,
          propertyId,
          (fileProgress) => {
            const globalProgress = Math.round(
              ((i * 100) + fileProgress.progress) / totalFiles
            );
            
            onProgress?.({
              progress: globalProgress,
              stage: fileProgress.stage,
              message: `Image ${i + 1}/${totalFiles}: ${fileProgress.message}`
            });
          }
        );
        
        results.push(result);
      } catch (error) {
        console.error(`Erreur upload image ${i + 1}:`, error);
        // Continuer avec les autres images même si une échoue
      }
    }

    return results;
  }

  // Supprimer une image
  static async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error(`Erreur suppression: ${error.message}`);
    }
  }

  // Supprimer plusieurs images
  static async deleteMultipleImages(paths: string[]): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove(paths);

    if (error) {
      throw new Error(`Erreur suppression multiple: ${error.message}`);
    }
  }

  // Obtenir les métadonnées d'une image
  static async getImageMetadata(path: string) {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      });

    if (error) {
      throw new Error(`Erreur métadonnées: ${error.message}`);
    }

    return data?.[0];
  }

  // Créer une miniature
  static async createThumbnail(file: File, size: number = 300): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Dimensions carrées pour la miniature
        canvas.width = size;
        canvas.height = size;

        // Calculer le crop pour garder le ratio
        const { width, height } = img;
        const minDim = Math.min(width, height);
        const x = (width - minDim) / 2;
        const y = (height - minDim) / 2;

        // Dessiner la miniature
        ctx?.drawImage(img, x, y, minDim, minDim, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(thumbnailFile);
            } else {
              reject(new Error('Erreur création miniature'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Vérifier si le bucket existe et le créer si nécessaire
  static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (error) {
          throw new Error(`Erreur création bucket: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Erreur vérification bucket:', error);
      // Ne pas bloquer l'upload si on ne peut pas vérifier/créer le bucket
    }
  }
}
