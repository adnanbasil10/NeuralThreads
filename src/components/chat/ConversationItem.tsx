'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';

interface ConversationItemProps {
  chatId: string;
  otherUserName: string;
  otherUserInitials: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  isActive: boolean;
  basePath: string;
}

export const ConversationItem = memo(function ConversationItem({
  chatId,
  otherUserName,
  otherUserInitials,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isOnline,
  isActive,
  basePath,
}: ConversationItemProps) {
  return (
    <Link
      href={`${basePath}/${chatId}`}
      className={`flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors ${
        isActive ? 'bg-warm-light border-l-4 border-warm-coral' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-warm-apricot to-warm-rose rounded-full flex items-center justify-center text-white font-semibold shadow-md">
          {otherUserInitials}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-stone-900 truncate">
            {otherUserName}
          </h3>
          {lastMessageTime && (
            <span className="text-xs text-stone-400 flex-shrink-0">
              {formatDistanceToNow(new Date(lastMessageTime), {
                addSuffix: false,
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p
            className={`text-sm truncate flex-1 ${
              unreadCount > 0 ? 'text-stone-900 font-medium' : 'text-stone-500'
            }`}
          >
            {lastMessage || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-warm-coral text-white text-xs font-semibold rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.lastMessage === nextProps.lastMessage &&
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.isOnline === nextProps.isOnline &&
    prevProps.isActive === nextProps.isActive
  );
});









