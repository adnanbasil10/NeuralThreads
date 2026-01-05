import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { sanitizeString } from '@/lib/security/sanitizer';

// POST: Save a message to a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateCsrfToken(request);

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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

    const { id: conversationId } = await params;
    const body = await request.json();
    const { role, content, imageUrl, isMock } = body;

    if (!role || !content) {
      return NextResponse.json(
        { success: false, error: 'Role and content are required' },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { success: false, error: 'Role must be "user" or "assistant"' },
        { status: 400 }
      );
    }

    // Verify the conversation belongs to this customer
    const conversation = await (prisma as any).chatbotConversation.findFirst({
      where: {
        id: conversationId,
        customerId: customer.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save the message
    const message = await (prisma as any).chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role,
        content: sanitizeString(content),
        imageUrl: imageUrl || null,
        isMock: isMock === true,
      },
    });

    // Update conversation's updatedAt timestamp
    await (prisma as any).chatbotConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save message',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
      },
      { status: 500 }
    );
  }
}

