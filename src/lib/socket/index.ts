// Export client-side socket utilities
export {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinChat,
  leaveChat,
  sendMessage,
  sendTyping,
  sendStopTyping,
  markMessagesAsRead,
  onReceiveMessage,
  onUserTyping,
  onUserOnline,
  onUserOffline,
  onMessagesRead,
} from './client';

export type { ChatMessage, TypingIndicator } from './client';










