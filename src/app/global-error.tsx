'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4" suppressHydrationWarning>
        <div className="text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Icon */}
          <div className="w-24 h-24 mx-auto mb-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold mb-4">Critical Error</h1>
          <p className="text-gray-400 mb-8">
            A critical error has occurred. We&apos;re sorry for the inconvenience.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={reset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            
            <a
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

