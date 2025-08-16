import { useState, useRef, useEffect } from "react";

interface ImageLazyLoadProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackSrc?: string;
}

export const ImageLazyLoad = ({ 
  src, 
  alt, 
  className = "", 
  loading = "lazy",
  decoding = "async",
  onError,
  onLoad,
  fallbackSrc = "/images/og-anime.jpg"
}: ImageLazyLoadProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading === "eager" && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, [loading]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (imgRef.current && !hasError) {
      imgRef.current.src = fallbackSrc;
    }
    onError?.(e);
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && loading === "lazy" && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse rounded" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${!isLoaded && loading === "lazy" ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      />
    </div>
  );
};