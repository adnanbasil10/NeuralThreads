'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, Loader2 } from 'lucide-react';
import { connectSocket, onUserOnline, onUserOffline } from '@/lib/socket/client';
import { useUser } from '@/contexts/UserContext';

// Dynamic import to avoid webpack module resolution issues
const ChatList = dynamic(() => import('@/components/chat/ChatList'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 text-warm-coral animate-spin" />
    </div>
  ),
});

interface ChatUser {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  profilePhoto?: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
}

interface Chat {
  id: string;
  customerId: string;
  designerId?: string | null;
  tailorId?: string | null;
  customer?: ChatUser;
  designer?: ChatUser;
  tailor?: ChatUser;
  messages: Message[];
  unreadCount: number;
  updatedAt: string;
}

// This will be set from UserContext

// Placeholder chats data removed - using API data instead

export default function CustomerChatsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Fetch all chats
        const response = await fetch('/api/chat', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch chats:', response.status, response.statusText, errorText);
          setChats([]);
          setIsLoading(false);
          return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from chat API');
          setChats([]);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();

        if (data.success && data.data) {
          // Transform API response to match our Chat interface
          const transformedChats = data.data.map((chat: {
            id: string;
            customerId: string;
            designerId?: string | null;
            tailorId?: string | null;
            customer?: ChatUser;
            designer?: ChatUser;
            tailor?: ChatUser;
            messages?: Message[];
            unreadCount?: number;
            updatedAt: string;
          }) => ({
            id: chat.id,
            customerId: chat.customerId,
            designerId: chat.designerId || null,
            tailorId: chat.tailorId || null,
            customer: chat.customer ? {
              id: chat.customer.id,
              user: chat.customer.user,
              profilePhoto: chat.customer.profilePhoto,
            } : undefined,
            designer: chat.designer ? {
              id: chat.designer.id,
              user: chat.designer.user,
              profilePhoto: chat.designer.profilePhoto,
            } : undefined,
            tailor: chat.tailor ? {
              id: chat.tailor.id,
              user: chat.tailor.user,
              profilePhoto: chat.tailor.profilePhoto,
            } : undefined,
            messages: chat.messages || [],
            unreadCount: chat.unreadCount || 0,
            updatedAt: chat.updatedAt,
          }));
          setChats(transformedChats);
        } else {
          setChats([]); // Empty array instead of placeholder
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChats([]); // Empty array instead of placeholder
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not router

  // Connect to socket and track online users
  useEffect(() => {
    if (!user) return;

    connectSocket(user.id, user.name, user.role);

    const unsubOnline = onUserOnline((data) => {
      const userId = (data as { odell?: string; userId?: string; id?: string }).userId || 
                     (data as { odell?: string; userId?: string; id?: string }).id || 
                     (data as { odell?: string; userName?: string }).odell;
      if (userId) {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      }
    });

    const unsubOffline = onUserOffline((data) => {
      const userId = (data as { odell?: string; userId?: string; id?: string }).userId || 
                     (data as { odell?: string; userId?: string; id?: string }).id || 
                     (data as { odell?: string }).odell;
      if (userId) {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      }
    });

    return () => {
      unsubOnline();
      unsubOffline();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to avoid unnecessary re-connections

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600 font-medium">Please log in to view chats</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 -ml-6 lg:-ml-8 -mr-8 overflow-hidden">
      <div className="h-full flex">
        {/* Chat List */}
        <div className="w-full lg:w-1/3 border-r border-stone-200 bg-white overflow-hidden flex flex-col">
          <ChatList
            chats={chats}
            currentUserId={user?.id || ''}
            userRole={(user?.role || 'CUSTOMER') as "CUSTOMER" | "DESIGNER"}
            onlineUsers={onlineUsers}
            basePath="/customer/chats"
          />
        </div>

        {/* Empty State for Desktop */}
        <div className="hidden lg:flex lg:w-2/3 bg-white items-center justify-center">
          <div className="text-center p-8">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-stone-400" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">
              Select a Conversation
            </h3>
            <p className="text-stone-600 max-w-sm">
              Choose a conversation from the list to start chatting with designers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
