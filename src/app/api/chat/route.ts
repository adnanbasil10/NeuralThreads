import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';

// POST: Create new chat
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { designerId, tailorId } = body;

    if (!designerId && !tailorId) {
      return NextResponse.json(
        { success: false, error: 'Either designerId or tailorId is required' },
        { status: 400 }
      );
    }

    if (designerId && tailorId) {
      return NextResponse.json(
        { success: false, error: 'Cannot create chat with both designer and tailor' },
        { status: 400 }
      );
    }

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    let existingChat = null;
    let chat = null;

    if (designerId) {
      // Check if designer exists
      const designer = await prisma.designer.findUnique({
        where: { id: designerId },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      if (!designer) {
        return NextResponse.json(
          { success: false, error: 'Designer not found' },
          { status: 404 }
        );
      }

      // Check if chat already exists
      existingChat = await prisma.chat.findUnique({
        where: {
          customerId_designerId: {
            customerId: customer.id,
            designerId: designer.id,
          },
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          designer: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (existingChat) {
        return NextResponse.json({
          success: true,
          data: existingChat,
          message: 'Chat already exists',
        });
      }

      // Create new chat
      chat = await prisma.chat.create({
        data: {
          customerId: customer.id,
          designerId: designer.id,
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          designer: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    } else if (tailorId) {
      // Check if tailor exists
      const tailor = await prisma.tailor.findUnique({
        where: { id: tailorId },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      if (!tailor) {
        return NextResponse.json(
          { success: false, error: 'Tailor not found' },
          { status: 404 }
        );
      }

      // Check if chat already exists
      existingChat = await prisma.chat.findUnique({
        where: {
          customerId_tailorId: {
            customerId: customer.id,
            tailorId: tailor.id,
          },
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          tailor: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (existingChat) {
        return NextResponse.json({
          success: true,
          data: existingChat,
          message: 'Chat already exists',
        });
      }

      // Create new chat
      chat = await prisma.chat.create({
        data: {
          customerId: customer.id,
          tailorId: tailor.id,
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          tailor: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    }

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Failed to create chat - no chat object returned' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: chat,
        message: 'Chat created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Get user's chats
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let chats;

    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer profile not found' },
          { status: 404 }
        );
      }

      chats = await prisma.chat.findMany({
        where: { customerId: customer.id },
        include: {
          customer: {
            select: {
              id: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          designer: {
            select: {
              id: true,
              profilePhoto: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          tailor: {
            select: {
              id: true,
              profilePhoto: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Fetch all unread counts in a single query (fixes N+1 problem)
      const chatIds = chats.map(chat => chat.id);
      const unreadMessages = await prisma.message.groupBy({
        by: ['chatId'],
        where: {
          chatId: { in: chatIds },
          senderId: { not: user.userId },
          isRead: false,
        },
        _count: {
          id: true,
        },
      });

      // Create a map of chatId to unread count
      const unreadCountMap = new Map(
        unreadMessages.map(msg => [msg.chatId, msg._count.id])
      );

      // Add unread count for each chat
      const chatsWithUnread = chats.map((chat) => ({
        ...chat,
        unreadCount: unreadCountMap.get(chat.id) || 0,
      }));

      return NextResponse.json({
        success: true,
        data: chatsWithUnread,
      });
    } else if (user.role === 'DESIGNER') {
      const designer = await prisma.designer.findUnique({
        where: { userId: user.userId },
        select: { id: true }, // Only select id to reduce data transfer
      });

      if (!designer) {
        return NextResponse.json(
          { success: false, error: 'Designer profile not found' },
          { status: 404 }
        );
      }

      // Fetch chats with customer info only (no messages to avoid N+1)
      // Limit to 100 chats to prevent loading too many at once
      chats = await prisma.chat.findMany({
        where: { designerId: designer.id },
        select: {
          id: true,
          customerId: true,
          designerId: true,
          tailorId: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100, // Limit to prevent loading too many chats
      });

      const chatIds = chats.map(chat => chat.id);

      if (chatIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // Fetch last messages for all chats efficiently
      // Get all recent messages, then group by chatId in memory (more efficient than N+1)
      const recentMessages = await prisma.message.findMany({
        where: {
          chatId: { in: chatIds },
        },
        select: {
          id: true,
          chatId: true,
          content: true,
          createdAt: true,
          isRead: true,
          imageUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        // Fetch more than needed, then group in memory
        take: chatIds.length * 2, // Get up to 2 messages per chat
      });

      // Group by chatId and take the first (most recent) for each chat
      const lastMessageMap = new Map<string, typeof recentMessages[0]>();
      for (const msg of recentMessages) {
        if (!lastMessageMap.has(msg.chatId)) {
          lastMessageMap.set(msg.chatId, msg);
        }
      }

      // Fetch all unread counts in a single query (optimized with composite index)
      const unreadMessages = await prisma.message.groupBy({
        by: ['chatId'],
        where: {
          chatId: { in: chatIds },
          senderId: { not: user.userId },
          isRead: false,
        },
        _count: {
          id: true,
        },
      });

      // Create map for unread counts
      const unreadCountMap = new Map(
        unreadMessages.map(msg => [msg.chatId, msg._count.id])
      );

      // Combine all data
      const chatsWithData = chats.map((chat) => ({
        ...chat,
        messages: lastMessageMap.has(chat.id)
          ? [lastMessageMap.get(chat.id)!]
          : [],
        unreadCount: unreadCountMap.get(chat.id) || 0,
      }));

      return NextResponse.json({
        success: true,
        data: chatsWithData,
      });
    } else if (user.role === 'TAILOR') {
      const tailor = await prisma.tailor.findUnique({
        where: { userId: user.userId },
        select: { id: true }, // Only select id to reduce data transfer
      });

      if (!tailor) {
        return NextResponse.json(
          { success: false, error: 'Tailor profile not found' },
          { status: 404 }
        );
      }

      // Fetch chats with customer info only (no messages to avoid N+1)
      // Limit to 100 chats to prevent loading too many at once
      chats = await prisma.chat.findMany({
        where: { tailorId: tailor.id },
        select: {
          id: true,
          customerId: true,
          designerId: true,
          tailorId: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100, // Limit to prevent loading too many chats
      });

      const chatIds = chats.map(chat => chat.id);

      if (chatIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // Fetch last messages for all chats efficiently
      // Get all recent messages, then group by chatId in memory (more efficient than N+1)
      const recentMessages = await prisma.message.findMany({
        where: {
          chatId: { in: chatIds },
        },
        select: {
          id: true,
          chatId: true,
          content: true,
          createdAt: true,
          isRead: true,
          imageUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        // Fetch more than needed, then group in memory
        take: chatIds.length * 2, // Get up to 2 messages per chat
      });

      // Group by chatId and take the first (most recent) for each chat
      const lastMessageMap = new Map<string, typeof recentMessages[0]>();
      for (const msg of recentMessages) {
        if (!lastMessageMap.has(msg.chatId)) {
          lastMessageMap.set(msg.chatId, msg);
        }
      }

      // Fetch all unread counts in a single query (optimized with composite index)
      const unreadMessages = await prisma.message.groupBy({
        by: ['chatId'],
        where: {
          chatId: { in: chatIds },
          senderId: { not: user.userId },
          isRead: false,
        },
        _count: {
          id: true,
        },
      });

      // Create map for unread counts
      const unreadCountMap = new Map(
        unreadMessages.map(msg => [msg.chatId, msg._count.id])
      );

      // Combine all data
      const chatsWithData = chats.map((chat) => ({
        ...chat,
        messages: lastMessageMap.has(chat.id)
          ? [lastMessageMap.get(chat.id)!]
          : [],
        unreadCount: unreadCountMap.get(chat.id) || 0,
      }));

      return NextResponse.json({
        success: true,
        data: chatsWithData,
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
