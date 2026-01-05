'use client';

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
  placeholder?: 'blur' | 'skeleton' | 'icon';
  priority?: boolean;
  sizes?: string;
  onClick?: () => void;
}

export function ResponsiveImage({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
  objectFit = 'cover',
  placeholder = 'skeleton',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onClick,
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[16/9]',
    auto: '',
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 ${aspectRatioClasses[aspectRatio]} ${className}`}
      onClick={onClick}
    >
      {/* Placeholder */}
      {(isLoading || !isInView) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder === 'skeleton' && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
          )}
          {placeholder === 'icon' && (
            <ImageIcon className="w-8 h-8 text-gray-300" />
          )}
          {placeholder === 'blur' && (
            <div className="absolute inset-0 bg-gray-200 backdrop-blur-xl" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <ImageIcon className="w-8 h-8 mb-1" />
          <span className="text-xs">Failed to load</span>
        </div>
      )}

      {/* Image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`w-full h-full ${objectFitClasses[objectFit]} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

// Thumbnail variant
export function Thumbnail({
  src,
  alt,
  size = 'md',
  onClick,
}: {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
      aspectRatio="square"
      onClick={onClick}
    />
  );
}

// Avatar variant
export function Avatar({
  src,
  alt,
  size = 'md',
  fallback,
}: {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (!src) {
    const initials = fallback || alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold`}>
        {initials}
      </div>
    );
  }

  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full`}
      aspectRatio="square"
    />
  );
}

export default ResponsiveImage;










