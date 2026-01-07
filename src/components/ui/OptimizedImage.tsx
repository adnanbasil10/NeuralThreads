'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Skeleton } from './Skeleton';
import { Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onClick?: () => void;
}

export const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  objectFit = 'cover',
  onClick,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(priority);

  // Validate src URL first
  const isValidUrl = src && typeof src === 'string' && src.trim() !== '' &&
    (src.startsWith('http') || src.startsWith('https') || src.startsWith('data:') || src.startsWith('/'));

  // Process image URL - MUST be defined after validation, before any conditional returns
  const processedSrc = useMemo(() => {
    if (!src || typeof src !== 'string') return '';

    // Convert to WebP format via Cloudinary if it's a Cloudinary URL
    if (src.includes('cloudinary.com') && !src.includes('f_webp')) {
      return src.replace(/\/upload\//, '/upload/f_webp,q_auto/');
    }

    return src;
  }, [src]);

  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  if (!src || !isValidUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 ${className}`}
        style={fill ? { width: '100%', height: '100%' } : { width, height }}
      >
        <ImageIcon className="w-8 h-8 text-stone-400" />
      </div>
    );
  }

  if (hasError) {
    // Try fallback to regular img tag on error
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={processedSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${className}`}
        style={{
          objectFit,
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
        onError={(e) => {
          // Hide broken image and show placeholder
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative ${className}`}
      style={fill ? { width: '100%', height: '100%' } : undefined}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton variant={fill ? 'card' : 'default'} className="w-full h-full" />
        </div>
      )}
      {isInView && processedSrc && (
        <>
          {useFallback ? (
            // Fallback to regular img tag if Next.js Image fails
            <img
              src={processedSrc}
              alt={alt}
              className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
                }`}
              style={{
                objectFit,
                width: fill ? '100%' : width,
                height: fill ? '100%' : height,
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          ) : (
            <Image
              src={processedSrc}
              alt={alt}
              width={fill ? undefined : width}
              height={fill ? undefined : height}
              fill={fill}
              sizes={sizes}
              priority={priority}
              quality={85}
              unoptimized={processedSrc.startsWith('data:') || processedSrc.includes('unsplash.com')}
              className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
                }`}
              style={{ objectFit }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                // Try fallback img tag if Next.js Image fails
                if (!useFallback) {
                  setUseFallback(true);
                  setIsLoading(true);
                } else {
                  setIsLoading(false);
                  setHasError(true);
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
});


