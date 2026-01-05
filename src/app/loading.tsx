import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-white mb-4">Loading...</h2>
        
        {/* Loading Bar */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      </div>
    </div>
  );
}
