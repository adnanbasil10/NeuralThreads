'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import DOMPurify from 'dompurify';
import {
  Send,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Loader2,
  X,
  Upload,
  Shirt,
  ShoppingBag,
  Footprints,
  Briefcase,
  Gem,
  User,
  Bot,
  Trash2,
  ChevronDown,
  Menu,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCsrfToken } from '@/hooks';
import { useSidebar } from '@/contexts/SidebarContext';
import { useUser } from '@/contexts/UserContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isMock?: boolean; // Flag to indicate if this is a mock response
}

interface WardrobeItem {
  id: string;
  imageUrl: string;
  category: string;
  color?: string;
  name?: string;
}

const QUICK_PROMPTS = [
  {
    icon: '👰',
    title: 'Wedding Outfits',
    prompt: 'I need outfit recommendations for a wedding',
  },
  {
    icon: '💼',
    title: 'Job Interview',
    prompt: 'Help me choose an outfit for a job interview',
  },
  {
    icon: '☀️',
    title: 'Weekend Casual',
    prompt: 'I want casual outfit suggestions for the weekend',
  },
  {
    icon: '🎨',
    title: 'Ethnic Trends',
    prompt: 'Show me the latest fashion trends for ethnic wear',
  },
  {
    icon: '✨',
    title: 'Find Designer',
    prompt: 'Find me a bridal designer',
  },
  {
    icon: '🌙',
    title: 'Party Look',
    prompt: 'I need outfit recommendations for a party',
  },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  UPPERWEAR: Shirt,
  BOTTOMWEAR: ShoppingBag,
  SHOES: Footprints,
  BAG: Briefcase,
  ACCESSORIES: Gem,
  JACKET: Shirt,
  DRESS: Shirt,
  OUTERWEAR: Shirt,
};

const CATEGORY_LABELS: Record<string, string> = {
  UPPERWEAR: 'Tops & Shirts',
  BOTTOMWEAR: 'Pants & Skirts',
  SHOES: 'Footwear',
  BAG: 'Bags',
  ACCESSORIES: 'Accessories',
  JACKET: 'Jackets',
  DRESS: 'Dresses',
  OUTERWEAR: 'Outerwear',
};

