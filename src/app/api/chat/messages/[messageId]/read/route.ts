import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { chatLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';

/**
 * POST /api/chat/messages/[messageId]/read
 * Mark a message as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Apply rate limiting (more lenient for read receipts)
    try {
      await enforceRateLimit(request, chatLimiter, user.userId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please slow down.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get message with chat info to verify authorization
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
            designer: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
            tailor: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant in this chat
    const isParticipant =
      message.chat.customer?.user?.id === user.userId ||
      message.chat.designer?.user?.id === user.userId ||
      message.chat.tailor?.user?.id === user.userId;

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You are not a participant in this chat' },
        { status: 403 }
      );
    }

    // Don't mark own messages as read
    if (message.senderId === user.userId) {
      return NextResponse.json({
        success: true,
        data: { message: 'Own messages are not marked as read' },
      });
    }

    // Update message read status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
        readBy: user.userId,
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

    // Emit socket event for real-time read receipt update
    try {
      const socketPort = process.env.SOCKET_PORT || 3001;
      const socketUrl = process.env.SOCKET_URL || `http://localhost:${socketPort}`;

      await fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: message.chatId,
          event: 'message-read',
          data: {
            messageId: messageId,
            readBy: user.userId,
            readAt: updatedMessage.readAt?.toISOString(),
          },
        }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {
        // Socket server might not be running - non-critical
      });
    } catch (error) {
      // Don't fail if socket emission fails
      console.warn('[API /chat/messages/read] Socket emission failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}

