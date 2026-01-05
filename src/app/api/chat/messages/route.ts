import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { chatLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { sanitizeString } from '@/lib/security/sanitizer';
import { isValidID } from '@/lib/security/validation';
import { cookies } from 'next/headers';
import { notifyNewMessage } from '@/lib/notifications/createNotification';

async function applyRateLimit(request: NextRequest, key: string) {
  try {
    await enforceRateLimit(request, chatLimiter, key);
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
  return null;
}

export async function POST(request: NextRequest) {
  try {
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
      // Log for debugging
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token');
      console.error('[API /chat/messages POST] Authentication failed:', {
        hasToken: !!token,
        tokenLength: token?.value?.length || 0,
        url: request.url,
      });
      
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in again.' },
        { status: 401 }
      );
    }

    const rateLimitResponse = await applyRateLimit(request, user.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { chatId, content, imageUrl } = body;

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    if (!isValidID(chatId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid chat ID' },
        { status: 400 }
      );
    }

    // Allow messages with either content or image (or both)
    if (!content && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Message must have either content or an image' },
        { status: 400 }
      );
    }

    const sanitizedContent = content ? sanitizeString(content).trim() : '';

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Authorization: Verify user is a participant in this chat
    const isParticipant = 
      (chat.customer?.user?.id === user.userId) ||
      (chat.designer?.user?.id === user.userId) ||
      (chat.tailor?.user?.id === user.userId);

    if (!isParticipant) {
      console.error('[API /chat/messages] Unauthorized message send attempt:', {
        chatId,
        userId: user.userId,
        userRole: user.role,
        chatCustomerId: chat.customer?.user?.id,
        chatDesignerId: chat.designer?.user?.id,
        chatTailorId: chat.tailor?.user?.id,
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You are not a participant in this chat' },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        content: sanitizedContent || ' ', // Prisma requires non-empty string, use space if no content
        senderId: user.userId,
        imageUrl: imageUrl ? sanitizeString(imageUrl) : null,
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

    // Create notification for recipient (if not the sender)
    try {
      let recipientUserId: string | null = null;
      
      // Determine recipient based on chat participants
      if (chat.customer?.user?.id === user.userId) {
        // Customer is sender - recipient is designer or tailor
        if (chat.designerId && chat.designer?.user?.id) {
          recipientUserId = chat.designer.user.id;
        } else if (chat.tailorId && chat.tailor?.user?.id) {
          recipientUserId = chat.tailor.user.id;
        }
      } else if (chat.designer?.user?.id === user.userId) {
        // Designer is sender - recipient is customer
        recipientUserId = chat.customer?.user?.id || null;
      } else if (chat.tailor?.user?.id === user.userId) {
        // Tailor is sender - recipient is customer
        recipientUserId = chat.customer?.user?.id || null;
      }

      if (recipientUserId && recipientUserId !== user.userId) {
        // Determine the correct chat link based on recipient role
        // Get recipient's role to determine correct route
        const recipientUser = await prisma.user.findUnique({
          where: { id: recipientUserId },
          select: { role: true },
        });
        
        let chatLink = `/customer/chats/${chatId}`;
        if (recipientUser?.role === 'DESIGNER') {
          chatLink = `/designer/chats/${chatId}`;
        } else if (recipientUser?.role === 'TAILOR') {
          chatLink = `/tailor/chats/${chatId}`;
        }
        
        const messagePreview = sanitizedContent || (imageUrl ? 'Sent an image' : 'New message');
        await notifyNewMessage(
          recipientUserId,
          message.sender.name,
          chatId,
          messagePreview,
          chatLink
        );
      }
    } catch (error) {
      // Don't fail the message send if notification creation fails
      console.error('Error creating notification for message:', error);
    }

    // Emit socket event for real-time updates via standalone socket server
    // This ensures messages are delivered instantly to all participants
    try {
      const socketPort = process.env.SOCKET_PORT || 3001;
      const socketUrl = process.env.SOCKET_URL || `http://localhost:${socketPort}`;
      
      const messagePayload = {
        id: message.id,
        chatId: message.chatId,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.name,
        imageUrl: message.imageUrl,
        isRead: message.isRead,
        createdAt: message.createdAt instanceof Date 
          ? message.createdAt.toISOString() 
          : typeof message.createdAt === 'string' 
            ? message.createdAt 
            : new Date().toISOString(),
      };
      
      // Emit with timeout to prevent blocking
      const emitPromise = fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: message.chatId,
          event: 'receive-message',
          message: messagePayload,
        }),
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      
      emitPromise
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            console.log('[API /chat/messages] ✅ Socket emission successful:', {
              chatId: message.chatId,
              clientCount: data.clientCount,
            });
          } else {
            const errorText = await res.text();
            console.warn('[API /chat/messages] ⚠️ Socket emission failed:', res.status, errorText);
          }
        })
        .catch((err) => {
          // Socket server might not be running - this is acceptable
          // Messages will still be saved and can be fetched via API
          if (err.name !== 'AbortError') {
            console.warn('[API /chat/messages] ⚠️ Socket server unavailable (messages still saved):', err.message);
          }
        });
    } catch (error) {
      // Don't fail message send if socket emission fails
      console.warn('[API /chat/messages] ⚠️ Socket emission error (non-critical):', error);
    }

    return NextResponse.json(
      {
        success: true,
        data: message,
        message: 'Message sent successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const rateLimitResponse = await applyRateLimit(request, user.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50); // Default to 20, max 50

    if (!chatId || !isValidID(chatId)) {
      return NextResponse.json(
        { success: false, error: 'Valid chat ID is required' },
        { status: 400 }
      );
    }

    // Check cache (only for GET requests, skip for real-time chat)
    // Note: We skip caching for chat messages to ensure real-time updates
    // const { apiCache, generateCacheKey } = await import('@/lib/cache/api-cache');
    // const cacheKey = generateCacheKey(`/api/chat/messages`, { chatId, cursor, limit: limit.toString() });
    // const cached = apiCache.get(cacheKey);
    // if (cached) {
    //   return NextResponse.json(cached, {
    //     headers: {
    //       'X-Cache': 'HIT',
    //       'Cache-Control': 'private, max-age=300', // 5 minutes
    //     },
    //   });
    // }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Authorization: Verify user is a participant in this chat
    const isParticipant = 
      (chat.customer?.user?.id === user.userId) ||
      (chat.designer?.user?.id === user.userId) ||
      (chat.tailor?.user?.id === user.userId);

    if (!isParticipant) {
      console.error('[API /chat/messages GET] Unauthorized access attempt:', {
        chatId,
        userId: user.userId,
        userRole: user.role,
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You are not a participant in this chat' },
        { status: 403 }
      );
    }

    // Optimized query with cursor-based pagination
    // Order by createdAt ASC to get oldest first, then reverse for display
    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' }, // Get newest first
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = messages.length > limit;
    const messageList = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? messageList[messageList.length - 1]?.id : null;

    // Reverse to show oldest first (chronological order)
    const orderedMessages = messageList.reverse();

    // Mark as read (non-blocking, fire and forget)
    // Only mark messages sent by others as read
    prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: user.userId },
        isRead: false,
      },
      data: { isRead: true },
    }).catch((error) => {
      // Log but don't block response
      console.warn('[API /chat/messages] Failed to mark messages as read:', error);
    });

    const response = {
      success: true,
      data: orderedMessages,
      pagination: {
        hasMore,
        nextCursor,
      },
    };

    // Don't cache chat messages for real-time updates
    // apiCache.set(cacheKey, response, 5 * 60 * 1000); // 5 minutes

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'DISABLED',
        'Cache-Control': 'no-store, no-cache, must-revalidate', // No cache for real-time chat
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
