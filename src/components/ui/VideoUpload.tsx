import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle, 
  Film,
  Clock,
  HardDrive
} from 'lucide-react';
import { VideoService, VideoUploadProgress } from '../../services/videoService';
import { useDropzone } from 'react-dropzone';

interface VideoFile {
  id: string;
  file: File;
  url?: string;
  thumbnail?: string;
  duration?: number;
  status: 'pending' | 'validating' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
}

interface VideoUploadProps {
  propertyId: string;
  maxVideos?: number;
  onVideosChange?: (videos: string[]) => void;
  className?: string;
  disabled?: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  propertyId,
  maxVideos = 3,
  onVideosChange,
  className = '',
  disabled = false
}) => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Traiter une vidéo (validation + upload)
  const processVideo = useCallback(async (video: VideoFile) => {
    try {
      setIsUploading(true);
      
      // Mise à jour du statut
      updateVideoStatus(video.id, 'validating', 0);

      // Validation
      const validation = await VideoService.validateVideo(video.file);
      if (!validation.isValid) {
        updateVideoStatus(video.id, 'error', 0, validation.errors.join(', '));
        return;
      }

      // Générer la miniature
      const thumbnail = await VideoService.generateThumbnail(video.file);
      updateVideoThumbnail(video.id, thumbnail, validation.duration);

      // Upload
      updateVideoStatus(video.id, 'uploading', 0);
      
      const videoUrl = await VideoService.uploadVideo(
        video.file,
        propertyId,
        (progress: VideoUploadProgress) => {
          updateVideoStatus(video.id, 'uploading', progress.progress);
        }
      );

      // Succès
      updateVideoStatus(video.id, 'uploaded', 100);
      updateVideoUrl(video.id, videoUrl);
      
      // Notifier le parent
      const uploadedVideos = videos
        .filter(v => v.status === 'uploaded' && v.url)
        .map(v => v.url!);
      uploadedVideos.push(videoUrl);
      onVideosChange?.(uploadedVideos);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      updateVideoStatus(video.id, 'error', 0, errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [propertyId, videos, onVideosChange, updateVideoStatus, updateVideoThumbnail, updateVideoUrl]);

  // Gestion du drag & drop
  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));

    for (const file of videoFiles) {
      if (videos.length >= maxVideos) {
        alert(`Vous ne pouvez ajouter que ${maxVideos} vidéos maximum`);
        break;
      }
      
      const newVideo: VideoFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0
      };

      setVideos(prev => [...prev, newVideo]);
      
      await processVideo(newVideo);
    }
  }, [videos.length, maxVideos, processVideo, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    disabled: disabled || videos.length >= maxVideos,
    multiple: true
  });

  // Mettre à jour le statut d'une vidéo
  const updateVideoStatus = useCallback((
    id: string, 
    status: VideoFile['status'], 
    progress: number, 
    error?: string
  ) => {
    setVideos(prev => prev.map(video => 
      video.id === id 
        ? { ...video, status, progress, error }
        : video
    ));
  }, []);

  // Mettre à jour la miniature et durée
  const updateVideoThumbnail = useCallback((id: string, thumbnail: string, duration?: number) => {
    setVideos(prev => prev.map(video => 
      video.id === id 
        ? { ...video, thumbnail, duration }
        : video
    ));
  }, []);

  // Mettre à jour l'URL de la vidéo
  const updateVideoUrl = useCallback((id: string, url: string) => {
    setVideos(prev => prev.map(video => 
      video.id === id 
        ? { ...video, url }
        : video
    ));
  }, []);

  // Supprimer une vidéo
  const removeVideo = async (id: string) => {
    const video = videos.find(v => v.id === id);
    if (!video) return;

    try {
      // Supprimer du storage si uploadée
      if (video.url && video.status === 'uploaded') {
        await VideoService.deleteVideo(video.url);
      }

      // Supprimer de la liste
      setVideos(prev => prev.filter(v => v.id !== id));

      // Notifier le parent
      const remainingVideos = videos
        .filter(v => v.id !== id && v.status === 'uploaded' && v.url)
        .map(v => v.url!);
      onVideosChange?.(remainingVideos);

    } catch (error) {
      console.error('Erreur suppression vidéo:', error);
    }
  };

  // Ouvrir le sélecteur de fichiers
  const openFileSelector = () => {
    if (!disabled && videos.length < maxVideos) {
      fileInputRef.current?.click();
    }
  };

  // Formatage des durées et tailles
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-primary bg-primary/5' 
          : disabled || videos.length >= maxVideos
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-primary/50'
      }`}>
        <CardContent className="p-6">
          <div 
            {...getRootProps()} 
            className={`text-center cursor-pointer ${
              disabled || videos.length >= maxVideos ? 'cursor-not-allowed' : ''
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            <Film className={`h-12 w-12 mx-auto mb-4 ${
              disabled || videos.length >= maxVideos ? 'text-gray-300' : 'text-gray-400'
            }`} />
            
            <div className="space-y-2">
              <p className={`text-lg font-medium ${
                disabled || videos.length >= maxVideos ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {isDragActive 
                  ? 'Déposez vos vidéos ici...'
                  : videos.length >= maxVideos
                    ? `Maximum ${maxVideos} vidéos atteint`
                    : 'Glissez vos vidéos ici ou cliquez pour sélectionner'
                }
              </p>
              
              <p className="text-sm text-gray-500">
                Formats supportés: MP4, WebM, MOV, AVI
              </p>
              <p className="text-sm text-gray-500">
                Durée max: 2 minutes • Taille max: 50MB
              </p>
              
              {videos.length < maxVideos && !disabled && (
                <Button 
                  variant="outline" 
                  onClick={openFileSelector}
                  className="mt-3"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sélectionner des vidéos
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des vidéos */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Vidéos ({videos.length}/{maxVideos})
          </h4>
          
          <div className="space-y-3">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Miniature */}
                    <div className="relative w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt="Miniature vidéo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      
                      {video.duration && (
                        <Badge className="absolute bottom-1 right-1 text-xs bg-black bg-opacity-70 text-white">
                          {formatDuration(video.duration)}
                        </Badge>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {video.file.name}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(video.file.size)}
                            </span>
                            
                            {video.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(video.duration)}
                              </span>
                            )}
                          </div>

                          {/* Statut et progression */}
                          <div className="mt-2">
                            {video.status === 'pending' && (
                              <Badge variant="secondary">En attente</Badge>
                            )}
                            
                            {video.status === 'validating' && (
                              <Badge variant="secondary">Validation...</Badge>
                            )}
                            
                            {video.status === 'uploading' && (
                              <div className="space-y-1">
                                <Badge variant="secondary">Upload en cours...</Badge>
                                <Progress value={video.progress} className="h-2" />
                              </div>
                            )}
                            
                            {video.status === 'uploaded' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Uploadée
                              </Badge>
                            )}
                            
                            {video.status === 'error' && (
                              <div className="space-y-1">
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Erreur
                                </Badge>
                                {video.error && (
                                  <p className="text-xs text-red-600">{video.error}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {video.url && video.status === 'uploaded' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(video.url, '_blank')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVideo(video.id)}
                            disabled={video.status === 'uploading'}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Indicateur global */}
      {isUploading && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600">
            Upload en cours... Veuillez patienter.
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
