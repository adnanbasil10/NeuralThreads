import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { validateCsrfToken } from '@/lib/security/csrf';
import { apiLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { validatePassword } from '@/lib/security/validation';

export async function PUT(request: NextRequest) {
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
          { success: false, message: 'Too many password attempts. Please wait and try again.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const isValidPassword = await verifyPassword(currentPassword, dbUser.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const isSamePassword = await verifyPassword(newPassword, dbUser.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to change password' },
      { status: 500 }
    );
  }
}

