'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Send,
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Circle,
  Loader2,
  ChevronLeft,
  X,
  Smile,
  Check,
  CheckCheck,
  Menu,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { connectSocket, disconnectSocket, joinChat, sendMessage as socketSendMessage, sendTyping, sendStopTyping, onReceiveMessage, onUserTyping, onUserOnline, onUserOffline } from '@/lib/socket/client';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { useSecureFetch } from '@/hooks';
import { useSidebar } from '@/contexts/SidebarContext';

interface Chat {
  id: string;
  customer: {
    id: string;
    name: string;
    photo?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  content?: string;
  imageUrl?: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

export default function TailorChatsPage() {
  const router = useRouter();
  const { csrfToken, refreshCsrfToken } = useCsrfToken();
  const { secureFetch } = useSecureFetch();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string>('');
  const { toggleSidebar } = useSidebar();

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const res = await secureFetch('/api/chat', {
          credentials: 'include',
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to fetch chats:', res.status, errorText);
          setChats([]);
          setIsLoading(false);
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from chat API');
          setChats([]);
          setIsLoading(false);
          return;
        }
        
        const data = await res.json();
        
        if (data.success && data.data) {
          // Handle both array and single chat response
          const chatsArray = Array.isArray(data.data) ? data.data : [data.data];
          
          if (chatsArray.length > 0) {
            // Transform API response to our chat format
            const transformedChats = chatsArray.map((chat: any) => ({
              id: chat.id,
              customer: {
                id: chat.customer?.id || chat.customerId,
                name: chat.customer?.user?.name || 'Customer',
                photo: chat.customer?.profilePhoto || chat.customer?.photo,
              },
              lastMessage: chat.messages?.[0] ? {
                content: chat.messages[0].content,
                createdAt: chat.messages[0].createdAt,
                isRead: chat.messages[0].isRead,
              } : undefined,
              unreadCount: chat.unreadCount || 0,
              isOnline: false,
            }));
            setChats(transformedChats);
          } else {
            // No chats found - show empty state
            setChats([]);
          }
        } else {
          // API returned error
          console.error('API error:', data.error || 'Unknown error');
          setChats([]);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChats([]); // Show empty state instead of crashing
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();

    // Connect to socket with user data
    const connectSocketWithUser = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          const user = userData.data;
          currentUserIdRef.current = user.id;
          connectSocket(user.id, user.name || 'Tailor', user.role || 'TAILOR');
        }
      } catch (error) {
        // Silently fail - socket connection is optional
        console.warn('Could not connect to socket:', error);
      }
    };

    connectSocketWithUser();
    
    // Listen for online status
    const unsubOnline = onUserOnline((data: any) => {
      const userId = data.userId || data.odell || data.id;
      if (userId) {
        setOnlineUsers(prev => new Set([...prev, userId]));
      }
    });
    
    const unsubOffline = onUserOffline((data: any) => {
      const userId = data.userId || data.odell || data.id;
      if (userId) {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    return () => {
      unsubOnline();
      unsubOffline();
      disconnectSocket();
    };
  }, []);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await secureFetch(`/api/chat/messages?chatId=${selectedChat.id}&limit=50`, {
          credentials: 'include',
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to fetch messages:', res.status, errorText);
          setMessages([]);
          setIsLoadingMessages(false);
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from messages API');
          setMessages([]);
          setIsLoadingMessages(false);
          return;
        }
        
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          // Transform messages to match our Message interface
          const transformedMessages = data.data.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            imageUrl: msg.imageUrl || null,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            isRead: msg.isRead || false,
          }));
          setMessages(transformedMessages);
        } else {
          setMessages([]); // No messages - show empty state
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]); // Show empty state instead of mock data
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
    
    // Get current user ID for joining chat
    const joinChatWithUser = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          joinChat(selectedChat.id, userData.data.id);
        }
      } catch (error) {
        console.warn('Could not get user for joining chat:', error);
      }
    };
    
    joinChatWithUser();

    // Listen for new messages
    const unsubMessage = onReceiveMessage((message: any) => {
      if (message.chatId === selectedChat.id) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          
          return [
            ...prev,
            {
              id: message.id,
              content: message.content,
              imageUrl: message.imageUrl || null,
              senderId: message.senderId,
              createdAt: message.createdAt || new Date().toISOString(),
              isRead: message.isRead || false,
            },
          ];
        });
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    // Listen for typing
    const unsubTyping = onUserTyping((data: any) => {
      const messageChatId = data.chatId || selectedChat.id;
      const userId = data.odell || data.userId || data.id;
      if (messageChatId === selectedChat.id && userId !== currentUserIdRef.current) {
        setIsTyping(data.isTyping !== false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.isTyping !== false) {
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
    };
  }, [selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle image upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setShowImageUpload(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  // Send message
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !uploadedImage) || !selectedChat || isSending) return;

    setIsSending(true);
    try {
      let imageUrl = '';
      
      // Upload image if present
      if (uploadedImage) {
        const formData = new FormData();
        formData.append('files', uploadedImage);
        formData.append('folder', 'chat');
        
        // Get CSRF token for upload
        const token = csrfToken || (await refreshCsrfToken());
        if (!token) {
          throw new Error('Missing CSRF token. Please refresh the page and try again.');
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-csrf-token': token,
          },
          credentials: 'include',
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data && uploadData.data.length > 0) {
          imageUrl = uploadData.data[0].url;
        }
      }

      console.log('Sending message:', { chatId: selectedChat.id, content: messageInput.trim(), hasImage: !!imageUrl });

      // Send message via API using secureFetch
      const res = await secureFetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: messageInput.trim() || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });

      console.log('Message API response status:', res.status, res.statusText);

      // Check content type before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await res.text();
        console.error('Non-JSON response:', errorText);
        throw new Error('Invalid response from server. Please try again.');
      }

      let responseData;
      try {
        responseData = await res.json();
        console.log('Message API response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!res.ok) {
        const errorMessage = responseData?.error || 'Failed to send message. Please check your connection and try again.';
        console.error('API send failed:', errorMessage);
        
        // If authentication error, redirect to login
        if (res.status === 401) {
          alert('Your session has expired. Please log in again.');
          window.location.href = '/login';
          return;
        }
        
        alert(errorMessage);
        return;
      }

      if (responseData.success && responseData.data) {
        const messageData = responseData.data;
        
        // Transform message to match our Message interface
        const newMessage = {
          id: messageData.id,
          content: messageData.content,
          imageUrl: messageData.imageUrl || null,
          senderId: messageData.senderId,
          createdAt: messageData.createdAt || new Date().toISOString(),
          isRead: messageData.isRead || false,
        };
        
        // Add to local messages
        setMessages((prev) => {
          const exists = prev.some(m => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        // Update last message in chat list
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, lastMessage: { content: messageInput.trim() || 'Image', createdAt: new Date().toISOString(), isRead: false } }
            : chat
        ));
      } else {
        throw new Error(responseData?.error || 'Failed to send message');
      }

      // Clear input only after successful send
      setMessageInput('');
      setUploadedImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview('');

      // Stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      
      // Get current user ID for stop typing
      if (currentUserIdRef.current) {
        sendStopTyping(selectedChat.id, currentUserIdRef.current, 'Tailor');
      }

      // Scroll to bottom after adding message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing
  const handleTyping = async () => {
    if (selectedChat && currentUserIdRef.current) {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          sendTyping(selectedChat.id, userData.data.id, userData.data.name || 'Tailor');
        }
      } catch (error) {
        console.warn('Could not get user for typing:', error);
      }
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle phone call (placeholder for future integration)
  const handlePhoneCall = () => {
    if (!selectedChat) return;
    // TODO: Integrate with Twilio, Agora, or similar service
    alert(`Initiating voice call with ${selectedChat.customer.name}...`);
  };

  // Handle video call (placeholder for future integration)
  const handleVideoCall = () => {
    if (!selectedChat) return;
    // TODO: Integrate with Twilio, Agora, or similar service
    alert(`Initiating video call with ${selectedChat.customer.name}...`);
  };

  // Filter chats
  const filteredChats = chats.filter(chat =>
    chat.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 -ml-6 lg:-ml-8 -mr-8 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 flex-shrink-0 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              <div>
                <h1 className="text-xl font-serif font-semibold text-stone-900">Customer Chats</h1>
                <p className="text-sm text-stone-600">{chats.length} conversations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chat List */}
        <div className={`w-full lg:w-80 xl:w-96 bg-white border-r border-stone-200 flex flex-col flex-shrink-0 ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-4 border-b border-stone-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-colors text-stone-900 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto bg-stone-50">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-stone-600 font-medium">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setShowMobileChat(true);
                    }}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-white transition-colors text-left ${
                      selectedChat?.id === chat.id ? 'bg-warm-light border-l-4 border-warm-coral shadow-sm' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {getInitials(chat.customer.name)}
                      </div>
                      {(chat.isOnline || onlineUsers.has(chat.customer.id)) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-semibold truncate ${
                          selectedChat?.id === chat.id ? 'text-warm-taupe' : 'text-stone-900'
                        }`}>
                          {chat.customer.name}
                        </p>
                        {chat.lastMessage && (
                          <span className={`text-xs flex-shrink-0 ${
                            selectedChat?.id === chat.id ? 'text-warm-taupe' : 'text-stone-500'
                          }`}>
                            {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          selectedChat?.id === chat.id ? 'text-stone-700' : 'text-stone-600'
                        }`}>
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-warm-coral text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="lg:hidden p-2 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    <Menu className="w-5 h-5 text-stone-700" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {getInitials(selectedChat.customer.name)}
                    </div>
                    {(selectedChat.isOnline || onlineUsers.has(selectedChat.customer.id)) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
                    )}
                  </div>
                  <div>
                    <p className="font-serif font-semibold text-stone-900">{selectedChat.customer.name}</p>
                    <p className="text-xs text-stone-600 flex items-center gap-1">
                      {selectedChat.isOnline || onlineUsers.has(selectedChat.customer.id) ? (
                        <>
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          Online
                        </>
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isOwn = message.senderId === currentUserIdRef.current;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              isOwn
                                ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-2xl rounded-br-md shadow-md'
                                : 'bg-white text-stone-900 rounded-2xl rounded-bl-md shadow-sm border border-stone-200'
                            } px-4 py-2`}
                          >
                            {message.imageUrl && (
                              <img
                                src={message.imageUrl}
                                alt="Shared"
                                className="max-w-full rounded-lg mb-2"
                              />
                            )}
                            {message.content && (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/80' : 'text-stone-500'}`}>
                              <span className="text-xs">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
                              </span>
                              {isOwn && (
                                message.isRead ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-stone-200">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-warm-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-warm-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-warm-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="bg-white border-t border-stone-200 p-4">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Upload preview" className="h-24 rounded-xl shadow-sm" />
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(imagePreview);
                        setImagePreview('');
                        setUploadedImage(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-warm-coral text-white rounded-full flex items-center justify-center hover:bg-warm-rose shadow-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="bg-white border-t border-stone-200 p-4 shadow-sm">
                <div className="flex items-end gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowImageUpload(!showImageUpload)}
                      className="p-2.5 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    {/* Image Upload Dropdown */}
                    {showImageUpload && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 p-3">
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                            isDragActive ? 'border-warm-coral bg-warm-light' : 'border-stone-200 hover:border-warm-coral hover:bg-stone-50'
                          }`}
                        >
                          <input {...getInputProps()} />
                          <ImageIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                          <p className="text-sm text-stone-600">Drop image or click</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl resize-none focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || (!messageInput.trim() && !uploadedImage)}
                    className="p-2.5 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all shadow-md"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-stone-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-stone-400" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">Select a conversation</h3>
                <p className="text-stone-600">Choose a customer chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

