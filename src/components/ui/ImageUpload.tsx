import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2, Check } from 'lucide-react';
import { ImageUploadService, ImageUploadResult, ImageUploadProgress } from '@/services/imageUploadService';

export interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  preview: string;
  uploaded?: boolean;
  path?: string;
  size?: number;
  status?: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress?: number;
  error?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // en MB
  propertyId?: string;
  enableRealUpload?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizePerImage = 10,
  propertyId,
  enableRealUpload = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      alert(`Vous ne pouvez télécharger que ${maxImages} images maximum`);
      return;
    }

    // Créer les objets image avec preview
    const newImages: UploadedImage[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    // Ajouter les images à la liste
    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);

    // Si l'upload réel est activé, uploader vers Supabase
    if (enableRealUpload) {
      setIsUploading(true);
      
      for (let i = 0; i < newImages.length; i++) {
        const imageToUpload = newImages[i];
        const imageIndex = images.length + i;

        try {
          // Mettre à jour le statut à "uploading"
          const uploadingImages = updatedImages.map((img, idx) => 
            idx === imageIndex ? { ...img, status: 'uploading' as const, progress: 0 } : img
          );
          onImagesChange(uploadingImages);

          // Upload vers Supabase
          const result = await ImageUploadService.uploadImage(
            imageToUpload.file!,
            propertyId,
            (progress) => {
              setUploadProgress(progress);
              
              // Mettre à jour le progrès de l'image
              const progressImages = uploadingImages.map((img, idx) => 
                idx === imageIndex ? { ...img, progress: progress.progress } : img
              );
              onImagesChange(progressImages);
            }
          );

          // Marquer comme uploadé avec succès
          const successImages = updatedImages.map((img, idx) => 
            idx === imageIndex ? {
              ...img,
              status: 'uploaded' as const,
              progress: 100,
              url: result.url,
              path: result.path,
              size: result.size,
              uploaded: true
            } : img
          );
          onImagesChange(successImages);

        } catch (error) {
          // Marquer comme erreur
          const errorImages = updatedImages.map((img, idx) => 
            idx === imageIndex ? {
              ...img,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Erreur upload'
            } : img
          );
          onImagesChange(errorImages);
        }
      }

      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [images, maxImages, onImagesChange, enableRealUpload, propertyId]);

  const removeImage = async (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    
    // Si l'image a été uploadée sur Supabase, la supprimer
    if (imageToRemove?.uploaded && imageToRemove.path && enableRealUpload) {
      try {
        await ImageUploadService.deleteImage(imageToRemove.path);
      } catch (error) {
        console.error('Erreur suppression image:', error);
      }
    }

    // Révoquer l'URL de preview si c'est un blob local
    if (imageToRemove?.preview && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const filteredImages = images.filter(img => img.id !== imageId);
    onImagesChange(filteredImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: maxSizePerImage * 1024 * 1024,
    disabled: isUploading || images.length >= maxImages
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <Card 
        {...getRootProps()} 
        className={`border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50 ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input {...getInputProps()} />
          
          {isUploading ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
          )}
          
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isUploading ? 'Upload en cours...' : 'Glissez vos images ici'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              ou cliquez pour sélectionner des fichiers
            </p>
            <p className="text-xs text-gray-500">
              Formats acceptés: JPEG, PNG, WebP • Max {maxSizePerImage}MB par image • {maxImages} images max
            </p>
          </div>

          {!isUploading && (
            <Button variant="outline" className="mt-4" disabled={images.length >= maxImages}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Choisir des images
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Barre de progression globale */}
      {uploadProgress && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {uploadProgress.message}
            <Progress value={uploadProgress.progress} className="mt-2" />
          </AlertDescription>
        </Alert>
      )}

      {/* Grille des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.preview || image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay avec statut */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(image.id)}
                    disabled={image.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Badge de statut */}
                <div className="absolute top-2 right-2">
                  {image.status === 'uploading' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {image.progress}%
                    </Badge>
                  )}
                  {image.status === 'uploaded' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Uploadé
                    </Badge>
                  )}
                  {image.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Erreur
                    </Badge>
                  )}
                </div>

                {/* Barre de progression individuelle */}
                {image.status === 'uploading' && image.progress !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0">
                    <Progress value={image.progress} className="h-2" />
                  </div>
                )}
              </div>

              {/* Informations de l'image */}
              <CardContent className="p-3">
                <div className="text-xs text-gray-600">
                  {image.size && (
                    <p>Taille: {(image.size / 1024 / 1024).toFixed(1)} MB</p>
                  )}
                  {image.error && (
                    <p className="text-red-600 mt-1">{image.error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informations */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {images.length} / {maxImages} images
        </span>
        {enableRealUpload && (
          <span className="flex items-center gap-1">
            {images.filter(img => img.status === 'uploaded').length > 0 && (
              <>
                <Check className="h-4 w-4 text-green-600" />
                {images.filter(img => img.status === 'uploaded').length} uploadées
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
