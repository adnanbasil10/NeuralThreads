import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { clearAuthCookie, clearRefreshCookie, getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { apiLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';

export async function DELETE(request: NextRequest) {
  try {
    try {
      validateCsrfToken(request);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      await enforceRateLimit(request, apiLimiter, user.userId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, message: 'Too many destructive requests. Please try again later.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    const userId = user.userId;
    const role = user.role;

    // Delete role-specific data first (cascade delete would handle this, but being explicit)
    if (role === 'CUSTOMER') {
      // Delete customer's wardrobe items
      const customer = await prisma.customer.findUnique({
        where: { userId },
      });
      
      if (customer) {
        // Delete wardrobe items
        await prisma.wardrobeItem.deleteMany({
          where: { customerId: customer.id },
        });

        // VirtualTryOn model removed - no longer needed

        // Delete alteration requests
        await prisma.alterationRequest.deleteMany({
          where: { customerId: customer.id },
        });

        // Delete chat messages from chats where customer participated
        const chats = await prisma.chat.findMany({
          where: { customerId: customer.id },
          select: { id: true },
        });
        
        for (const chat of chats) {
          await prisma.message.deleteMany({
            where: { chatId: chat.id },
          });
        }

        // Delete chats
        await prisma.chat.deleteMany({
          where: { customerId: customer.id },
        });

        // Delete customer profile
        await prisma.customer.delete({
          where: { userId },
        });
      }
    } else if (role === 'DESIGNER') {
      const designer = await prisma.designer.findUnique({
        where: { userId },
      });

      if (designer) {
        // Delete portfolio items
        await prisma.portfolioItem.deleteMany({
          where: { designerId: designer.id },
        });

        // Delete chat messages from chats where designer participated
        const chats = await prisma.chat.findMany({
          where: { designerId: designer.id },
          select: { id: true },
        });
        
        for (const chat of chats) {
          await prisma.message.deleteMany({
            where: { chatId: chat.id },
          });
        }

        // Delete chats
        await prisma.chat.deleteMany({
          where: { designerId: designer.id },
        });

        // Delete designer profile
        await prisma.designer.delete({
          where: { userId },
        });
      }
    } else if (role === 'TAILOR') {
      const tailor = await prisma.tailor.findUnique({
        where: { userId },
      });

      if (tailor) {
        // Delete sample work
        await prisma.sampleWork.deleteMany({
          where: { tailorId: tailor.id },
        });

        // Delete alteration requests
        await prisma.alterationRequest.deleteMany({
          where: { tailorId: tailor.id },
        });

        // Delete tailor profile
        await prisma.tailor.delete({
          where: { userId },
        });
      }
    }

    // Delete messages sent by this user
    await prisma.message.deleteMany({
      where: { senderId: userId },
    });

    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });

    clearAuthCookie(response);
    clearRefreshCookie(response);

    return response;
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}


