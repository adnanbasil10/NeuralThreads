'use client';

import React, { memo, useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface MessageBubbleProps {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  imageUrl?: string | null;
  isRead: boolean;
  readAt?: Date | string | null;
  readBy?: string | null;
  createdAt: Date | string;
  currentUserId: string;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    userName?: string;
  }>;
  onReaction?: (messageId: string, emoji: string) => void;
  onMarkRead?: (messageId: string) => void;
}

const formatMessageTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) {
    return format(d, 'h:mm a');
  }
  if (isYesterday(d)) {
    return `Yesterday ${format(d, 'h:mm a')}`;
  }
  return format(d, 'MMM d, h:mm a');
};

export const MessageBubble = memo(function MessageBubble({
  id,
  content,
  senderId,
  senderName,
  imageUrl,
  isRead,
  readAt,
  readBy,
  createdAt,
  currentUserId,
  reactions = [],
  onReaction,
  onMarkRead,
}: MessageBubbleProps) {
  const isOwn = senderId === currentUserId;
  
  // Group reactions by emoji
  const reactionsByEmoji = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);

  // Common emojis for quick reactions
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const [showReactionPicker, setShowReactionPicker] = useState(false);

  return (
    <div
      className={`max-w-[70%] group relative ${
        isOwn
          ? 'bg-gradient-to-br from-stone-700 via-stone-800 to-stone-900 text-white rounded-2xl rounded-br-md shadow-md ml-auto'
          : 'bg-white text-stone-900 rounded-2xl rounded-bl-md shadow-sm border border-stone-200'
      }`}
      onDoubleClick={() => onReaction && setShowReactionPicker(!showReactionPicker)}
    >
      {imageUrl && (
        <div className="p-1">
          <OptimizedImage
            src={imageUrl}
            alt="Shared image"
            width={256}
            height={256}
            className="rounded-xl max-w-full max-h-64 object-cover"
            priority={false}
          />
        </div>
      )}

      {content && (
        <div className="px-4 py-2.5">
          <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
            isOwn ? 'text-white font-medium' : 'text-stone-900'
          }`}>{content}</p>
        </div>
      )}

      <div
        className={`px-4 pb-2 flex items-center gap-1 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}
      >
        <span className={`text-xs ${isOwn ? 'text-white/80' : 'text-stone-500'}`}>
          {formatMessageTime(createdAt)}
        </span>
        {isOwn && (
          <span className="text-white/80" title={isRead && readAt ? `Read at ${formatMessageTime(readAt)}` : 'Sent'}>
            {isRead ? (
              <CheckCheck className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>

      {/* Reactions */}
      {reactions.length > 0 && (
        <div className={`px-4 pb-2 flex flex-wrap gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {Object.entries(reactionsByEmoji).map(([emoji, emojiReactions]) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onReaction?.(id, emoji);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-800 rounded-full text-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors border border-stone-300 dark:border-stone-600 shadow-sm"
              title={emojiReactions.map(r => r.userName || 'User').join(', ')}
            >
              <span className="text-base">{emoji}</span>
              <span className="text-stone-700 dark:text-stone-300 font-medium">
                {emojiReactions.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Reaction Picker (double-click to show, or hover) */}
      {onReaction && (
        <div 
          className={`px-4 pb-2 flex gap-1 ${isOwn ? 'justify-end' : 'justify-start'} ${
            showReactionPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity bg-white/95 dark:bg-stone-800/95 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 p-2`}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          {quickEmojis.map((emoji) => {
            const hasReaction = reactionsByEmoji[emoji]?.some(r => r.userId === currentUserId);
            return (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(id, emoji);
                  setShowReactionPicker(false);
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-base hover:scale-110 transition-transform ${
                  hasReaction ? 'bg-amber-100 dark:bg-amber-900' : 'hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.id === nextProps.id &&
    prevProps.content === nextProps.content &&
    prevProps.isRead === nextProps.isRead &&
    prevProps.readAt === nextProps.readAt &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.senderId === nextProps.senderId &&
    JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions)
  );
});









