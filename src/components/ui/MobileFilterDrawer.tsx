'use client';

import { useState, useEffect, useRef } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useSwipe } from '@/hooks/useTouchGestures';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  resultCount?: number;
  children: React.ReactNode;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = 'Filters',
  resultCount,
  children,
}: MobileFilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Swipe down to close
  const swipeHandlers = useSwipe({
    onSwipeDown: onClose,
  }, 80);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up"
        {...swipeHandlers}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white safe-area-pb">
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-transform"
          >
            Show Results{resultCount !== undefined ? ` (${resultCount})` : ''}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .safe-area-pb {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
}

// Filter trigger button for mobile
interface FilterTriggerButtonProps {
  onClick: () => void;
  activeCount?: number;
}

export function FilterTriggerButton({ onClick, activeCount = 0 }: FilterTriggerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm active:bg-gray-50 transition-colors"
    >
      <SlidersHorizontal className="w-4 h-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">Filters</span>
      {activeCount > 0 && (
        <span className="w-5 h-5 bg-indigo-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export default MobileFilterDrawer;










