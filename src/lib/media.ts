/**
 * Media detection utilities for determining NFT media types from file URLs
 */

export type MediaKind = 'static' | 'video' | 'audio' | '3d' | 'animated';

/**
 * Detects media kind from file URL extension and MIME type
 */
export const detectMediaKind = (imageUrl?: string, animationUrl?: string, mediaType?: string): MediaKind => {
  // If no animation URL, it's static
  if (!animationUrl && !imageUrl) return 'static';
  
  const url = animationUrl || imageUrl || '';
  const lowerUrl = url.toLowerCase();
  const lowerMediaType = (mediaType || '').toLowerCase();
  
  // Check MIME type first (more reliable)
  if (lowerMediaType) {
    if (lowerMediaType.startsWith('video/')) return 'video';
    if (lowerMediaType.startsWith('audio/')) return 'audio';
    if (lowerMediaType.includes('gltf') || lowerMediaType.includes('glb')) return '3d';
  }
  
  // Fallback to file extension detection
  if (animationUrl) {
    // Video formats
    if (lowerUrl.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v)$/)) return 'video';
    
    // Audio formats
    if (lowerUrl.match(/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/)) return 'audio';
    
    // 3D formats
    if (lowerUrl.match(/\.(gltf|glb|obj|fbx|dae|3ds|ply|stl)$/)) return '3d';
    
    // Animated image formats
    if (lowerUrl.match(/\.(gif|webp)$/)) return 'animated';
    
    // If it has animation_url but doesn't match above, treat as animated
    return 'animated';
  }
  
  // Only image URL, check if it's animated
  if (lowerUrl.match(/\.(gif|webp)$/)) return 'animated';
  
  return 'static';
};

/**
 * Gets media type display info for UI
 */
export const getMediaTypeDisplay = (kind: MediaKind) => {
  switch (kind) {
    case 'video':
      return { label: 'Video', color: 'bg-red-500', icon: 'Play' };
    case 'audio':
      return { label: 'Audio', color: 'bg-green-500', icon: 'Volume2' };
    case '3d':
      return { label: '3D', color: 'bg-orange-500', icon: 'Maximize2' };
    case 'animated':
      return { label: 'Animated', color: 'bg-blue-500', icon: 'Image' };
    case 'static':
    default:
      return null; // No badge for static images
  }
};