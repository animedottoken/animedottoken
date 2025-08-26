import React from 'react';
import { Play, Volume2, Maximize2 } from 'lucide-react';
import { Badge } from './badge';

interface MediaPreviewProps {
  file: File;
  previewUrl?: string;
  className?: string;
  aspectRatio?: number;
  showBadge?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  previewUrl,
  className = '',
  aspectRatio = 1,
  showBadge = true
}) => {
  const mediaType = file.type;
  const isImage = mediaType.startsWith('image/');
  const isVideo = mediaType.startsWith('video/');
  const isAudio = mediaType.startsWith('audio/');
  const is3D = mediaType.includes('gltf') || file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf');

  const getMediaTypeBadge = () => {
    if (isImage) {
      if (mediaType === 'image/gif') return { label: 'GIF', color: 'bg-purple-500' };
      return { label: 'Image', color: 'bg-blue-500' };
    }
    if (isVideo) return { label: 'Video', color: 'bg-red-500' };
    if (isAudio) return { label: 'Audio', color: 'bg-green-500' };
    if (is3D) return { label: '3D Model', color: 'bg-orange-500' };
    return { label: 'Media', color: 'bg-gray-500' };
  };

  const badge = getMediaTypeBadge();

  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`} 
      style={{ aspectRatio }}
    >
      {isImage && previewUrl && (
        <img
          src={previewUrl}
          alt="Media preview"
          className="w-full h-full object-cover"
        />
      )}

      {isVideo && previewUrl && (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          <video
            src={previewUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            controls={false}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-white/90 rounded-full p-3">
              <Play className="h-6 w-6 text-black" fill="currentColor" />
            </div>
          </div>
        </div>
      )}

      {isAudio && (
        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex flex-col items-center justify-center text-center p-4">
          <Volume2 className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">Audio File</p>
          <p className="text-xs text-muted-foreground truncate w-full">{file.name}</p>
          {previewUrl && (
            <audio controls className="mt-3 w-full max-w-48">
              <source src={previewUrl} type={file.type} />
            </audio>
          )}
        </div>
      )}

      {is3D && (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex flex-col items-center justify-center text-center p-4">
          <Maximize2 className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">3D Model</p>
          <p className="text-xs text-muted-foreground truncate w-full">{file.name}</p>
          <p className="text-xs text-muted-foreground mt-2">GLB/GLTF format</p>
        </div>
      )}

      {!isImage && !isVideo && !isAudio && !is3D && (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Unsupported format</p>
            <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
          </div>
        </div>
      )}

      {showBadge && (
        <Badge className={`absolute top-2 left-2 ${badge.color} text-white text-xs`}>
          {badge.label}
        </Badge>
      )}
    </div>
  );
};

MediaPreview.displayName = "MediaPreview";