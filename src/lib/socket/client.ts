import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
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

export interface TypingIndicator {
  odell: string;
  userName: string;
  isTyping: boolean;
}

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    socket = io(socketUrl, {
      autoConnect: true, // Auto-connect to enable real-time features
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
    
    socket.on('receive-message', (message) => {
      console.log('[Socket] Received message event:', message);
    });

    socket.on('connect_error', (error) => {
      // Suppress websocket errors - they're expected if the socket server isn't running
      // Only log non-critical errors in development
      if (process.env.NODE_ENV === 'development') {
        const errorMessage = error.message || String(error);
        // Suppress common connection errors (server not running, websocket errors)
        if (!errorMessage.includes('ECONNREFUSED') && 
            !errorMessage.includes('websocket') && 
            !errorMessage.includes('xhr poll error')) {
          console.warn('Socket connection error:', errorMessage);
        }
      }
      // Silently handle connection errors - socket will retry automatically
      // The app will work fine without real-time features
    });
  }

  return socket;
}

export function connectSocket(odell?: string, userName?: string, role?: string): Socket {
  const socket = getSocket();

  // Only connect if we have user data
  if (odell && userName && role) {
    // Register user after connection
    const registerUser = () => {
      console.log('[Socket] Registering user:', { odell, userName, role });
      socket.emit('register', { odell, userName, role });
    };

    // Set up registration handler
    socket.once('connect', registerUser);

    // If already connected, register immediately
    if (socket.connected) {
      console.log('[Socket] Already connected, registering immediately');
      registerUser();
    } else {
      // Connect if not already connected
      console.log('[Socket] Connecting socket...');
      socket.connect();
    }
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinChat(chatId: string, odell: string): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('join-chat', { chatId, odell });
  }
}

export function leaveChat(chatId: string): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('leave-chat', { chatId });
  }
}

export function sendMessage(
  chatId: string,
  content: string,
  senderId: string,
  imageUrl?: string
): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('send-message', { chatId, content, senderId, imageUrl });
  }
}

export function sendTyping(chatId: string, odell: string, userName: string): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('typing', { chatId, odell, userName });
  }
}

export function sendStopTyping(chatId: string, odell: string, userName: string): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('stop-typing', { chatId, odell, userName });
  }
}

export function markMessagesAsRead(chatId: string, odell: string): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('mark-read', { chatId, odell });
  }
}

export function onReceiveMessage(callback: (message: ChatMessage) => void): () => void {
  const socket = getSocket();
  console.log('[Socket Client] Setting up receive-message listener');
  
  const handler = (message: ChatMessage | any) => {
    console.log('[Socket Client] receive-message event fired:', message);
    
    // Ensure message has all required fields
    const formattedMessage: ChatMessage = {
      id: message.id || `msg-${Date.now()}`,
      chatId: message.chatId || '',
      content: message.content || '',
      senderId: message.senderId || '',
      senderName: message.senderName || 'Unknown',
      imageUrl: message.imageUrl || null,
      isRead: message.isRead || false,
      createdAt: message.createdAt || new Date().toISOString(),
    };
    
    console.log('[Socket Client] Formatted message:', formattedMessage);
    callback(formattedMessage);
  };
  
  // Set up listener immediately
  socket.on('receive-message', handler);
  
  // Also listen for connection to ensure listener is active
  socket.on('connect', () => {
    console.log('[Socket Client] Re-registering receive-message listener after reconnect');
    socket.on('receive-message', handler);
  });
  
  return () => {
    console.log('[Socket Client] Removing receive-message listener');
    socket.off('receive-message', handler);
  };
}

export function onUserTyping(callback: (data: TypingIndicator) => void): () => void {
  const socket = getSocket();
  socket.on('user-typing', callback);
  return () => socket.off('user-typing', callback);
}

export function onUserOnline(callback: (data: { odell: string; userName: string }) => void): () => void {
  const socket = getSocket();
  socket.on('user-online', callback);
  return () => socket.off('user-online', callback);
}

export function onUserOffline(callback: (data: { odell: string }) => void): () => void {
  const socket = getSocket();
  socket.on('user-offline', callback);
  return () => socket.off('user-offline', callback);
}

export function onMessagesRead(callback: (data: { chatId: string; readBy: string }) => void): () => void {
  const socket = getSocket();
  socket.on('messages-read', callback);
  return () => socket.off('messages-read', callback);
}

export function onMessageRead(callback: (data: { messageId: string; readBy: string; readAt: string }) => void): () => void {
  const socket = getSocket();
  socket.on('message-read', callback);
  return () => socket.off('message-read', callback);
}

export function onMessageReaction(callback: (data: { messageId: string; emoji: string; userId: string; action: string }) => void): () => void {
  const socket = getSocket();
  socket.on('message-reaction', callback);
  return () => socket.off('message-reaction', callback);
}
