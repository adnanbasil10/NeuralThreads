import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signToken, signRefreshToken, setAuthCookie, setRefreshCookie } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { enforceRateLimit, loginLimiter, RateLimitError } from '@/lib/security/rate-limit';
import { sanitizeAndValidateEmail } from '@/lib/security/validation';

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    try {
      validateCsrfToken(request);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    try {
      await enforceRateLimit(request, loginLimiter);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many login attempts. Please try again later.',
          },
          {
            status: error.statusCode,
            headers: error.retryAfter
              ? { 'Retry-After': error.retryAfter.toString() }
              : undefined,
          }
        );
      }
      throw error;
    }

    const rawBody: LoginBody = await request.json();

    const { password } = rawBody;
    let email: string;
    try {
      email = sanitizeAndValidateEmail(rawBody?.email);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          customer: true,
          designer: true,
          tailor: true,
        },
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      
      // Provide more specific error messages
      let userFriendlyError = 'Database connection error. Please try again.';
      if (errorMessage.includes('P1001') || errorMessage.includes('Can\'t reach database server')) {
        userFriendlyError = 'Database server is not accessible. Please check if the database is running.';
      } else if (errorMessage.includes('P1000') || errorMessage.includes('Authentication failed')) {
        userFriendlyError = 'Database authentication failed. Please check database credentials.';
      } else if (errorMessage.includes('P1003') || (errorMessage.includes('database') && errorMessage.includes('does not exist'))) {
        userFriendlyError = 'Database does not exist. Please create the database or check the connection string.';
      } else if (!process.env.DATABASE_URL) {
        userFriendlyError = 'Database configuration is missing. Please set DATABASE_URL in your environment.';
      }
      
      return NextResponse.json(
        { success: false, error: userFriendlyError },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has a password set
    if (!user.password) {
      console.error('User found but has no password hash:', user.id);
      return NextResponse.json(
        { success: false, error: 'Account setup incomplete. Please reset your password.' },
        { status: 401 }
      );
    }

    // Verify password
    let isValidPassword: boolean;
    try {
      isValidPassword = await verifyPassword(password, user.password);
    } catch (passwordError) {
      console.error('Password verification error:', passwordError);
      return NextResponse.json(
        { success: false, error: 'An error occurred during password verification. Please try again.' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Email verification check removed - accounts are immediately verified

    // Generate JWT token
    let token: string;
    let refreshToken: string;
    try {
      token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name || '',
      });
      refreshToken = signRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name || '',
      });
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { success: false, error: 'An error occurred during authentication. Please try again.' },
        { status: 500 }
      );
    }

    // Get role-specific profile data
    let profileData = null;
    switch (user.role) {
      case 'CUSTOMER':
        profileData = user.customer;
        break;
      case 'DESIGNER':
        profileData = user.designer;
        break;
      case 'TAILOR':
        profileData = user.tailor;
        break;
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            age: user.age,
            isEmailVerified: user.isEmailVerified,
            profile: profileData,
          },
          redirectTo: user.role === 'CUSTOMER' 
            ? '/customer' // Customers go to dashboard
            : `/${user.role.toLowerCase()}`,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only auth cookie
    try {
      setAuthCookie(response, token);
      setRefreshCookie(response, refreshToken);
    } catch (cookieError) {
      console.error('Cookie setting error:', cookieError);
      return NextResponse.json(
        { success: false, error: 'An error occurred while setting authentication cookies. Please try again.' },
        { status: 500 }
      );
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during login. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}
