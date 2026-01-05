'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Send,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Loader2,
  Check,
  CheckCheck,
  Smile,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  getSocket,
  sendMessage,
  sendTyping,
  sendStopTyping,
  joinChat,
  leaveChat,
  onReceiveMessage,
  onUserTyping,
  onMessageRead,
  onMessageReaction,
  connectSocket,
  ChatMessage,
  TypingIndicator,
} from '@/lib/socket/client';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { useSecureFetch } from '@/hooks';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  imageUrl?: string | null;
  isRead: boolean;
  readAt?: Date | string | null;
  readBy?: string | null;
  createdAt: Date | string;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    userName?: string;
  }>;
}

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  currentUserName: string;
  otherUserName: string;
  otherUserId: string;
  isOnline?: boolean;
  initialMessages?: Message[];
  onBack?: () => void;
  otherUserRole?: 'DESIGNER' | 'TAILOR' | 'CUSTOMER';
  designerId?: string; // For design requests
}

export default function ChatWindow({
  chatId,
  currentUserId,
  currentUserName,
  otherUserName,
  otherUserId,
  isOnline = false,
  initialMessages = [],
  onBack,
  otherUserRole,
  designerId,
}: ChatWindowProps) {
  const { csrfToken, refreshCsrfToken } = useCsrfToken();
  const { secureFetch, isReady: isCsrfReady } = useSecureFetch();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [requestImageUrl, setRequestImageUrl] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  // Load reactions for initial messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      initialMessages.forEach((msg) => {
        if (msg.id) {
          fetch(`/api/chat/messages/${msg.id}/reactions`, {
            credentials: 'include',
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.success && result.data) {
                setMessageReactions((prev) => ({
                  ...prev,
                  [msg.id]: result.data,
                }));
              }
            })
            .catch(() => {
              // Silently fail - reactions are optional
            });
        }
      });
    }
  }, []); // Only run once on mount
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [imageToSend, setImageToSend] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [messageReactions, setMessageReactions] = useState<Record<string, Message['reactions']>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reactionFetchTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Common emojis for quick access
  const quickEmojis = ['😊', '❤️', '👍', '🎉', '✨', '🔥', '💯', '🙌'];

  // Dropzone for image upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setImageToSend(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debounced scroll to bottom to avoid excessive scrolling
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length]); // Only scroll when message count changes, not on every message update

  // Socket connection and events
  useEffect(() => {
    if (!chatId || !currentUserId) {
      console.log('[ChatWindow] Missing chatId or currentUserId, skipping socket setup');
      return;
    }

    console.log('[ChatWindow] Setting up socket connection:', { chatId, currentUserId, currentUserName });

    // Get socket instance first
    const socket = getSocket();
    
    // Set up message listener BEFORE connecting (important!)
    const unsubMessage = onReceiveMessage((message: ChatMessage) => {
      console.log('[ChatWindow] Received message via socket:', message);
      console.log('[ChatWindow] Message details:', {
        messageChatId: message.chatId,
        currentChatId: chatId,
        messageId: message.id,
        senderId: message.senderId,
        currentUserId: currentUserId,
      });
      
      if (message.chatId === chatId) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            console.log('[ChatWindow] Message already exists, skipping:', message.id);
            return prev;
          }
          
          console.log('[ChatWindow] Adding new message to state. Total messages:', prev.length + 1);
          const newMessage: Message = {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: message.senderName || 'Unknown',
            imageUrl: message.imageUrl || null,
            isRead: message.isRead || false,
            readAt: message.readAt || null,
            readBy: message.readBy || null,
            createdAt: message.createdAt || new Date().toISOString(),
            reactions: message.reactions || [],
          };
          
          // Insert message in chronological order (by createdAt)
          const newMessages = [...prev, newMessage];
          newMessages.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB; // Ascending order (oldest first)
          });
          
          return newMessages;
        });
        // Scroll to bottom when new message arrives
        setTimeout(() => scrollToBottom(), 100);
      } else {
        console.log('[ChatWindow] Message chatId mismatch:', message.chatId, 'vs', chatId);
      }
    });
    
    // Connect socket with user data AFTER setting up listeners
    connectSocket(currentUserId, currentUserName, 'USER');

    // Listen for typing indicators
    const unsubTyping = onUserTyping((data: TypingIndicator) => {
      if (data.odell !== currentUserId) {
        if (data.isTyping) {
          setTypingUser(data.userName);
        } else {
          setTypingUser(null);
        }
      }
    });

    // Listen for message read receipts
    const unsubMessageRead = onMessageRead((data) => {
      if (data.messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? {
                  ...msg,
                  isRead: true,
                  readAt: data.readAt,
                  readBy: data.readBy,
                }
              : msg
          )
        );
      }
    });

    // Listen for message reactions (debounced to prevent rate limiting)
    const unsubMessageReaction = onMessageReaction((data) => {
      // Debounce reaction fetches to prevent rate limiting
      if (reactionFetchTimeoutRef.current[data.messageId]) {
        clearTimeout(reactionFetchTimeoutRef.current[data.messageId]);
      }
      
      reactionFetchTimeoutRef.current[data.messageId] = setTimeout(() => {
        // Fetch updated reactions for this message
        fetch(`/api/chat/messages/${data.messageId}/reactions`, {
          credentials: 'include',
        })
          .then((res) => {
            if (res.status === 429) {
              // Rate limited, retry after delay
              setTimeout(() => {
                fetch(`/api/chat/messages/${data.messageId}/reactions`, {
                  credentials: 'include',
                })
                  .then((res) => res.json())
                  .then((result) => {
                    if (result.success) {
                      setMessageReactions((prev: Record<string, Message['reactions']>) => ({
                        ...prev,
                        [data.messageId]: result.data,
                      }));
                    }
                  })
                  .catch(() => {});
              }, 2000);
              return;
            }
            return res.json();
          })
          .then((result) => {
            if (result && result.success) {
              setMessageReactions((prev: Record<string, Message['reactions']>) => ({
                ...prev,
                [data.messageId]: result.data,
              }));
            }
          })
          .catch((error) => {
            console.warn('Failed to fetch updated reactions:', error);
          });
        
        delete reactionFetchTimeoutRef.current[data.messageId];
      }, 500); // Debounce by 500ms
    });
    
    // Join chat room when socket connects
    const joinChatRoom = () => {
      if (socket.connected && chatId && currentUserId) {
        try {
          console.log('[ChatWindow] Joining chat room:', chatId);
          joinChat(chatId, currentUserId);
        } catch (error) {
          console.warn('[ChatWindow] Failed to join chat room:', error);
        }
      }
    };

    // Try to join immediately if already connected
    if (socket.connected) {
      console.log('[ChatWindow] Socket already connected, joining chat room');
      joinChatRoom();
    } else {
      // Wait for connection
      console.log('[ChatWindow] Socket not connected, waiting for connection...');
      const connectHandler = () => {
        console.log('[ChatWindow] Socket connected, joining chat room');
        joinChatRoom();
      };
      socket.on('connect', connectHandler);
      
      // Also try to connect manually if not auto-connecting
      setTimeout(() => {
        if (!socket.connected) {
          console.log('[ChatWindow] Manually connecting socket...');
          socket.connect();
        }
      }, 100);
    }

    // Polling fallback: Fetch messages every 10 seconds if socket is not connected (reduced frequency)
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Only start polling if socket is not connected after a delay
      const checkSocketAndPoll = () => {
        const currentSocket = getSocket();
        if (!currentSocket.connected) {
          pollingIntervalRef.current = setInterval(async () => {
            const socket = getSocket();
            if (!socket.connected) {
              try {
                const res = await fetch(`/api/chat/messages?chatId=${chatId}&limit=20`, {
                  credentials: 'include',
                });
                const data = await res.json();
                if (data.success && data.data) {
                  setMessages((prev) => {
                    // Filter out duplicates and merge new messages
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMessages = data.data.filter((msg: Message) => 
                      !existingIds.has(msg.id)
                    );
                    
                    if (newMessages.length > 0) {
                      // Merge and sort by createdAt to maintain chronological order
                      const merged = [...prev, ...newMessages];
                      merged.sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        return dateA - dateB; // Ascending order (oldest first)
                      });
                      return merged;
                    }
                    return prev;
                  });
                }
              } catch (error) {
                // Silently fail - don't spam console
              }
            } else {
              // Socket connected, stop polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
          }, 10000); // Poll every 10 seconds (reduced from 3)
        }
      };
      
      // Check after 2 seconds to give socket time to connect
      setTimeout(checkSocketAndPoll, 2000);
    };

    // Start polling as fallback (only if needed)
    startPolling();

    return () => {
      console.log('[ChatWindow] Cleaning up socket listeners and polling');
      unsubMessage();
      unsubTyping();
      unsubMessageRead();
      unsubMessageReaction();
      if (socket) {
        socket.off('connect');
      }
      leaveChat(chatId);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chatId, currentUserId, currentUserName]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(chatId, currentUserId, currentUserName);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendStopTyping(chatId, currentUserId, currentUserName);
    }, 2000);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    handleTyping();
  };

  // Handle send message
  const handleSendMessage = async () => {
    const messageContent = inputValue.trim();
    if (!messageContent && !imageToSend) return;

    // Validate chatId before proceeding
    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      console.error('Invalid chatId:', chatId);
      alert('Invalid chat ID. Please refresh the page and try again.');
      return;
    }

    setIsSending(true);
    const contentToSend = messageContent;
    let imageUrlToSend: string | undefined;

    try {
      // Upload image if present
      if (imageToSend) {
        const formData = new FormData();
        formData.append('file', imageToSend);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        imageUrlToSend = data.data?.url;

        // Clear image preview
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImageToSend(null);
        setImagePreview('');
      }

      console.log('Sending message:', { chatId, content: contentToSend, hasImage: !!imageUrlToSend });

      // Send message via API using secureFetch (which handles CSRF automatically)
      const response = await secureFetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          content: contentToSend || undefined, // Send undefined if empty (allows image-only messages)
          imageUrl: imageUrlToSend,
        }),
      });

      console.log('Message API response status:', response.status, response.statusText);

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        throw new Error('Invalid response from server. Please try again.');
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log('Message API response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        // Check for specific error messages
        const errorMessage = responseData?.error || 'Failed to send message. Please check your connection and try again.';
        
        // If it's an invalid chat ID error, provide more helpful message
        if (errorMessage.includes('Invalid chat ID') || errorMessage.includes('Chat not found')) {
          console.error('Chat ID validation failed:', { chatId, error: errorMessage });
          alert('The chat session is invalid. Please go back and select a chat again.');
          setIsSending(false);
          return;
        }
        
        // If API fails, try socket as fallback
        console.warn('API send failed, trying socket fallback:', errorMessage);
        const socket = getSocket();
        if (socket.connected) {
          sendMessage(chatId, contentToSend || ' ', currentUserId, imageUrlToSend); // Use space if no content (for image-only)
          // Add message optimistically
          setMessages((prev) => {
            const tempId = `temp-${Date.now()}`;
            const exists = prev.some(m => m.id === tempId);
            if (exists) return prev;
            
            return [
              ...prev,
              {
                id: tempId,
                content: contentToSend || (imageUrlToSend ? 'Sent an image' : ''),
                senderId: currentUserId,
                senderName: currentUserName,
                imageUrl: imageUrlToSend || null,
                isRead: false,
                createdAt: new Date().toISOString(),
              },
            ];
          });
          // Clear input even on socket fallback
          setInputValue('');
          setShowEmojiPicker(false);
          setTimeout(() => scrollToBottom(), 100);
          setIsSending(false);
          return; // Exit early on socket fallback
        } else {
          throw new Error(errorMessage);
        }
      }

      if (responseData.success && responseData.data) {
        // Message sent successfully via API
        const messageData = responseData.data;
        
        // Add message to local state immediately for instant feedback
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m.id === messageData.id);
          if (exists) return prev;
          
          const newMessage: Message = {
            id: messageData.id,
            content: messageData.content,
            senderId: messageData.senderId,
            senderName: messageData.sender?.name || currentUserName,
            imageUrl: messageData.imageUrl || null,
            isRead: messageData.isRead || false,
            createdAt: messageData.createdAt || new Date().toISOString(),
          };
          
          // Insert in chronological order
          const merged = [...prev, newMessage];
          merged.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB; // Ascending order (oldest first)
          });
          
          return merged;
        });
      } else {
        throw new Error(responseData?.error || 'Failed to send message');
      }

      // Clear input only after successful send
      setInputValue('');
      setShowEmojiPicker(false);

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      sendStopTyping(chatId, currentUserId, currentUserName);

      // Scroll to bottom after adding message
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user (but don't use alert in production - use toast instead)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      console.error('Send message error:', errorMessage);
      
      // Still clear input on error to allow retry with fresh input
      // User can retype if needed
      setInputValue('');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cancel image
  const cancelImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageToSend(null);
    setImagePreview('');
  };

  // Add emoji to input
  const addEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Handle message reaction
  const handleMessageReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await secureFetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji,
          action: 'toggle',
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local reactions state
        setMessageReactions((prev) => ({
          ...prev,
          [messageId]: data.data.reactions || [],
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Handle marking message as read
  const handleMarkMessageRead = async (messageId: string) => {
    try {
      const res = await secureFetch(`/api/chat/messages/${messageId}/read`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update local message state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    isRead: true,
                    readAt: data.data.readAt,
                    readBy: data.data.readBy,
                  }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Mark messages as read when they come into view
  useEffect(() => {
    // Mark unread messages from other users as read
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.senderId !== currentUserId
    );

    if (unreadMessages.length > 0) {
      // Mark all unread messages as read
      unreadMessages.forEach((msg) => {
        handleMarkMessageRead(msg.id);
      });
    }
  }, [messages, currentUserId]);

  // Format message time
  const formatMessageTime = (date: Date | string) => {
    const d = new Date(date);
    return format(d, 'HH:mm');
  };

  // Format date separator
  const formatDateSeparator = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Sort messages by creation time (oldest first) - memoized to prevent recalculation on every render
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }, [messages]);

  // Group messages by date - memoized to prevent recalculation on every render
  const groupedMessages = useMemo(() => {
    return sortedMessages.reduce((groups, message) => {
      const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {} as Record<string, Message[]>);
  }, [sortedMessages]);

  // Handle calling functionality
  const handlePhoneCall = () => {
    // TODO: Implement phone call functionality
    console.log('Initiating phone call with', otherUserName);
    // This would typically integrate with a calling service like Twilio, Agora, etc.
    alert(`Calling ${otherUserName}... (Calling functionality will be implemented)`);
  };

  const handleVideoCall = () => {
    // TODO: Implement video call functionality
    console.log('Initiating video call with', otherUserName);
    // This would typically integrate with a video calling service like Twilio, Agora, etc.
    alert(`Starting video call with ${otherUserName}... (Video calling functionality will be implemented)`);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </button>
        )}

        {/* User Info */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {getInitials(otherUserName)}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-stone-900 truncate">{otherUserName}</h3>
          <p className="text-xs text-stone-600">
            {typingUser ? (
              <span className="text-warm-coral">typing...</span>
            ) : isOnline ? (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Online
              </span>
            ) : (
              <span className="text-stone-500">Offline</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <button 
          onClick={handlePhoneCall}
          className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors group"
          title="Voice Call"
        >
          <Phone className="w-5 h-5 text-stone-700 group-hover:text-warm-coral transition-colors" />
        </button>
        <button 
          onClick={handleVideoCall}
          className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors group"
          title="Video Call"
        >
          <Video className="w-5 h-5 text-stone-700 group-hover:text-warm-coral transition-colors" />
        </button>
        <button className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors">
          <MoreVertical className="w-5 h-5 text-stone-700" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-stone-400" />
            </div>
            <p className="text-stone-700 text-lg font-serif font-medium mb-2">No messages yet</p>
            <p className="text-stone-500 text-sm">Start the conversation by sending a message!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="px-4 py-1.5 bg-white border border-stone-200 text-stone-600 text-xs font-medium rounded-full shadow-sm">
                {formatDateSeparator(date)}
              </span>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar =
                !isOwn &&
                (index === 0 || dateMessages[index - 1]?.senderId !== message.senderId);
              const isLastInGroup = index === dateMessages.length - 1 || 
                dateMessages[index + 1]?.senderId !== message.senderId;

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other user */}
                  {!isOwn && showAvatar && (
                    <div className="w-8 h-8 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">
                      {getInitials(message.senderName || otherUserName)}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8" />}

                  {/* Message Bubble */}
                  <MessageBubble
                    id={message.id}
                    content={message.content}
                    senderId={message.senderId}
                    senderName={message.senderName}
                    imageUrl={message.imageUrl}
                    isRead={message.isRead}
                    readAt={message.readAt}
                    readBy={message.readBy}
                    createdAt={message.createdAt}
                    currentUserId={currentUserId}
                    reactions={messageReactions[message.id] || message.reactions || []}
                    onReaction={handleMessageReaction}
                    onMarkRead={handleMarkMessageRead}
                  />
                </div>
              );
            })}
          </div>
        ))
        )}

        {/* Enhanced Typing Indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-8 h-8 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
              {getInitials(typingUser)}
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-stone-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-warm-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-warm-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-warm-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-stone-500 ml-2">{typingUser} is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 bg-white border-t border-stone-200">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-xl object-cover shadow-sm"
            />
            <button
              onClick={cancelImage}
              className="absolute -top-2 -right-2 p-1 bg-warm-coral text-white rounded-full hover:bg-warm-rose shadow-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Emoji Picker */}
      {showEmojiPicker && (
        <div className="px-4 py-3 bg-white border-t border-stone-200">
          <div className="flex gap-2 flex-wrap">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1 hover:bg-stone-100 rounded-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request Design Button (only for customers chatting with designers) */}
      {otherUserRole === 'DESIGNER' && designerId && (
        <div className="bg-warm-light/30 border-t border-stone-200 px-4 py-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="w-full px-4 py-2.5 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-5 h-5" />
            Request Design Order
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-stone-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Image Upload Button */}
          <button
            onClick={openFilePicker}
            className="p-2.5 text-stone-600 hover:text-warm-coral hover:bg-stone-50 rounded-xl transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-xl transition-colors ${
              showEmojiPicker
                ? 'text-warm-coral bg-stone-50'
                : 'text-stone-600 hover:text-warm-coral hover:bg-stone-50'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900 placeholder:text-stone-400"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={isSending || (!inputValue.trim() && !imageToSend) || !isCsrfReady}
            className="p-2.5 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Request Design Modal */}
      {showRequestModal && designerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-stone-900">Request Design Order</h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestDescription('');
                  setRequestImageUrl(null);
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Describe your design requirements *
                </label>
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="E.g., I need a modern fusion lehenga with traditional embroidery for my wedding..."
                  rows={4}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-warm-coral focus:border-warm-coral resize-none"
                />
              </div>

              {requestImageUrl && (
                <div className="relative">
                  <img
                    src={requestImageUrl}
                    alt="Reference"
                    className="w-full h-48 object-cover rounded-lg border border-stone-200"
                  />
                  <button
                    onClick={() => setRequestImageUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Reference Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setRequestImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestDescription('');
                    setRequestImageUrl(null);
                  }}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!requestDescription.trim()) {
                      alert('Please describe your design requirements');
                      return;
                    }

                    setIsSubmittingRequest(true);
                    try {
                      if (!designerId) {
                        console.error('Designer ID is missing:', { designerId, chatId, otherUserRole });
                        alert('Designer information is missing. Please refresh the page and try again.');
                        setIsSubmittingRequest(false);
                        return;
                      }

                      console.log('Submitting design request:', { designerId, chatId, hasDescription: !!requestDescription, hasImage: !!requestImageUrl });

                      // Upload image if provided
                      let uploadedImageUrl = null;
                      if (requestImageUrl && requestImageUrl.startsWith('data:')) {
                        try {
                          const formData = new FormData();
                          // Convert data URL to blob more reliably
                          const base64Data = requestImageUrl.split(',')[1];
                          const mimeType = requestImageUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
                          const byteCharacters = atob(base64Data);
                          const byteNumbers = new Array(byteCharacters.length);
                          for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                          }
                          const byteArray = new Uint8Array(byteNumbers);
                          const blob = new Blob([byteArray], { type: mimeType });
                          
                          formData.append('file', blob, 'reference.jpg');
                          formData.append('folder', 'chat');

                          const uploadRes = await secureFetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            uploadedImageUrl = uploadData.data?.url;
                          } else {
                            console.warn('Image upload failed, continuing without image');
                          }
                        } catch (uploadError) {
                          console.error('Error uploading image:', uploadError);
                          // Continue without image if upload fails
                        }
                      }

                      // Create design request
                      if (!designerId) {
                        alert('Designer information is missing. Please refresh the page and try again.');
                        setIsSubmittingRequest(false);
                        return;
                      }

                      const res = await secureFetch('/api/design-requests', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          designerId,
                          description: requestDescription,
                          referenceImageUrl: uploadedImageUrl,
                          chatId,
                        }),
                      });

                      // Check if response is JSON before parsing
                      const contentType = res.headers.get('content-type');
                      const isJson = contentType && contentType.includes('application/json');
                      
                      if (!res.ok) {
                        let errorData;
                        if (isJson) {
                          errorData = await res.json().catch(() => ({ message: 'Failed to submit request' }));
                        } else {
                          const text = await res.text();
                          console.error('Non-JSON error response:', text.substring(0, 200));
                          errorData = { message: `Server error (${res.status}). Please try again.` };
                        }
                        alert(errorData.message || errorData.error || 'Failed to submit request. Please try again.');
                        setIsSubmittingRequest(false);
                        return;
                      }

                      if (!isJson) {
                        const text = await res.text();
                        console.error('Non-JSON response received:', text.substring(0, 200));
                        alert('Server error. Please try again or refresh the page.');
                        setIsSubmittingRequest(false);
                        return;
                      }

                      const data = await res.json();
                      if (data.success) {
                        alert('Design request submitted successfully! The designer will review it.');
                        setShowRequestModal(false);
                        setRequestDescription('');
                        setRequestImageUrl(null);
                      } else {
                        alert(data.message || data.error || 'Failed to submit request. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error submitting request:', error);
                      let errorMessage = 'Failed to submit request. Please try again.';
                      
                      if (error instanceof Error) {
                        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
                          errorMessage = 'Network error. Please check your internet connection and try again.';
                        } else if (error.message.includes('CSRF')) {
                          errorMessage = 'Security validation failed. Please refresh the page and try again.';
                        } else {
                          errorMessage = error.message;
                        }
                      }
                      
                      alert(errorMessage);
                    } finally {
                      setIsSubmittingRequest(false);
                    }
                  }}
                  disabled={isSubmittingRequest || !requestDescription.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
