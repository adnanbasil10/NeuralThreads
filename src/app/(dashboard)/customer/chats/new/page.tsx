'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useSecureFetch } from '@/hooks';

export default function NewChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();
  const { secureFetch } = useSecureFetch();

  useEffect(() => {
    const createChat = async () => {
      if (userLoading || !user) return;

      const designerId = searchParams.get('designer');
      const tailorId = searchParams.get('tailor');

      if (!designerId && !tailorId) {
        // No designer or tailor specified, redirect to chats list
        router.push('/customer/chats');
        return;
      }

      try {
        console.log('Creating chat with:', { designerId, tailorId });
        
        // Create new chat using secureFetch
        const response = await secureFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designerId: designerId || undefined,
            tailorId: tailorId || undefined,
          }),
        });

        console.log('Chat creation response status:', response.status, response.statusText);

        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text();
          console.error('❌ Non-JSON response from chat creation API:', errorText);
          alert('Failed to create chat. Please try again.');
          router.push('/customer/chats');
          return;
        }

        // Read response body once
        const data = await response.json();
        console.log('Chat creation response data:', data);

        if (!response.ok) {
          const errorMessage = data?.error || `Failed to create chat (${response.status})`;
          console.error('❌ Failed to create chat:', response.status, errorMessage);
          alert(`Failed to create chat: ${errorMessage}`);
          router.push('/customer/chats');
          return;
        }

        if (data.success && data.data) {
          console.log('✅ Chat created successfully:', data.data.id);
          // Redirect to the chat
          router.push(`/customer/chats/${data.data.id}`);
        } else {
          // Error creating chat, redirect to chats list
          const errorMessage = data?.error || 'Unknown error occurred';
          console.error('❌ Error creating chat:', errorMessage);
          alert(`Failed to create chat: ${errorMessage}`);
          router.push('/customer/chats');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error creating chat:', errorMessage, error);
        alert(`Failed to create chat: ${errorMessage}. Please try again.`);
        router.push('/customer/chats');
      }
    };

    createChat();
  }, [user, userLoading, searchParams, router, secureFetch]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Creating chat...</p>
      </div>
    </div>
  );
}




