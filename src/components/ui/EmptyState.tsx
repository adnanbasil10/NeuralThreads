'use client';

import {
  Inbox,
  Search,
  Users,
  MessageCircle,
  ShoppingBag,
  Image,
  FileText,
  Scissors,
  Heart,
  Calendar,
  Bell,
  Sparkles,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: 'inbox' | 'search' | 'users' | 'chat' | 'wardrobe' | 'portfolio' | 'requests' | 'tailors' | 'favorites' | 'calendar' | 'notifications' | 'ai';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const icons = {
    inbox: Inbox,
    search: Search,
    users: Users,
    chat: MessageCircle,
    wardrobe: ShoppingBag,
    portfolio: Image,
    requests: FileText,
    tailors: Scissors,
    favorites: Heart,
    calendar: Calendar,
    notifications: Bell,
    ai: Sparkles,
  };

  const Icon = icons[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon container */}
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      
      {/* Description */}
      {description && (
        <p className="text-gray-500 text-sm max-w-sm mb-6">{description}</p>
      )}
      
      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-shadow"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoDesignersFound({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon="users"
      title="No designers found"
      description="Try adjusting your filters or search criteria to find designers."
      action={onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
    />
  );
}

export function NoTailorsFound({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon="tailors"
      title="No tailors found"
      description="No tailors are available in your area. Try changing your location."
      action={onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
    />
  );
}

export function NoChatsFound({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      icon="chat"
      title="No conversations yet"
      description="Start a conversation with a designer to discuss your fashion needs."
      action={onStartChat ? { label: 'Find Designers', onClick: onStartChat } : undefined}
    />
  );
}

export function NoMessagesFound() {
  return (
    <EmptyState
      icon="chat"
      title="No messages yet"
      description="Send a message to start the conversation."
    />
  );
}

export function NoPortfolioItems({ onAddItem }: { onAddItem?: () => void }) {
  return (
    <EmptyState
      icon="portfolio"
      title="No portfolio items"
      description="Add your work to showcase your designs to potential customers."
      action={onAddItem ? { label: 'Add Item', onClick: onAddItem } : undefined}
    />
  );
}

export function NoWardrobeItems({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon="wardrobe"
      title="Your wardrobe is empty"
      description="Upload your clothes to get AI-powered outfit suggestions."
      action={onUpload ? { label: 'Upload Clothes', onClick: onUpload } : undefined}
    />
  );
}

export function NoRequestsFound() {
  return (
    <EmptyState
      icon="requests"
      title="No requests yet"
      description="You'll see alteration requests from customers here."
    />
  );
}

export function NoSearchResults({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description="We couldn't find anything matching your search. Try different keywords."
      action={onClear ? { label: 'Clear Search', onClick: onClear } : undefined}
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon="notifications"
      title="All caught up!"
      description="You have no new notifications."
    />
  );
}

export default EmptyState;









