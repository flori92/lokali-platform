import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { StorageService, UploadResult } from '@/services/storageService';

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  folder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 10,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  folder = 'properties',
  className = ''
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const updateImages = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
    onImagesChange(newImages);
  }, [onImagesChange]);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    return StorageService.uploadImage(file, {
      folder,
      maxSizeBytes,
      allowedTypes,
      compress: true,
      maxWidth: 1920,
      maxHeight: 1080
    });
  }, [folder, maxSizeBytes, allowedTypes]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    
    // Vérifier le nombre maximum d'images
    if (images.length + acceptedFiles.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setUploading(true);

    // Créer les objets image initiaux
    const newImages: UploadedImage[] = acceptedFiles.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
      url: '',
      file,
      status: 'uploading' as const,
      progress: 0
    }));

    // Ajouter les nouvelles images à la liste
    const updatedImages = [...images, ...newImages];
    updateImages(updatedImages);

    // Upload des fichiers
    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i];
      
      try {
        // Simuler la progression
        const progressInterval = setInterval(() => {
          const currentImages = [...updatedImages];
          const imageIndex = currentImages.findIndex(img => img.id === image.id);
          if (imageIndex !== -1 && currentImages[imageIndex].progress < 90) {
            currentImages[imageIndex].progress += 10;
            updateImages(currentImages);
          }
        }, 200);

        // Upload réel
        const result = await uploadFile(image.file);
        clearInterval(progressInterval);

        // Mettre à jour le statut de l'image
        const currentImages = [...updatedImages];
        const imageIndex = currentImages.findIndex(img => img.id === image.id);
        
        if (imageIndex !== -1) {
          if (result.success && result.url) {
            currentImages[imageIndex] = {
              ...currentImages[imageIndex],
              url: result.url,
              status: 'success',
              progress: 100
            };
          } else {
            currentImages[imageIndex] = {
              ...currentImages[imageIndex],
              status: 'error',
              progress: 0,
              error: result.error || 'Erreur d\'upload'
            };
          }
          updateImages(currentImages);
        }

      } catch (error) {
        const currentImages = [...updatedImages];
        const imageIndex = currentImages.findIndex(img => img.id === image.id);
        
        if (imageIndex !== -1) {
          currentImages[imageIndex] = {
            ...currentImages[imageIndex],
            status: 'error',
            progress: 0,
            error: error instanceof Error ? error.message : 'Erreur d\'upload'
          };
          updateImages(currentImages);
        }
      }
    }

    setUploading(false);
  }, [images, maxImages, updateImages, uploadFile]);

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    
    // Supprimer de Supabase si l'image a été uploadée
    if (imageToRemove?.url && imageToRemove.status === 'success') {
      StorageService.deleteImage(imageToRemove.url).catch(console.error);
    }

    const filteredImages = images.filter(img => img.id !== imageId);
    updateImages(filteredImages);
  };

  const retryUpload = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const updatedImages = images.map(img => 
      img.id === imageId 
        ? { ...img, status: 'uploading' as const, progress: 0, error: undefined }
        : img
    );
    updateImages(updatedImages);

    try {
      const result = await uploadFile(image.file);
      
      const finalImages = updatedImages.map(img => 
        img.id === imageId 
          ? {
              ...img,
              url: result.success ? result.url || '' : '',
              status: result.success ? 'success' as const : 'error' as const,
              progress: result.success ? 100 : 0,
              error: result.success ? undefined : result.error
            }
          : img
      );
      updateImages(finalImages);

    } catch (error) {
      const errorImages = updatedImages.map(img => 
        img.id === imageId 
          ? {
              ...img,
              status: 'error' as const,
              progress: 0,
              error: error instanceof Error ? error.message : 'Erreur d\'upload'
            }
          : img
      );
      updateImages(errorImages);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': allowedTypes.map(type => `.${type.split('/')[1]}`)
    },
    maxSize: maxSizeBytes,
    disabled: uploading || images.length >= maxImages
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
              ${uploading || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Déposez vos images ici' : 'Glissez vos images ou cliquez pour sélectionner'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {allowedTypes.join(', ')} • Max {Math.round(maxSizeBytes / 1024 / 1024)}MB par image • {maxImages} images max
                </p>
              </div>

              {images.length < maxImages && (
                <Button type="button" variant="outline" disabled={uploading}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Sélectionner des images
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative overflow-hidden">
              <CardContent className="p-2">
                <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                  {/* Preview de l'image */}
                  <img
                    src={image.url || URL.createObjectURL(image.file)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay de statut */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {image.status === 'uploading' && (
                      <div className="text-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <Progress value={image.progress} className="w-16 h-1" />
                      </div>
                    )}
                    
                    {image.status === 'success' && (
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        ✓ Uploadée
                      </Badge>
                    )}
                    
                    {image.status === 'error' && (
                      <div className="text-center">
                        <Badge variant="destructive" className="mb-2">
                          Erreur
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(image.id)}
                          className="text-xs"
                        >
                          Réessayer
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bouton de suppression */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 w-6 h-6 p-0"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Nom du fichier et erreur */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate">
                    {image.file.name}
                  </p>
                  {image.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {image.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Résumé */}
      {images.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{images.length} / {maxImages} images</span>
          <span>
            {images.filter(img => img.status === 'success').length} uploadées, {' '}
            {images.filter(img => img.status === 'error').length} erreurs
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
