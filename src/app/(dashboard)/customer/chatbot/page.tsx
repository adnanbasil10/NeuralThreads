'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with the chatbot interface
const ChatbotInterface = dynamic(
  () => import('@/components/chatbot/ChatbotInterface'),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen bg-gradient-to-br from-warm-light via-stone-50 to-warm-apricot/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-warm-coral animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">Loading StyleAI...</p>
        </div>
      </div>
    ),
  }
);

export default function ChatbotPage() {
  return <ChatbotInterface />;
}


