'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import { Loader2, MessageCircle } from 'lucide-react';
import {
  connectSocket,
  onUserOnline,
  onUserOffline,
} from '@/lib/socket/client';
import { useUser } from '@/contexts/UserContext';

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
  senderId: string;
  senderName?: string;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.chatId as string;
  const { user, isLoading: userLoading } = useUser();

  // Validate chatId early
  useEffect(() => {
    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      console.error('Invalid chatId from URL params:', chatId);
      router.push('/customer/chats');
    }
  }, [chatId, router]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Fetch chats and messages
  useEffect(() => {
    // Validate chatId early - don't fetch if invalid
    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      console.error('Invalid chatId from params:', chatId);
      setIsLoading(false);
      router.push('/customer/chats');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch chats
        const chatsRes = await fetch('/api/chat', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!chatsRes.ok) {
          const errorText = await chatsRes.text();
          console.error('Failed to fetch chats:', chatsRes.status, chatsRes.statusText, errorText);
          setChats([]);
          setCurrentChat(null);
          setIsLoading(false);
          return;
        }
        
        const contentType = chatsRes.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from chat API');
          setChats([]);
          setCurrentChat(null);
          setIsLoading(false);
          return;
        }
        
        const chatsData = await chatsRes.json();

        if (chatsData.success && chatsData.data) {
          // Transform API response
          const transformedChats = chatsData.data.map((chat: {
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
          const chat = transformedChats.find((c: Chat) => c.id === chatId);
          setCurrentChat(chat || null);
        } else {
          setChats([]);
          setCurrentChat(null);
        }

        // Fetch messages with full history
        const messagesRes = await fetch(`/api/chat/messages?chatId=${chatId}&limit=50`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!messagesRes.ok) {
          const errorText = await messagesRes.text();
          console.error('Failed to fetch messages:', messagesRes.status, messagesRes.statusText, errorText);
          setMessages([]);
        } else {
          const contentType = messagesRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Non-JSON response from messages API');
            setMessages([]);
          } else {
            const messagesData = await messagesRes.json();

            if (messagesData.success && messagesData.data) {
              // Transform messages to match our Message interface
              const transformedMessages = messagesData.data.map((msg: {
                id: string;
                content: string;
                senderId: string;
                sender?: { name?: string };
                imageUrl?: string | null;
                isRead?: boolean;
                createdAt: string;
              }) => ({
                id: msg.id,
                content: msg.content,
                senderId: msg.senderId,
                senderName: msg.sender?.name || 'Unknown',
                imageUrl: msg.imageUrl || null,
                isRead: msg.isRead || false,
                createdAt: msg.createdAt,
              }));
              setMessages(transformedMessages);
            } else {
              setMessages([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setChats([]);
        setCurrentChat(null);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [chatId, user]);

  // Connect to socket
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
  }, [user]);

  // Get the other user (designer or tailor for customer view)
  const getOtherUser = (chat: Chat | null) => {
    if (!chat) return null;
    return chat.designer || chat.tailor || null;
  };

  const otherUser = getOtherUser(currentChat);
  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser.user.id) : false;

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
        <p className="text-stone-600">Please log in to view chats</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 -ml-6 lg:-ml-8 -mr-8 overflow-hidden">
      <div className="h-full flex">
        {/* Chat List - Hidden on mobile when viewing chat */}
        <div className="hidden lg:block lg:w-1/3 border-r border-stone-200 bg-white overflow-hidden flex flex-col">
          <ChatList
            chats={chats}
            currentUserId={user.id}
            userRole={user.role as "CUSTOMER" | "DESIGNER"}
            activeChatId={chatId}
            onlineUsers={onlineUsers}
            basePath="/customer/chats"
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 lg:w-2/3 bg-white overflow-hidden flex flex-col">
          {currentChat && otherUser ? (
            <ChatWindow
              chatId={chatId}
              currentUserId={user.id}
              currentUserName={user.name}
              otherUserName={otherUser.user.name}
              otherUserId={otherUser.user.id}
              isOnline={isOtherUserOnline}
              initialMessages={messages}
              onBack={() => router.push('/customer/chats')}
              otherUserRole={currentChat.designerId ? 'DESIGNER' : currentChat.tailorId ? 'TAILOR' : undefined}
              designerId={currentChat.designerId || undefined}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-stone-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600 font-medium">Chat not found</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
