import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FullscreenNFTViewerProps {
  isOpen: boolean;
  onClose: () => void;
  nftId: string;
  nftName: string;
  nftImage: string;
  collectionName?: string;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigate?: boolean;
  currentIndex?: number;
  totalItems?: number;
}

export const FullscreenNFTViewer = ({
  isOpen,
  onClose,
  nftId,
  nftName,
  nftImage,
  collectionName,
  onNavigate,
  canNavigate = false,
  currentIndex = 1,
  totalItems = 1
}: FullscreenNFTViewerProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
          if (canNavigate && onNavigate) {
            e.preventDefault();
            onNavigate('prev');
          }
          break;
        case 'ArrowRight':
          if (canNavigate && onNavigate) {
            e.preventDefault();
            onNavigate('next');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canNavigate, onNavigate, onClose]);

  // Handle touch gestures for mobile
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    let startX = 0;
    let startY = 0;
    const threshold = 50; // minimum swipe distance

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Only handle horizontal swipes that are longer than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (canNavigate && onNavigate) {
          if (deltaX > 0) {
            onNavigate('prev');
          } else {
            onNavigate('next');
          }
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
  }, [isOpen, canNavigate, onNavigate]);

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

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = nftImage;
      link.download = `${nftName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image download started');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              NFT
            </Badge>
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
              onClick={handleDownload}
              className="text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
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
      </div>

      {/* Navigation Controls */}
      {canNavigate && (
        <>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onNavigate?.('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onNavigate?.('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Bottom Navigation Info */}
      {canNavigate && (
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

      {/* Main Image Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-20">
        <div className="relative max-w-full max-h-full">
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          
          <img
            ref={imageRef}
            src={nftImage}
            alt={nftName}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="eager"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <div className="text-center">
                <Maximize2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Image could not be loaded</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};