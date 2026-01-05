import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyEmailToken } from '@/lib/auth/jwt';
import { sendWelcomeEmail } from '@/lib/email/sender';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    const decoded = verifyEmailToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const { userId, email } = decoded;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: true, message: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Verify email matches
    if (user.email !== email) {
      return NextResponse.json(
        { success: false, error: 'Token does not match user email' },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, user.role);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully. You can now log in.',
        data: {
          redirectTo: '/login',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}

// Also handle POST for resending verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { success: true, message: 'If an account exists, a verification email has been sent' },
        { status: 200 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Import here to avoid circular dependency
    const { generateEmailVerificationToken } = await import('@/lib/auth/jwt');
    const { sendVerificationEmail } = await import('@/lib/email/sender');

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken(user.id, user.email);

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verificationToken },
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.name);

    return NextResponse.json(
      { success: true, message: 'Verification email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while sending verification email' },
      { status: 500 }
    );
  }
}










