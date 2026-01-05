-- Add performance indexes for Chat and Message models
-- These indexes optimize the designer chats endpoint

-- Index for sorting chats by most recent update
CREATE INDEX IF NOT EXISTS "Chat_updatedAt_idx" ON "Chat"("updatedAt");

-- Composite index for efficient unread count queries
-- This speeds up: WHERE chatId IN (...) AND senderId != ? AND isRead = false
CREATE INDEX IF NOT EXISTS "Message_chatId_isRead_senderId_idx" 
ON "Message"("chatId", "isRead", "senderId");

-- Composite index for fetching last message per chat
-- This speeds up: WHERE chatId IN (...) ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Message_chatId_createdAt_idx" 
ON "Message"("chatId", "createdAt" DESC);

