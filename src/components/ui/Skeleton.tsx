'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'avatar' | 'text' | 'button';
  shimmer?: boolean;
}

export const Skeleton = React.memo(function Skeleton({ className, variant = 'default', shimmer = true }: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200';
  const shimmerClasses = shimmer ? 'skeleton-shimmer' : '';
  
  const variantClasses = {
    default: 'rounded-lg',
    card: 'rounded-2xl h-64',
    avatar: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-xl h-10',
  };

  return (
    <div
      className={cn(
        baseClasses,
        shimmerClasses,
        variantClasses[variant],
        className
      )}
    />
  );
});

// Pre-built skeleton components
export const CardSkeleton = React.memo(function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      <Skeleton variant="card" className="w-full h-48" />
      <div className="p-6 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="button" className="w-24" />
        </div>
      </div>
    </div>
  );
});

export const MessageSkeleton = React.memo(function MessageSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton variant="avatar" className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/4 h-3" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
});

export const ChatListSkeleton = React.memo(function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl">
          <Skeleton variant="avatar" className="w-12 h-12" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-2/3 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
});
