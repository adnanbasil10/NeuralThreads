'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, Clock, Circle, Menu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSidebar } from '@/contexts/SidebarContext';

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

interface ChatListProps {
  chats: Chat[];
  currentUserId: string;
  userRole: 'CUSTOMER' | 'DESIGNER';
  activeChatId?: string;
  onlineUsers?: string[];
  basePath?: string;
}

export default function ChatList({
  chats,
  currentUserId,
  userRole,
  activeChatId,
  onlineUsers = [],
  basePath = '/customer/chats',
}: ChatListProps) {
  const { toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'unread'>('recent');

  const getOtherUser = useCallback((chat: Chat): ChatUser | undefined => {
    if (userRole === 'CUSTOMER') {
      return chat.designer || chat.tailor || undefined;
    }
    return chat.customer || undefined;
  }, [userRole]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Memoize filtered and sorted chats to prevent recalculation on every render
  const filteredChats = useMemo(() => {
    return chats
      .filter((chat) => {
        const otherUser = getOtherUser(chat);
        if (!otherUser) return false;
        return otherUser.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        if (sortBy === 'unread') {
          // Unread chats first
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        }
        // Then by recent
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [chats, searchQuery, sortBy, getOtherUser]);

  // Memoize total unread count
  const totalUnread = useMemo(() => {
    return chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  }, [chats]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-stone-200">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
              title="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-stone-700" />
            </button>
            <h2 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-warm-taupe" />
              Messages
              {totalUnread > 0 && (
                <span className="px-2.5 py-1 bg-warm-coral text-white text-xs font-semibold rounded-full shadow-sm">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900 placeholder:text-stone-400"
          />
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              sortBy === 'recent'
                ? 'bg-warm-light text-warm-taupe shadow-sm border border-warm-apricot'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('unread')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              sortBy === 'unread'
                ? 'bg-warm-light text-warm-taupe shadow-sm border border-warm-apricot'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Unread First
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-stone-50">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-600 font-medium">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {filteredChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              if (!otherUser) return null;

              const isOnline = onlineUsers.includes(otherUser.user.id);
              const lastMessage = chat.messages[0];
              const isActive = chat.id === activeChatId;

              return (
                <Link
                  key={chat.id}
                  href={`${basePath}/${chat.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-white transition-colors ${
                    isActive ? 'bg-warm-light border-l-4 border-warm-coral shadow-sm' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {getInitials(otherUser.user.name)}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate ${
                        isActive ? 'text-warm-taupe' : 'text-stone-900'
                      }`}>
                        {otherUser.user.name}
                      </h3>
                      {lastMessage && (
                        <span className={`text-xs flex-shrink-0 ${
                          isActive ? 'text-warm-taupe' : 'text-stone-500'
                        }`}>
                          {formatDistanceToNow(new Date(lastMessage.createdAt), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm truncate flex-1 ${
                          chat.unreadCount > 0 
                            ? 'text-stone-900 font-medium' 
                            : isActive 
                              ? 'text-stone-600' 
                              : 'text-stone-500'
                        }`}
                      >
                        {lastMessage?.content || 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-warm-coral text-white text-xs font-semibold rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


