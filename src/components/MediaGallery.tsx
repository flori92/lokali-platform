import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Download
} from 'lucide-react';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  duration?: number; // en secondes pour les vidéos
  size?: number; // en bytes
}

interface MediaGalleryProps {
  media: MediaItem[];
  className?: string;
  showThumbnails?: boolean;
  allowDownload?: boolean;
  maxVideoSize?: number; // en MB
  maxVideoDuration?: number; // en secondes
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  className = '',
  showThumbnails = true,
  allowDownload = false,
  maxVideoSize = 50, // 50MB par défaut
  maxVideoDuration = 120 // 2 minutes par défaut
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentMedia = media[currentIndex];

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    resetMediaState();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    resetMediaState();
  };

  const resetMediaState = () => {
    setIsZoomed(false);
    setZoomLevel(1);
    setIsPlaying(false);
    setVideoProgress(0);
  };

  // Gestion du zoom pour les images
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    if (zoomLevel <= 1) setIsZoomed(false);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
  };

  // Gestion vidéo
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const seekVideo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  // Téléchargement
  const handleDownload = async () => {
    if (!allowDownload || !currentMedia) return;
    
    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentMedia.title || `media-${currentMedia.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  // Formatage du temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Validation des vidéos
  const isVideoValid = (mediaItem: MediaItem) => {
    if (mediaItem.type !== 'video') return true;
    
    const sizeValid = !mediaItem.size || (mediaItem.size / (1024 * 1024)) <= maxVideoSize;
    const durationValid = !mediaItem.duration || mediaItem.duration <= maxVideoDuration;
    
    return sizeValid && durationValid;
  };

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setIsModalOpen(false);
          break;
        case ' ':
          e.preventDefault();
          if (currentMedia?.type === 'video') {
            togglePlay();
          }
          break;
        case '+':
        case '=':
          if (currentMedia?.type === 'image') {
            handleZoomIn();
          }
          break;
        case '-':
          if (currentMedia?.type === 'image') {
            handleZoomOut();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, currentMedia, isPlaying]);

  if (!media || media.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Aucun média disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Galerie principale */}
      <div className={`space-y-4 ${className}`}>
        {/* Média principal */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
          {currentMedia?.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt={currentMedia.title || 'Image'}
              className="w-full h-full object-cover transition-transform hover:scale-105"
              onClick={() => setIsModalOpen(true)}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="relative w-full h-full">
              <video
                src={currentMedia?.url}
                poster={currentMedia?.thumbnail}
                className="w-full h-full object-cover"
                onClick={() => setIsModalOpen(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-16 w-16 text-white" />
              </div>
              {currentMedia?.duration && (
                <Badge className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white">
                  {formatTime(currentMedia.duration)}
                </Badge>
              )}
              {!isVideoValid(currentMedia) && (
                <Badge variant="destructive" className="absolute top-2 left-2">
                  Vidéo non conforme
                </Badge>
              )}
            </div>
          )}
          
          {/* Contrôles de navigation */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Indicateur de position */}
          {media.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <Badge variant="secondary" className="bg-black bg-opacity-70 text-white">
                {currentIndex + 1} / {media.length}
              </Badge>
            </div>
          )}

          {/* Bouton plein écran */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsModalOpen(true)}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Miniatures */}
        {showThumbnails && media.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {media.map((item, index) => (
              <div
                key={item.id}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-primary shadow-lg' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  resetMediaState();
                }}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Miniature ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={item.thumbnail || '/placeholder.svg'}
                      alt={`Miniature vidéo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal plein écran */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Contrôles supérieurs */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentIndex + 1} / {media.length}
                </Badge>
                {currentMedia?.title && (
                  <span className="text-white font-medium">{currentMedia.title}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {allowDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contenu média */}
            <div className="relative max-w-full max-h-full">
              {currentMedia?.type === 'image' ? (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={currentMedia.url}
                    alt={currentMedia.title || 'Image'}
                    className="max-w-full max-h-[80vh] object-contain transition-transform"
                    style={{ transform: `scale(${zoomLevel})` }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  
                  {/* Contrôles de zoom */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-70 rounded-lg p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-sm min-w-[3rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={resetZoom}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={currentMedia?.url}
                    className="max-w-full max-h-[80vh] object-contain"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls={false}
                  />
                  
                  {/* Contrôles vidéo personnalisés */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                        onClick={togglePlay}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                        onClick={toggleMute}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      
                      <div className="flex-1 mx-3">
                        <div 
                          className="h-2 bg-gray-600 rounded-full cursor-pointer"
                          onClick={seekVideo}
                        >
                          <div 
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                      </div>
                      
                      <span className="text-white text-sm">
                        {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoDuration)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation latérale */}
            {media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MediaGallery;
