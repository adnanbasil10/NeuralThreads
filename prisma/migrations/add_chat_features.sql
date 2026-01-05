-- Migration: Add Message Read Receipts and Reactions
-- This migration adds read receipts and emoji reactions to messages

-- Step 1: Add read receipt fields to Message table
ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "readBy" TEXT;

-- Step 2: Create MessageReaction table
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add foreign key constraints
ALTER TABLE "MessageReaction" 
ADD CONSTRAINT "MessageReaction_messageId_fkey" 
FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReaction" 
ADD CONSTRAINT "MessageReaction_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Create unique constraint (one user can only add one of each emoji per message)
CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_userId_emoji_key" 
ON "MessageReaction"("messageId", "userId", "emoji");

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS "MessageReaction_messageId_idx" 
ON "MessageReaction"("messageId");

CREATE INDEX IF NOT EXISTS "MessageReaction_userId_idx" 
ON "MessageReaction"("userId");

CREATE INDEX IF NOT EXISTS "Message_readBy_idx" 
ON "Message"("readBy");

