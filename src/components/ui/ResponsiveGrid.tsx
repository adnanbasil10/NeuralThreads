'use client';

import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = '',
}: ResponsiveGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };

  const colClasses = [
    cols.default ? gridCols[cols.default as keyof typeof gridCols] : 'grid-cols-1',
    cols.sm ? `sm:${gridCols[cols.sm as keyof typeof gridCols]}` : '',
    cols.md ? `md:${gridCols[cols.md as keyof typeof gridCols]}` : '',
    cols.lg ? `lg:${gridCols[cols.lg as keyof typeof gridCols]}` : '',
    cols.xl ? `xl:${gridCols[cols.xl as keyof typeof gridCols]}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${colClasses} ${gapClasses[gap as keyof typeof gapClasses] || 'gap-4'} ${className}`}>
      {children}
    </div>
  );
}

// Preset grids for common use cases
export function DesignerGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function TailorGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function PortfolioGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function WardrobeGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function ChatListGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col divide-y divide-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export default ResponsiveGrid;










