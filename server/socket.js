/**
 * Socket.io Server for Neural Threads
 * 
 * Run with: npm run socket
 * 
 * This server handles real-time communication for:
 * - Chat messages between users
 * - Typing indicators
 * - Online status
 */

const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.SOCKET_PORT || 3001;

// Create HTTP server
const httpServer = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Endpoint for API routes to emit messages
  if (req.method === 'POST' && req.url === '/emit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { chatId, event, message } = data;
        
        if (chatId && event && message) {
          console.log(`[Socket Server] Emitting ${event} to chat:${chatId}`);
          console.log(`[Socket Server] Message payload:`, JSON.stringify(message, null, 2));
          
          const roomName = `chat:${chatId}`;
          const room = io.sockets.adapter.rooms.get(roomName);
          const clientCount = room ? room.size : 0;
          
          console.log(`[Socket Server] Room ${roomName} has ${clientCount} clients`);
          
          // Emit to all clients in the chat room
          io.to(roomName).emit(event, message);
          
          console.log(`[Socket Server] Message emitted successfully to ${clientCount} client(s)`);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, clientCount }));
        } else {
          console.error(`[Socket Server] Missing required fields:`, { chatId: !!chatId, event: !!event, message: !!message });
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
        }
      } catch (error) {
        console.error(`[Socket Server] Error emitting message:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Handle user authentication/joining (support both event names)
  socket.on('join', (userId) => {
    if (!userId) return;
    
    connectedUsers.set(socket.id, userId);
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} joined`);
    
    // Notify others that user is online (emit both formats for compatibility)
    socket.broadcast.emit('user-online', { odell: userId, userId });
    socket.broadcast.emit('userOnline', { userId });
  });

  socket.on('register', (registerData) => {
    const odell = typeof registerData === 'string' ? registerData : registerData?.odell;
    const userName = registerData?.userName || 'User';
    const role = registerData?.role || 'USER';
    
    if (!odell) return;
    
    connectedUsers.set(socket.id, odell);
    socket.join(`user:${odell}`);
    console.log(`[Socket] User ${odell} (${userName}, ${role}) registered`);
    
    // Notify others that user is online
    socket.broadcast.emit('user-online', { odell, userName });
  });

  // Handle joining a chat room (support both event names)
  socket.on('joinChat', (chatId) => {
    if (!chatId) return;
    socket.join(`chat:${chatId}`);
    console.log(`[Socket] Socket ${socket.id} joined chat: ${chatId}`);
  });

  socket.on('join-chat', (joinData) => {
    const chatId = typeof joinData === 'string' ? joinData : joinData?.chatId;
    const odell = joinData?.odell;
    if (!chatId) return;
    
    socket.join(`chat:${chatId}`);
    console.log(`[Socket] Socket ${socket.id} joined chat: ${chatId} (user: ${odell || 'unknown'})`);
  });

  // Handle leaving a chat room (support both event names)
  socket.on('leaveChat', (chatId) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
    console.log(`[Socket] Socket ${socket.id} left chat: ${chatId}`);
  });

  socket.on('leave-chat', (leaveData) => {
    const chatId = typeof leaveData === 'string' ? leaveData : leaveData?.chatId;
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
    console.log(`[Socket] Socket ${socket.id} left chat: ${chatId}`);
  });

  // Handle new message (support both event names)
  socket.on('sendMessage', (data) => {
    const { chatId, message } = data;
    if (!chatId || !message) return;
    
    socket.to(`chat:${chatId}`).emit('newMessage', {
      chatId,
      message,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`[Socket] Message sent to chat: ${chatId}`);
  });

  socket.on('send-message', async (msgData) => {
    const { chatId, content, senderId, imageUrl } = msgData;
    if (!chatId || !content) return;
    
    // Broadcast to all users in the chat room
    io.to(`chat:${chatId}`).emit('receive-message', {
      id: `temp-${Date.now()}`,
      chatId,
      content,
      senderId,
      senderName: 'User',
      imageUrl: imageUrl || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    
    console.log(`[Socket] Message sent to chat: ${chatId} from ${senderId}`);
  });

  // Handle typing indicator (support both event names)
  socket.on('typing', (typingData) => {
    const chatId = typingData?.chatId || typingData?.chatId;
    const odell = typingData?.odell || typingData?.userId;
    const userName = typingData?.userName || 'User';
    
    if (!chatId || !odell) return;
    
    socket.to(`chat:${chatId}`).emit('user-typing', {
      odell,
      userName,
      isTyping: true,
    });
    
    // Also emit old format for compatibility
    socket.to(`chat:${chatId}`).emit('userTyping', {
      chatId,
      userId: odell,
      isTyping: true,
    });
  });

  socket.on('stop-typing', (stopTypingData) => {
    const chatId = stopTypingData?.chatId;
    const odell = stopTypingData?.odell || stopTypingData?.userId;
    const userName = stopTypingData?.userName || 'User';
    
    if (!chatId || !odell) return;
    
    socket.to(`chat:${chatId}`).emit('user-typing', {
      odell,
      userName,
      isTyping: false,
    });
    
    // Also emit old format for compatibility
    socket.to(`chat:${chatId}`).emit('userTyping', {
      chatId,
      userId: odell,
      isTyping: false,
    });
  });

  // Handle message read status (support both event names)
  socket.on('markRead', (data) => {
    const { chatId, userId, messageIds } = data;
    if (!chatId || !userId) return;
    
    socket.to(`chat:${chatId}`).emit('messagesRead', {
      chatId,
      userId,
      messageIds,
    });
  });

  socket.on('mark-read', (readData) => {
    const { chatId, odell } = readData;
    if (!chatId || !odell) return;
    
    socket.to(`chat:${chatId}`).emit('messages-read', {
      chatId,
      readBy: odell,
    });
  });

  // Handle message read receipt
  socket.on('message-read', (readData) => {
    const { messageId, chatId, readBy } = readData;
    if (!messageId || !chatId || !readBy) return;
    
    io.to(`chat:${chatId}`).emit('message-read', {
      messageId,
      readBy,
      readAt: new Date().toISOString(),
    });
  });

  // Handle message reaction
  socket.on('message-reaction', (reactionData) => {
    const { messageId, chatId, emoji, userId, action } = reactionData;
    if (!messageId || !chatId || !emoji || !userId) return;
    
    io.to(`chat:${chatId}`).emit('message-reaction', {
      messageId,
      emoji,
      userId,
      action: action || 'added',
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const userId = connectedUsers.get(socket.id);
    
    if (userId) {
      connectedUsers.delete(socket.id);
      
      // Notify others that user is offline (emit both formats for compatibility)
      socket.broadcast.emit('user-offline', { odell: userId, userId });
      socket.broadcast.emit('userOffline', { userId });
      console.log(`[Socket] User ${userId} disconnected: ${reason}`);
    } else {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Socket] Error for ${socket.id}:`, error);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Neural Threads Socket.io Server        ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Status: Running                           ║`);
  console.log(`║  Port: ${PORT}                                ║`);
  console.log(`║  Health: http://localhost:${PORT}/health       ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Socket] SIGTERM received, shutting down...');
  httpServer.close(() => {
    console.log('[Socket] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Socket] SIGINT received, shutting down...');
  httpServer.close(() => {
    console.log('[Socket] Server closed');
    process.exit(0);
  });
});

