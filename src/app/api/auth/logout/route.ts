import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, clearRefreshCookie } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';

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

    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
        data: {
          redirectTo: '/login',
        },
      },
      { status: 200 }
    );

    clearAuthCookie(response);
    clearRefreshCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = NextResponse.redirect(
      new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000')
    );

    clearAuthCookie(response);
    clearRefreshCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

