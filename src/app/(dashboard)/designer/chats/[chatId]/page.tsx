'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Menu,
  Send,
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Loader2,
  X,
  Check,
  CheckCheck,
  Info,
  MessageCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  connectSocket, 
  joinChat, 
  leaveChat,
  sendMessage as socketSendMessage, 
  sendTyping, 
  sendStopTyping, 
  onReceiveMessage, 
  onUserTyping,
  markMessagesAsRead,
  onUserOnline,
  onUserOffline,
} from '@/lib/socket/client';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { useSecureFetch } from '@/hooks';
import { useSidebar } from '@/contexts/SidebarContext';

interface Message {
  id: string;
  content?: string;
  imageUrl?: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatDetails {
  id: string;
  customer: {
    id: string;
    name: string;
    photo?: string;
    location?: string;
    stylePreferences?: string[];
  };
  isOnline?: boolean;
}

export default function DesignerChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { csrfToken, refreshCsrfToken } = useCsrfToken();
  const { secureFetch } = useSecureFetch();
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isCustomerOnline, setIsCustomerOnline] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string>('');
  const { toggleSidebar } = useSidebar();

  // Fetch chat details and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user ID
        const userRes = await secureFetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (!userRes.ok) {
          console.error('Failed to fetch user');
          setIsLoading(false);
          return;
        }
        
        const userData = await userRes.json();
        if (userData.success) {
          currentUserIdRef.current = userData.data.id;
        }

        // Fetch chat details
        const chatRes = await secureFetch(`/api/chat?chatId=${chatId}`, {
          credentials: 'include',
        });
        
        if (!chatRes.ok) {
          const errorText = await chatRes.text();
          console.error('Failed to fetch chat:', chatRes.status, errorText);
          setIsLoading(false);
          return;
        }
        
        const contentType = chatRes.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from chat API');
          setIsLoading(false);
          return;
        }
        
        const chatData = await chatRes.json();
        
        if (chatData.success && chatData.data) {
          const chat = Array.isArray(chatData.data) ? chatData.data[0] : chatData.data;
          if (chat) {
            setChatDetails({
              id: chat.id,
              customer: {
                id: chat.customer?.id || chat.customerId,
                name: chat.customer?.user?.name || 'Customer',
                photo: chat.customer?.photo,
                location: chat.customer?.location,
                stylePreferences: chat.customer?.stylePreferences,
              },
              isOnline: false,
            });
          }
        }

        // Fetch messages with full history
        const messagesRes = await secureFetch(`/api/chat/messages?chatId=${chatId}&limit=50`, {
          credentials: 'include',
        });
        
        if (!messagesRes.ok) {
          const errorText = await messagesRes.text();
          console.error('Failed to fetch messages:', messagesRes.status, errorText);
          setMessages([]);
        } else {
          const contentType = messagesRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Non-JSON response from messages API');
            setMessages([]);
          } else {
            const messagesData = await messagesRes.json();
            
            if (messagesData.success) {
              setMessages(messagesData.data || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Connect to socket and join chat with user data
    const connectSocketWithUser = async () => {
      try {
        const userRes = await secureFetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (!userRes.ok) {
          console.error('Failed to fetch user for socket connection');
          return;
        }
        
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          const user = userData.data;
          currentUserIdRef.current = user.id;
          
          console.log('[DesignerChat] Connecting socket with user:', user.id);
          const socket = connectSocket(user.id, user.name || 'Designer', user.role || 'DESIGNER');
          
          // Join chat room when socket connects
          const joinChatRoom = () => {
            if (socket.connected && chatId && user.id) {
              console.log('[DesignerChat] Joining chat room:', chatId);
              joinChat(chatId, user.id);
            }
          };

          if (socket.connected) {
            joinChatRoom();
          } else {
            socket.on('connect', () => {
              console.log('[DesignerChat] Socket connected, joining chat room');
              joinChatRoom();
            });
          }
        }
      } catch (error) {
        console.warn('[DesignerChat] Could not connect to socket:', error);
      }
    };

    connectSocketWithUser();

    // Listen for new messages
    const unsubMessage = onReceiveMessage((message: any) => {
      if (message.chatId === chatId) {
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
        
        // Mark as read if from other user
        if (message.senderId !== currentUserIdRef.current) {
          markMessagesAsRead(chatId, currentUserIdRef.current);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    // Listen for typing
    const unsubTyping = onUserTyping((data: any) => {
      const messageChatId = data.chatId || chatId;
      const userId = data.odell || data.userId;
      if (messageChatId === chatId && userId !== currentUserIdRef.current) {
        setIsTyping(data.isTyping !== false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.isTyping !== false) {
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    // Listen for online/offline status
    const unsubOnline = onUserOnline((data: any) => {
      const userId = data.odell || data.userId || data.id;
      if (chatDetails && userId === chatDetails.customer.id) {
        setIsCustomerOnline(true);
      }
    });

    const unsubOffline = onUserOffline((data: any) => {
      const userId = data.odell || data.userId || data.id;
      if (chatDetails && userId === chatDetails.customer.id) {
        setIsCustomerOnline(false);
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubOnline();
      unsubOffline();
      leaveChat(chatId);
    };
  }, [chatId]);

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
    const messageContent = messageInput.trim();
    if ((!messageContent && !uploadedImage) || isSending) return;

    setIsSending(true);
    const contentToSend = messageContent;
    let imageUrlToSend: string | undefined;

    try {
      // Upload image if present
      if (uploadedImage) {
        const formData = new FormData();
        formData.append('file', uploadedImage);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.data?.url) {
          imageUrlToSend = uploadData.data.url;
        }
      }

      console.log('Sending message:', { chatId, content: contentToSend, hasImage: !!imageUrlToSend });

      // Send message via API using secureFetch
      const res = await secureFetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          content: contentToSend,
          imageUrl: imageUrlToSend,
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
        alert(errorMessage);
        return;
      }

      if (responseData.success && responseData.data) {
        const messageData = responseData.data;
        
        // Add message to local state immediately
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m.id === messageData.id);
          if (exists) return prev;
          
          return [
            ...prev,
            {
              id: messageData.id,
              content: messageData.content,
              imageUrl: messageData.imageUrl || null,
              senderId: messageData.senderId,
              createdAt: messageData.createdAt || new Date().toISOString(),
              isRead: messageData.isRead || false,
            },
          ];
        });
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
        sendStopTyping(chatId, currentUserIdRef.current, 'Designer');
      }

      // Scroll to bottom after adding message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (currentUserIdRef.current) {
      sendTyping(chatId, currentUserIdRef.current, 'Designer');
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle calling functionality
  const handlePhoneCall = () => {
    if (!chatDetails) return;
    console.log('Initiating phone call with', chatDetails.customer.name);
    alert(`Calling ${chatDetails.customer.name}... (Calling functionality will be implemented)`);
  };

  const handleVideoCall = () => {
    if (!chatDetails) return;
    console.log('Initiating video call with', chatDetails.customer.name);
    alert(`Starting video call with ${chatDetails.customer.name}... (Video calling functionality will be implemented)`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  if (!chatDetails) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4 font-medium">Chat not found</p>
          <Link href="/designer/chats" className="text-warm-coral hover:text-warm-rose font-medium">
            Go back to chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-stone-700" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              {getInitials(chatDetails.customer.name)}
            </div>
            {isCustomerOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
            )}
          </div>
          <div>
            <p className="font-serif font-semibold text-stone-900">{chatDetails.customer.name}</p>
            <p className="text-xs text-stone-600 flex items-center gap-1">
              {isCustomerOnline ? (
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
          <button 
            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
            className={`p-2.5 rounded-xl transition-colors ${
              showCustomerInfo 
                ? 'bg-warm-light text-warm-taupe shadow-sm border border-warm-apricot' 
                : 'hover:bg-stone-100 text-stone-700'
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col bg-stone-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-stone-400" />
                </div>
                <p className="text-stone-700 font-serif font-medium mb-2">No messages yet</p>
                <p className="text-stone-500 text-sm">Start the conversation by sending a message!</p>
              </div>
            ) : (
              messages.map((message) => {
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
                          className="max-w-full rounded-xl mb-2"
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
              })
            )}
            
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
              
              <div className="flex-1">
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
        </div>

        {/* Customer Info Sidebar */}
        {showCustomerInfo && (
          <div className="w-80 bg-white border-l border-stone-200 overflow-y-auto hidden lg:block shadow-sm">
            <div className="p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-3 shadow-md">
                  {getInitials(chatDetails.customer.name)}
                </div>
                <h3 className="font-serif font-semibold text-stone-900 text-lg">{chatDetails.customer.name}</h3>
                <p className="text-sm text-stone-600">Customer</p>
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                {chatDetails.customer.location && (
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-1 font-medium">Location</p>
                    <p className="font-medium text-stone-900">{chatDetails.customer.location}</p>
                  </div>
                )}

                {chatDetails.customer.stylePreferences && chatDetails.customer.stylePreferences.length > 0 && (
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-2 font-medium">Style Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {chatDetails.customer.stylePreferences.map((pref, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-warm-light text-warm-taupe text-xs rounded-full border border-warm-apricot font-medium">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-2">
                <button className="w-full py-2.5 px-4 bg-warm-light text-warm-taupe rounded-xl hover:bg-warm-apricot hover:text-white transition-colors text-sm font-medium border border-warm-apricot shadow-sm">
                  Send Portfolio Item
                </button>
                <button className="w-full py-2.5 px-4 bg-stone-50 text-stone-700 rounded-xl hover:bg-stone-100 transition-colors text-sm font-medium border border-stone-200">
                  Schedule Consultation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


