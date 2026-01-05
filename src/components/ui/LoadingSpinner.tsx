'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  variant?: 'default' | 'gradient' | 'dots';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label,
  variant = 'gradient',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {label && (
          <p className={`${textSizes[size]} text-gray-500 font-medium`}>{label}</p>
        )}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className={`${sizeClasses[size]} relative`}>
          {/* Gradient spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: '#6366f1',
              borderRightColor: '#8b5cf6',
              animationDuration: '0.8s',
            }}
          />
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 animate-pulse" />
        </div>
        {label && (
          <p className={`${textSizes[size]} text-gray-500 font-medium`}>{label}</p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-indigo-600 animate-spin`} />
      {label && (
        <p className={`${textSizes[size]} text-gray-500 font-medium`}>{label}</p>
      )}
    </div>
  );
}

// Full page loading overlay
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="lg" label={label} variant="gradient" />
    </div>
  );
}

// Inline loading (for buttons, etc.)
export function InlineLoader({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}

// Section loading (for card/section content)
export function SectionLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="md" label={label} variant="gradient" />
    </div>
  );
}

export default LoadingSpinner;









