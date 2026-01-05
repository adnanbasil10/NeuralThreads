'use client';

import { AlertCircle, RefreshCw, WifiOff, XCircle, Lock, ServerCrash, FileQuestion } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'default' | 'inline' | 'toast' | 'fullpage';
  type?: 'error' | 'warning' | 'network' | 'auth' | 'notfound' | 'server';
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  variant = 'default',
  type = 'error',
  className = '',
}: ErrorMessageProps) {
  const icons = {
    error: AlertCircle,
    warning: AlertCircle,
    network: WifiOff,
    auth: Lock,
    notfound: FileQuestion,
    server: ServerCrash,
  };

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    network: 'bg-gray-50 border-gray-200 text-gray-800',
    auth: 'bg-orange-50 border-orange-200 text-orange-800',
    notfound: 'bg-blue-50 border-blue-200 text-blue-800',
    server: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-amber-500',
    network: 'text-gray-500',
    auth: 'text-orange-500',
    notfound: 'text-blue-500',
    server: 'text-red-500',
  };

  const Icon = icons[type];

  const defaultTitles = {
    error: 'Something went wrong',
    warning: 'Warning',
    network: 'Connection Lost',
    auth: 'Session Expired',
    notfound: 'Not Found',
    server: 'Server Error',
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-600 text-sm ${className}`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'fullpage') {
    return (
      <div className={`min-h-[50vh] flex items-center justify-center p-4 ${className}`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${colors[type].split(' ')[0]} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${iconColors[type]}`} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {title || defaultTitles[type]}
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`rounded-xl border p-4 ${colors[type]} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm opacity-90">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to get user-friendly error message
export function getErrorMessage(error: unknown): { message: string; type: ErrorMessageProps['type'] } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return { message: 'Connection lost. Please check your internet connection.', type: 'network' };
    }
    if (message.includes('401') || message.includes('unauthorized') || message.includes('session')) {
      return { message: 'Your session has expired. Please log in again.', type: 'auth' };
    }
    if (message.includes('404') || message.includes('not found')) {
      return { message: 'The requested resource was not found.', type: 'notfound' };
    }
    if (message.includes('500') || message.includes('server')) {
      return { message: 'Something went wrong on our end. Please try again later.', type: 'server' };
    }
    
    return { message: error.message, type: 'error' };
  }
  
  return { message: 'An unexpected error occurred.', type: 'error' };
}

// API Error boundary helper
export async function handleApiError(response: Response): Promise<never> {
  const status = response.status;
  
  if (status === 401) {
    throw new Error('401: Session expired');
  }
  if (status === 404) {
    throw new Error('404: Not found');
  }
  if (status >= 500) {
    throw new Error('500: Server error');
  }
  
  const data = await response.json().catch(() => ({}));
  throw new Error(data.message || `Error: ${status}`);
}

export default ErrorMessage;

