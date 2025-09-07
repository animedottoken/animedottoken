import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Share2, ShoppingCart, Gavel, DollarSign, Award, Volume2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface FullscreenNFTViewerProps {
  isOpen: boolean;
  onClose: () => void;
  nftImage: string;
  nftName: string;
  nftId: string;
  collectionName?: string;
  price?: number;
  currency?: string;
  isListed?: boolean;
  isOwner: boolean;
  canNavigate?: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentIndex?: number;
  totalItems?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onBuyNow?: () => void;
  onPlaceBid?: () => void;
  // Media support
  mediaUrl?: string;
  mediaType?: string;
  coverImageUrl?: string;
}

export const FullscreenNFTViewer: React.FC<FullscreenNFTViewerProps> = ({
  isOpen,
  onClose,
  nftImage,
  nftName,
  nftId,
  collectionName,
  price,
  currency = 'SOL',
  isListed,
  isOwner,
  canNavigate,
  hasNext,
  hasPrev,
  currentIndex,
  totalItems,
  onNext,
  onPrev,
  onBuyNow,
  onPlaceBid,
  mediaUrl,
  mediaType,
  coverImageUrl
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          if (canNavigate && onPrev && hasPrev) {
            e.preventDefault();
            onPrev();
          }
          break;
        case 'ArrowRight':
          if (canNavigate && onNext && hasNext) {
            e.preventDefault();
            onNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canNavigate, onNext, onPrev, hasNext, hasPrev, onClose]);

  // Handle touch gestures for mobile
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    let startX = 0;
    let startY = 0;
    const threshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold && canNavigate) {
        if (deltaX > 0 && onPrev && hasPrev) {
          onPrev();
        } else if (deltaX < 0 && onNext && hasNext) {
          onNext();
        }
      }
    };

    const overlay = overlayRef.current;
    overlay.addEventListener('touchstart', handleTouchStart);
    overlay.addEventListener('touchend', handleTouchEnd);

    return () => {
      overlay.removeEventListener('touchstart', handleTouchStart);
      overlay.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, canNavigate, onNext, onPrev, hasNext, hasPrev]);

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: nftName,
          text: `Check out this NFT: ${nftName}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Reset loading state when media changes
  useEffect(() => {
    setIsImageLoaded(false);
    setImageError(false);
    setForceFallback(false);
  }, [nftImage, mediaUrl, nftId]);

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4 pb-8">
        <div className="max-w-screen-xl mx-auto space-y-4">
          {/* Top Row - Title and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                NFT
              </Badge>
              {mediaType && (
                <Badge variant="outline" className="text-xs text-white border-white/20">
                  {mediaType.startsWith('video/') ? (
                    <><Play className="w-3 h-3 mr-1" />Video</>
                  ) : mediaType.startsWith('audio/') ? (
                    <><Volume2 className="w-3 h-3 mr-1" />Audio</>
                  ) : mediaType.includes('gltf') || mediaType.includes('glb') ? (
                    <><Maximize2 className="w-3 h-3 mr-1" />3D</>
                  ) : (
                    'Media'
                  )}
                </Badge>
              )}
              <div>
                <h2 className="text-white font-semibold text-lg">{nftName}</h2>
                {collectionName && (
                  <p className="text-white/70 text-sm">{collectionName}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Bottom Row - Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {isListed && price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">{price.toFixed(4)} {currency}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons - Only show if not owner */}
            {!isOwner && isListed && price && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to buy "${nftName}" for ${price.toFixed(4)} ${currency}?`)) {
                      onBuyNow?.();
                    }
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  onClick={onPlaceBid}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  Place Bid
                </Button>
              </div>
            )}
            
            {/* Owner indicator */}
            {isOwner && (
              <Badge variant="outline" className="text-white border-white/20">
                You own this NFT
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {canNavigate && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="lg"
                onClick={onPrev}
                disabled={!hasPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-violet-400 hover:bg-violet-500/10 active:bg-violet-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-500 transition-all duration-150 h-12 w-12 disabled:opacity-30"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-black/90 text-white border-white/20">
              Previous
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="lg"
                onClick={onNext}
                disabled={!hasNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-violet-400 hover:bg-violet-500/10 active:bg-violet-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-500 transition-all duration-150 h-12 w-12 disabled:opacity-30"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-black/90 text-white border-white/20">
              Next
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Bottom Navigation Info */}
      {canNavigate && currentIndex && totalItems && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-center">
            <p className="text-white/70 text-sm">
              {currentIndex} of {totalItems}
            </p>
            <p className="text-white/50 text-xs mt-1">
              Use ← → arrows or swipe to navigate
            </p>
          </div>
        </div>
      )}

      {/* Media Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-20">
        <div 
          key={`${nftId}-${mediaUrl || nftImage}`}
          className="relative flex items-center justify-center w-full h-full max-w-[95vw] max-h-[75vh]" 
        >
          {!isImageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-lg p-6">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-sm">Loading media...</p>
              </div>
            </div>
          )}

          {/* Render different media types */}
          {mediaUrl && mediaType && !forceFallback ? (
            mediaType.startsWith('video/') ? (
              <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={imageRef as React.RefObject<HTMLVideoElement>}
                  src={mediaUrl}
                  poster={coverImageUrl || nftImage}
                  className={`w-full h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                    isImageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  controls={false}
                  loop
                  muted
                  playsInline
                  onLoadedData={() => setIsImageLoaded(true)}
                  onError={(e) => {
                    console.error('Video load error, falling back to image:', e);
                    setForceFallback(true);
                    setIsImageLoaded(false);
                    setImageError(false);
                  }}
                />
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity duration-300 hover:bg-black/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
                    if (video.paused) {
                      video.play();
                      video.controls = true;
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                >
                  <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
                    <Play className="h-8 w-8 text-black" fill="currentColor" />
                  </div>
                </div>
              </div>
            ) : mediaType.startsWith('audio/') ? (
              <div className="text-center">
                {(coverImageUrl || nftImage) && (
                  <img
                    ref={imageRef as React.RefObject<HTMLImageElement>}
                    src={coverImageUrl || nftImage}
                    alt={nftName}
                    className={`w-full h-full object-contain rounded-lg shadow-2xl mb-6 transition-opacity duration-300 ${
                      isImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                )}
                <audio controls className="w-full max-w-md">
                  <source src={mediaUrl} type={mediaType} />
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : mediaType.includes('gltf') || mediaType.includes('glb') ? (
              <div className="text-center">
                {(coverImageUrl || nftImage) && (
                  <img
                    ref={imageRef as React.RefObject<HTMLImageElement>}
                    src={coverImageUrl || nftImage}
                    alt={nftName}
                    className={`w-full h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                      isImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                )}
                <div className="mt-4 text-white/80">
                  <p className="text-lg font-medium">3D Model</p>
                  <p className="text-sm">Interactive 3D viewer coming soon</p>
                </div>
              </div>
            ) : (
              // Fallback to image for unknown media types
              <img
                ref={imageRef as React.RefObject<HTMLImageElement>}
                src={mediaUrl}
                alt={nftName}
                className={`w-full h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )
          ) : (
            // Standard image display or fallback from video error
            <img
              ref={imageRef as React.RefObject<HTMLImageElement>}
              src={coverImageUrl || nftImage}
              alt={nftName}
              className={`w-full h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Error State */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <div className="text-center bg-black/50 rounded-lg p-6">
                <Maximize2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg mb-2">Media not available</p>
                <p className="text-sm text-gray-300 mb-4">The media file could not be displayed</p>
                {(mediaUrl || nftImage) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = mediaUrl || nftImage;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    Open media in new tab
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};