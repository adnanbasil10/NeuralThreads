import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { chatLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';

/**
 * POST /api/chat/messages/[messageId]/reactions
 * Add or remove a reaction to a message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    // Validate CSRF token
    try {
      validateCsrfToken(request);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Apply rate limiting (more lenient for reactions)
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

    const { messageId } = params;
    const body = await request.json();
    const { emoji, action = 'toggle' } = body; // action: 'add' | 'remove' | 'toggle'

    if (!messageId || !emoji) {
      return NextResponse.json(
        { success: false, error: 'Message ID and emoji are required' },
        { status: 400 }
      );
    }

    // Validate emoji (basic check - should be a single emoji character)
    if (emoji.length > 2 || !/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(emoji)) {
      return NextResponse.json(
        { success: false, error: 'Invalid emoji' },
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
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
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

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: messageId,
          userId: user.userId,
          emoji: emoji,
        },
      },
    });

    let reaction;

    if (action === 'remove' || (action === 'toggle' && existingReaction)) {
      // Remove reaction
      if (existingReaction) {
        await prisma.messageReaction.delete({
          where: { id: existingReaction.id },
        });
        reaction = null;
      }
    } else {
      // Add reaction
      if (existingReaction) {
        reaction = existingReaction;
      } else {
        reaction = await prisma.messageReaction.create({
          data: {
            messageId: messageId,
            userId: user.userId,
            emoji: emoji,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
    }

    // Get all reactions for this message
    const allReactions = await prisma.messageReaction.findMany({
      where: { messageId: messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Emit socket event for real-time reaction update
    try {
      const socketPort = process.env.SOCKET_PORT || 3001;
      const socketUrl = process.env.SOCKET_URL || `http://localhost:${socketPort}`;

      await fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: message.chatId,
          event: 'message-reaction',
          data: {
            messageId: messageId,
            reactions: allReactions,
            action: reaction ? 'added' : 'removed',
            emoji: emoji,
            userId: user.userId,
          },
        }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {
        // Socket server might not be running - non-critical
      });
    } catch (error) {
      // Don't fail if socket emission fails
      console.warn('[API /chat/messages/reactions] Socket emission failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        reaction: reaction,
        reactions: allReactions,
      },
    });
  } catch (error) {
    console.error('Error managing message reaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage reaction' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/messages/[messageId]/reactions
 * Get all reactions for a message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { messageId } = params;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get message to verify it exists and user has access
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

    // Verify user is a participant
    const isParticipant =
      message.chat.customer?.user?.id === user.userId ||
      message.chat.designer?.user?.id === user.userId ||
      message.chat.tailor?.user?.id === user.userId;

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all reactions
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: reactions,
    });
  } catch (error) {
    console.error('Error fetching message reactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}

