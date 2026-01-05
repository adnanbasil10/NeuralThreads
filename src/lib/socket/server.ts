import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/db/prisma';

interface OnlineUser {
  odell: string;
  userName: string;
  role: string;
}

interface MessageData {
  chatId: string;
  content: string;
  senderId: string;
  imageUrl?: string;
}

interface TypingData {
  chatId: string;
  odell: string;
  userName: string;
}

// Store online users by their ID
const onlineUsers = new Map<string, OnlineUser>();

// Map socket ID to user ID
const socketToUser = new Map<string, string>();

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log('New socket connection:', socket.id);

    // Handle user authentication/registration
    socket.on('register', async (registerData: { odell: string; userName: string; role: string }) => {
      const odell = registerData.odell;
      const userName = registerData.userName;
      const role = registerData.role;

      onlineUsers.set(odell, { odell, userName, role });
      socketToUser.set(socket.id, odell);

      socket.join('user:' + odell);
      socket.broadcast.emit('user-online', { odell, userName });
    });

    // Handle joining a chat room
    socket.on('join-chat', async (joinData: { chatId: string; odell: string }) => {
      const chatId = joinData.chatId;
      const odell = joinData.odell;

      socket.join('chat:' + chatId);

      try {
        await prisma.message.updateMany({
          where: {
            chatId: chatId,
            senderId: { not: odell },
            isRead: false,
          },
          data: { isRead: true },
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle leaving a chat room
    socket.on('leave-chat', (leaveData: { chatId: string }) => {
      socket.leave('chat:' + leaveData.chatId);
    });

    // Handle sending a message
    socket.on('send-message', async (msgData: MessageData) => {
      const chatId = msgData.chatId;
      const content = msgData.content;
      const senderId = msgData.senderId;
      const imageUrl = msgData.imageUrl;

      try {
        const message = await prisma.message.create({
          data: {
            chatId,
            content,
            senderId,
            imageUrl: imageUrl || null,
            isRead: false,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        io?.to('chat:' + chatId).emit('receive-message', {
          id: message.id,
          chatId,
          content: message.content,
          senderId: message.senderId,
          senderName: message.sender.name,
          imageUrl: message.imageUrl,
          isRead: message.isRead,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (typingData: TypingData) => {
      socket.to('chat:' + typingData.chatId).emit('user-typing', {
        odell: typingData.odell,
        userName: typingData.userName,
        isTyping: true,
      });
    });

    // Handle stop typing
    socket.on('stop-typing', (stopTypingData: TypingData) => {
      socket.to('chat:' + stopTypingData.chatId).emit('user-typing', {
        odell: stopTypingData.odell,
        userName: stopTypingData.userName,
        isTyping: false,
      });
    });

    // Handle read receipt
    socket.on('mark-read', async (readData: { chatId: string; odell: string }) => {
      try {
        await prisma.message.updateMany({
          where: {
            chatId: readData.chatId,
            senderId: { not: readData.odell },
            isRead: false,
          },
          data: { isRead: true },
        });

        socket.to('chat:' + readData.chatId).emit('messages-read', {
          chatId: readData.chatId,
          readBy: readData.odell,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const odell = socketToUser.get(socket.id);

      if (odell) {
        onlineUsers.delete(odell);
        socketToUser.delete(socket.id);
        socket.broadcast.emit('user-offline', { odell });
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(odell: string, event: string, data: unknown): void {
  io?.to('user:' + odell).emit(event, data);
}

export function emitToChat(chatId: string, event: string, data: unknown): void {
  io?.to('chat:' + chatId).emit(event, data);
}

export function isUserOnline(odell: string): boolean {
  return onlineUsers.has(odell);
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}