export default function ChatbotInterface() {
  const { toggleSidebar } = useSidebar();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [isUploadingWardrobe, setIsUploadingWardrobe] = useState(false);
  const { csrfToken, refreshCsrfToken } = useCsrfToken();
  const [uploadCategory, setUploadCategory] = useState<string>('UPPERWEAR');
  const [uploadColor, setUploadColor] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isUsingMock, setIsUsingMock] = useState<boolean | null>(null); // Track if using mock responses
  const [hasWelcomed, setHasWelcomed] = useState(false); // Track if welcome message has been sent
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null); // Current conversation ID
  // Chat image upload states
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debounce scroll to prevent excessive scrolling
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Fetch wardrobe items
  useEffect(() => {
    fetchWardrobe();
  }, []);

  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      console.log('🔄 Loading conversation history for user:', user.id);
      loadConversationHistory();
    }
  }, [user]);

  // Load conversation history
  const loadConversationHistory = async () => {
    try {
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) return;

      // Get the most recent conversation
      const res = await fetch('/api/chatbot/conversations', {
        headers: {
          'x-csrf-token': token,
        },
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        // Load the most recent conversation
        const latestConversation = data.data[0];
        setCurrentConversationId(latestConversation.id);
        
        // Load messages for this conversation
        const messagesRes = await fetch(`/api/chatbot/conversations/${latestConversation.id}`, {
          headers: {
            'x-csrf-token': token,
          },
          credentials: 'include',
        });

        const messagesData = await messagesRes.json();
        if (messagesData.success && messagesData.data && messagesData.data.messages) {
          const loadedMessages: Message[] = messagesData.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            imageUrl: msg.imageUrl || undefined,
            isMock: msg.isMock || false,
          }));
          setMessages(loadedMessages);
          setHasWelcomed(loadedMessages.length > 0);
        }
      } else {
        // No existing conversation, create a new one
        await createNewConversation();
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Create a new conversation if loading fails
      await createNewConversation();
    }
  };

  // Create a new conversation
  const createNewConversation = async (): Promise<string | null> => {
    try {
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        console.error('No CSRF token available for creating conversation');
        return null;
      }

      const res = await fetch('/api/chatbot/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error creating conversation:', res.status, errorData);
        return null;
      }

      const data = await res.json();
      if (data.success && data.data && data.data.id) {
        console.log('✅ Created new conversation:', data.data.id);
        return data.data.id;
      } else {
        console.error('Invalid response when creating conversation:', data);
        return null;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Send welcome message when user first sends a message
  useEffect(() => {
    // Welcome message will be handled by the AI based on conversation history being empty
    // The AI will detect it's the first message and send the welcome
  }, []);

  const fetchWardrobe = async () => {
    try {
      const res = await fetch('/api/chatbot/wardrobe');
      const data = await res.json();
      if (data.success) {
        setWardrobeItems(data.data.items);
      }
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
    }
  };

  // Handle file drop for wardrobe upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setShowUploadModal(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    noClick: false,
  });

  // Upload image for chat
  const uploadChatImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        throw new Error('Missing CSRF token');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        return data.data.url;
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove chat image
  const removeChatImage = () => {
    if (chatImagePreview) {
      URL.revokeObjectURL(chatImagePreview);
    }
    setChatImage(null);
    setChatImagePreview('');
  };

  // Send message to chatbot
  const sendMessage = async (content: string) => {
    const sanitizedInput = DOMPurify.sanitize(content.trim());
    // Allow sending message even if only image is provided
    if (!sanitizedInput && !chatImage) return;

    // Upload image first if provided
    let imageUrl: string | null = null;
    if (chatImage) {
      try {
        imageUrl = await uploadChatImage(chatImage);
      } catch (error) {
        console.error('Failed to upload image:', error);
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Failed to upload image. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sanitizedInput || (imageUrl ? '📷 [Image attached]' : ''),
      timestamp: new Date(),
      imageUrl: imageUrl || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    removeChatImage(); // Clear image after sending
    setIsLoading(true);
    
    // Mark that user has started conversation
    if (!hasWelcomed) {
      setHasWelcomed(true);
    }

    // Ensure we have a conversation ID
    let conversationIdToUse = currentConversationId;
    if (!conversationIdToUse) {
      conversationIdToUse = await createNewConversation();
      if (conversationIdToUse) {
        setCurrentConversationId(conversationIdToUse);
      }
    }

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
        imageUrl: m.imageUrl,
      }));

      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        throw new Error('Missing CSRF token');
      }

      console.log('📤 Sending message with conversationId:', conversationIdToUse);
      
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token, // Use lowercase to match backend expectation
        },
        credentials: 'include', // Include cookies for CSRF validation
        body: JSON.stringify({
          message: sanitizedInput || (imageUrl ? 'I have uploaded an image. Please help me with this.' : ''),
          conversationHistory,
          conversationId: conversationIdToUse,
          imageUrl: imageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to get response from server' }));
        console.error('Chatbot API error:', res.status, errorData);
        
        let errorMsg = 'I apologize, but I encountered an error. ';
        if (res.status === 401) {
          errorMsg += 'Please refresh the page and try again.';
        } else if (res.status === 403) {
          errorMsg += 'CSRF token validation failed. Please refresh the page.';
        } else if (res.status === 429) {
          errorMsg += 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMsg += errorData.error || 'Please try again.';
        }
        
        throw new Error(errorMsg);
      }

      const data = await res.json();

      if (data.success && data.data && data.data.response) {
        const isMock = data.data.isMock === true;
        
        // Update status indicator
        setIsUsingMock(isMock);
        
        // Log to console for debugging
        if (isMock) {
          console.log('🤖 [AI Stylist] Using MOCK response (Gemini API key not set or API error)');
        } else {
          console.log('✨ [AI Stylist] Using REAL AI response from Gemini');
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
          isMock: isMock,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Log conversationId for debugging
        console.log('💾 Conversation ID being used:', conversationIdToUse);
        console.log('💾 Messages should be saved to conversation:', conversationIdToUse);
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorMessage = 'I apologize, but I encountered an error. ';
      
      if (error instanceof Error) {
        errorMessage += error.message;
        console.error('Error details:', error);
      } else {
        errorMessage += 'Please try again.';
      }
      
      // Show more helpful error message in development
      if (process.env.NODE_ENV === 'development') {
        errorMessage += ' Check the browser console and server logs for details.';
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload wardrobe item
  const uploadWardrobeItem = async () => {
    if (!selectedFile) return;

    setIsUploadingWardrobe(true);

    try {
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        throw new Error('Missing CSRF token');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', uploadCategory);
      if (uploadColor) formData.append('color', DOMPurify.sanitize(uploadColor));
      if (uploadName) formData.append('name', DOMPurify.sanitize(uploadName));

      const res = await fetch('/api/chatbot/wardrobe', {
        method: 'POST',
        headers: {
          'x-csrf-token': token, // Use lowercase to match backend expectation
        },
        credentials: 'include', // Include cookies for CSRF validation
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setWardrobeItems((prev) => [data.data, ...prev]);
        closeUploadModal();
        
        // Send a message about the new item
        const newItemMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✨ Great! I've added your ${CATEGORY_LABELS[uploadCategory] || uploadCategory} item to your wardrobe! ${uploadColor ? `It's a lovely ${uploadColor} piece.` : ''} Would you like me to suggest some outfits that include this item?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newItemMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload item. Please try again.');
    } finally {
      setIsUploadingWardrobe(false);
    }
  };

  // Delete wardrobe item
  const deleteWardrobeItem = async (itemId: string) => {
    try {
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        throw new Error('Missing CSRF token');
      }

      const res = await fetch(`/api/chatbot/wardrobe?id=${itemId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': token,
        },
        credentials: 'include', // Include cookies for CSRF validation
      });

      if (res.ok) {
        setWardrobeItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Close upload modal
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview('');
    setUploadCategory('UPPERWEAR');
    setUploadColor('');
    setUploadName('');
  };

  // Start new conversation
  const startNewConversation = async () => {
    setMessages([]);
    setHasWelcomed(false);
    setCurrentConversationId(null);
    await createNewConversation();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Format message content with markdown-like styling (without chat links)
  const formatMessage = (content: string) => {
    const formatted = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
    return DOMPurify.sanitize(formatted);
  };

  // Handle chat link click - create or find chat and redirect
  const handleChatLinkClick = async (type: 'designer' | 'tailor', id: string, name: string) => {
    try {
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        alert('Session expired. Please refresh the page.');
        return;
      }

      // Create or find chat
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({
          [type === 'designer' ? 'designerId' : 'tailorId']: id,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        // Redirect to chat page
        window.location.href = `/customer/chats/${data.data.id}`;
      } else {
        alert(data.error || 'Failed to create chat. Please try again.');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Parse and extract outfits, designers, and tailors from content
  const parseContent = (content: string): Array<{ type: 'outfit' | 'designer' | 'tailor' | 'text'; content: string }> => {
    const result: Array<{ type: 'outfit' | 'designer' | 'tailor' | 'text'; content: string }> = [];
    let lastIndex = 0;
    
    // Find all special blocks (outfits, designers, tailors)
    // Use [\s\S] instead of . to match across newlines more reliably
    const outfitRegex = /\[OUTFIT_START\]([\s\S]*?)\[OUTFIT_END\]/g;
    const designerRegex = /\[DESIGNER_START\]([\s\S]*?)\[DESIGNER_END\]/g;
    const tailorRegex = /\[TAILOR_START\]([\s\S]*?)\[TAILOR_END\]/g;
    
    const matches: Array<{ start: number; end: number; type: 'outfit' | 'designer' | 'tailor'; content: string }> = [];
    
    let match;
    while ((match = outfitRegex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'outfit',
        content: match[1].trim(),
      });
    }
    while ((match = designerRegex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'designer',
        content: match[1].trim(),
      });
    }
    while ((match = tailorRegex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'tailor',
        content: match[1].trim(),
      });
    }
    
    // Sort by position
    matches.sort((a, b) => a.start - b.start);
    
    if (matches.length === 0) {
      return [{ type: 'text', content }];
    }
    
    // Build result
    matches.forEach((m) => {
      // Add text before this block
      if (m.start > lastIndex) {
        const textBefore = content.substring(lastIndex, m.start).trim();
        if (textBefore) {
          result.push({ type: 'text', content: textBefore });
        }
      }
      // Add the special block
      result.push({ type: m.type, content: m.content });
      lastIndex = m.end;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex).trim();
      if (textAfter) {
        result.push({ type: 'text', content: textAfter });
      }
    }
    
    return result;
  };

  // Extract chat link from content
  const extractChatLink = (content: string): { type: 'designer' | 'tailor'; id: string; name: string } | null => {
    const designerRegex = /\[CHAT_DESIGNER:([^:]+):([^\]]+)\]/;
    const tailorRegex = /\[CHAT_TAILOR:([^:]+):([^\]]+)\]/;
    
    const designerMatch = content.match(designerRegex);
    if (designerMatch) {
      return { type: 'designer', id: designerMatch[1], name: designerMatch[2] };
    }
    
    const tailorMatch = content.match(tailorRegex);
    if (tailorMatch) {
      return { type: 'tailor', id: tailorMatch[1], name: tailorMatch[2] };
    }
    
    return null;
  };

  // Render message with chat links parsed and rendered as buttons
  const renderMessageContent = (content: string) => {
    // Parse all content blocks
    const parsedContent = parseContent(content);
    
    return (
      <div className="space-y-4">
        {parsedContent.map((section, sectionIndex) => {
          if (section.type === 'outfit') {
            // Render outfit as a card
            return (
              <div
                key={`outfit-${sectionIndex}`}
                className="bg-gradient-to-br from-warm-light to-warm-apricot/30 border border-warm-apricot rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: '#1c1917' }}
                  dangerouslySetInnerHTML={{ __html: formatMessage(section.content) }}
                />
              </div>
            );
          }
          
          if (section.type === 'designer' || section.type === 'tailor') {
            // Extract chat link
            const chatLink = extractChatLink(section.content);
            // Remove chat link marker from content for display
            let displayContent = section.content
              .replace(/\[CHAT_DESIGNER:[^\]]+\]/g, '')
              .replace(/\[CHAT_TAILOR:[^\]]+\]/g, '')
              .trim();
            
            // Clean up the content - format it nicely
            // Remove the "⭐ **Recommended Designer/Tailor:**" header if present
            displayContent = displayContent.replace(/^⭐\s*\*\*Recommended\s+(Designer|Tailor):\*\*\s*/i, '');
            
            // Format the content - convert dashes to proper list items
            const lines = displayContent.split('\n').filter(line => line.trim());
            const formattedLines = lines.map(line => {
              // If line starts with dash or bullet, format it
              line = line.replace(/^[-•]\s*/, '• ');
              // Make bold text stand out
              line = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-stone-900">$1</strong>');
              return line;
            });
            
            return (
              <div
                key={`${section.type}-${sectionIndex}`}
                className="bg-white border-2 border-stone-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-coral rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold text-stone-900">
                      {section.type === 'designer' ? '⭐ Recommended Designer' : '⭐ Recommended Tailor'}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4 text-sm text-stone-700">
                  {formattedLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line) }}
                    />
                  ))}
                </div>
                
                {chatLink ? (
                  <button
                    onClick={() => handleChatLinkClick(chatLink.type, chatLink.id, chatLink.name)}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-warm-taupe to-warm-coral text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with {chatLink.name}
                  </button>
                ) : (
                  <div className="mt-4 text-sm text-stone-500 italic text-center">
                    Chat link not available
                  </div>
                )}
              </div>
            );
          }
          
          // Render regular text content with inline chat links
          const designerRegex = /\[CHAT_DESIGNER:([^:]+):([^\]]+)\]/g;
          const tailorRegex = /\[CHAT_TAILOR:([^:]+):([^\]]+)\]/g;
          
          const matches: Array<{ index: number; type: 'designer' | 'tailor'; id: string; name: string; length: number }> = [];
          
          let match;
          while ((match = designerRegex.exec(section.content)) !== null) {
            matches.push({
              index: match.index,
              type: 'designer',
              id: match[1],
              name: match[2],
              length: match[0].length,
            });
          }
          while ((match = tailorRegex.exec(section.content)) !== null) {
            matches.push({
              index: match.index,
              type: 'tailor',
              id: match[1],
              name: match[2],
              length: match[0].length,
            });
          }
          
          if (matches.length === 0) {
            return (
              <span
                key={`text-${sectionIndex}`}
                dangerouslySetInnerHTML={{ __html: formatMessage(section.content) }}
              />
            );
          }
          
          matches.sort((a, b) => a.index - b.index);
          
          const parts: Array<{ type: 'text' | 'link'; content: string; linkData?: { type: 'designer' | 'tailor'; id: string; name: string } }> = [];
          let lastIndex = 0;
          
          matches.forEach((m) => {
            if (m.index > lastIndex) {
              const textBefore = section.content.substring(lastIndex, m.index);
              if (textBefore.trim()) {
                parts.push({ type: 'text', content: textBefore });
              }
            }
            parts.push({
              type: 'link',
              content: m.name,
              linkData: { type: m.type, id: m.id, name: m.name },
            });
            lastIndex = m.index + m.length;
          });
          
          if (lastIndex < section.content.length) {
            const textAfter = section.content.substring(lastIndex);
            if (textAfter.trim()) {
              parts.push({ type: 'text', content: textAfter });
            }
          }
          
          return (
            <div key={`text-${sectionIndex}`}>
              {parts.map((part, index) => {
                if (part.type === 'link' && part.linkData) {
                  return (
                    <button
                      key={`link-${index}`}
                      onClick={() => handleChatLinkClick(part.linkData!.type, part.linkData!.id, part.linkData!.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 mt-2 mb-1 bg-gradient-to-r from-warm-taupe to-warm-coral text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                    >
                      💬 Chat with {part.linkData.name}
                    </button>
                  );
                }
                return (
                  <span
                    key={`text-part-${index}`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(part.content) }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-warm-light via-stone-50 to-warm-apricot/30 max-w-full">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-warm-apricot/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-warm-coral/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar - Wardrobe */}
      {showWardrobe && (
        <div className="w-80 transition-all duration-300 bg-white/95 backdrop-blur-xl border-r border-stone-200 flex flex-col shadow-xl relative z-10 flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-warm-coral" />
                My Wardrobe
              </h2>
              <span className="px-2 py-1 bg-warm-light text-warm-taupe text-xs rounded-full border border-warm-apricot">
                {wardrobeItems.length} items
              </span>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div className="p-4 border-b border-stone-200">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-warm-coral bg-warm-light'
                  : 'border-stone-300 hover:border-warm-coral hover:bg-stone-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-warm-coral mx-auto mb-2" />
              <p className="text-sm text-stone-600">
                {isDragActive ? 'Drop here!' : 'Drag & drop or click to upload'}
              </p>
            </div>
          </div>

          {/* Wardrobe Items */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {Object.keys(CATEGORY_LABELS).map((category) => {
            const items = wardrobeItems.filter((item) => item.category === category);
            if (items.length === 0) return null;

            const Icon = CATEGORY_ICONS[category] || Shirt;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-warm-coral" />
                  <span className="text-sm font-medium text-stone-700">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs text-stone-500">({items.length})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name || category}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => deleteWardrobeItem(item.id)}
                        className="absolute top-1 right-1 p-1 bg-warm-coral rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {item.color && (
                        <div className="absolute bottom-0 inset-x-0 bg-stone-900/70 text-white text-xs p-1 truncate">
                          {item.color}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {wardrobeItems.length === 0 && (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-600 text-sm">Your wardrobe is empty</p>
              <p className="text-stone-500 text-xs mt-1">
                Upload your clothes to get personalized suggestions
              </p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-lg border-b border-stone-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors flex-shrink-0"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              <button
                onClick={() => setShowWardrobe(!showWardrobe)}
                className={`p-2 rounded-xl transition-colors ${
                  showWardrobe
                    ? 'bg-warm-light text-warm-coral border border-warm-apricot'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warm-coral" />
                  StyleAI
                </h1>
                <p className="text-xs text-stone-600">Your personal fashion assistant</p>
              </div>
            </div>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 px-4 py-2 bg-warm-light hover:bg-warm-apricot text-warm-taupe rounded-xl transition-colors border border-warm-apricot shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="flex flex-col items-center justify-center p-8 py-16">
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-warm-coral/30">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-stone-900 mb-2">
                    Welcome to StyleAI
                  </h2>
                  <p className="text-stone-600 mb-4">
                    Your AI-powered fashion stylist. Get personalized outfit suggestions,
                    style advice, and wardrobe management.
                  </p>
                  <p className="text-sm text-stone-500 italic">
                    💡 Tip: I'll ask you a few questions about your occasion and preferences to create the perfect outfit recommendations for you!
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(prompt.prompt)}
                      className="p-4 bg-white hover:bg-warm-light border border-stone-200 hover:border-warm-coral rounded-xl text-left transition-all group shadow-sm"
                    >
                      <span className="text-2xl mb-2 block">{prompt.icon}</span>
                      <span className="text-sm font-medium text-stone-900 group-hover:text-warm-taupe transition-colors">
                        {prompt.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Upload Prompt */}
                <div className="mt-8 p-4 bg-warm-light border border-warm-apricot rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-warm-apricot/30 rounded-lg">
                      <Upload className="w-5 h-5 text-warm-coral" />
                    </div>
                    <div>
                      <h3 className="text-stone-900 font-semibold mb-1">
                        Build Your Virtual Wardrobe
                      </h3>
                      <p className="text-stone-600 text-sm">
                        Upload photos of your clothes and I'll help you create amazing
                        outfit combinations!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-2xl rounded-br-md shadow-md'
                        : 'bg-white text-stone-900 rounded-2xl rounded-bl-md border border-stone-200 shadow-sm'
                    } px-5 py-4`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Uploaded"
                        className="rounded-lg mb-3 max-w-xs"
                      />
                    )}
                    <div
                      className={`prose prose-sm max-w-none ${
                        message.role === 'user' ? 'prose-invert' : ''
                      }`}
                      style={{ color: message.role === 'user' ? 'white' : '#1c1917' }}
                    >
                      {message.role === 'assistant' ? renderMessageContent(message.content) : (
                        <span dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div
                        className={`text-xs ${
                          message.role === 'user' ? 'text-white/80' : 'text-stone-500'
                        }`}
                      >
                        {format(message.timestamp, 'h:mm a')}
                      </div>
                      {message.role === 'assistant' && message.isMock && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                          🧪 Mock Response
                        </span>
                      )}
                      {message.role === 'assistant' && !message.isMock && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                          ✨ AI Powered
                        </span>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-warm-apricot to-warm-coral rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral rounded-xl flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-warm-coral animate-spin" />
                      <span className="text-stone-600">StyleAI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/95 backdrop-blur-lg border-t border-stone-200 p-4 shadow-sm flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Image Preview */}
            {chatImagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={chatImagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-xl border-2 border-warm-apricot shadow-sm"
                />
                <button
                  onClick={removeChatImage}
                  className="absolute -top-2 -right-2 p-1 bg-warm-coral text-white rounded-full hover:bg-warm-rose shadow-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              {/* Wardrobe Upload Button */}
              <button
                onClick={() => document.getElementById('wardrobe-upload')?.click()}
                className="p-3 text-stone-600 hover:text-warm-coral hover:bg-stone-100 rounded-xl transition-colors"
                title="Upload to wardrobe"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
              <input
                id="wardrobe-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setFilePreview(URL.createObjectURL(file));
                    setShowUploadModal(true);
                  }
                }}
              />

              {/* Chat Image Upload Button */}
              <button
                onClick={() => document.getElementById('chat-image-upload')?.click()}
                className="p-3 text-stone-600 hover:text-warm-coral hover:bg-stone-100 rounded-xl transition-colors relative group"
                title="Upload image to ask about (or drag & drop)"
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-warm-coral rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </button>
              <input
                id="chat-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Image must be less than 5MB');
                      return;
                    }
                    if (!file.type.startsWith('image/')) {
                      alert('Please select an image file');
                      return;
                    }
                    setChatImage(file);
                    setChatImagePreview(URL.createObjectURL(file));
                  }
                  // Reset input so same file can be selected again
                  e.target.value = '';
                }}
              />

              {/* Text Input with Drag & Drop */}
              <div 
                className="flex-1 relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Image must be less than 5MB');
                      return;
                    }
                    setChatImage(file);
                    setChatImagePreview(URL.createObjectURL(file));
                  }
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about fashion, outfits, or drag & drop an image here..."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral transition-all"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || (!input.trim() && !chatImage) || isUploadingImage}
                className="p-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg hover:shadow-warm-coral/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Quick Actions */}
            {messages.length > 0 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                <span className="text-xs text-stone-500 flex-shrink-0">Quick:</span>
                {QUICK_PROMPTS.slice(0, 4).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt.prompt)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-50 hover:bg-warm-light border border-stone-200 hover:border-warm-coral rounded-full text-xs text-stone-700 hover:text-warm-taupe transition-colors flex-shrink-0"
                  >
                    <span>{prompt.icon}</span>
                    <span>{prompt.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-semibold text-stone-900">Add to Wardrobe</h3>
              <button
                onClick={closeUploadModal}
                className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            {filePreview && (
              <div className="mb-4">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Color (optional)
              </label>
              <input
                type="text"
                value={uploadColor}
                onChange={(e) => setUploadColor(e.target.value)}
                placeholder="e.g., Navy Blue, Red"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
              />
            </div>

            {/* Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Name (optional)
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g., Casual Cotton Shirt"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeUploadModal}
                className="flex-1 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors border border-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={uploadWardrobeItem}
                disabled={isUploadingWardrobe}
                className="flex-1 px-4 py-2.5 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isUploadingWardrobe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Add to Wardrobe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


