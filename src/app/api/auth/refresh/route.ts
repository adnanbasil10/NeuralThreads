import { NextRequest, NextResponse } from 'next/server';
import {
  REFRESH_COOKIE_NAME,
  setAuthCookie,
  setRefreshCookie,
  signRefreshToken,
  signToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { apiLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';

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

    try {
      await enforceRateLimit(request, apiLimiter);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: 'Too many refresh attempts. Please try again later.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token missing' },
        { status: 401 }
      );
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const { tokenType, ...session } = payload;
    const accessToken = signToken(session);
    const newRefreshToken = signRefreshToken(session);

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, accessToken);
    setRefreshCookie(response, newRefreshToken);

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}










