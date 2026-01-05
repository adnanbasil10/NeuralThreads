import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET || 'neural-threads-secret-key';
const ACCESS_TOKEN_EXPIRY: string = process.env.JWT_ACCESS_EXPIRY || '7d'; // Extended from 15m to 7d for better UX
const REFRESH_TOKEN_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || '30d';
const COOKIE_NAME = 'auth_token';
const REFRESH_COOKIE_NAME = 'auth_refresh';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  tokenType?: 'access' | 'refresh';
}

/**
 * Sign a short-lived access token
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(
    { ...payload, tokenType: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
  );
}

/**
 * Sign a refresh token
 */
export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { ...payload, tokenType: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (decoded.tokenType && decoded.tokenType !== 'access') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Token type mismatch:', decoded.tokenType, 'expected: access');
      }
      return null;
    }
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Token verification failed:', errorMessage);
      if (errorMessage.includes('expired')) {
        console.warn('Token has expired. Consider using refresh token.');
      }
    }
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (decoded.tokenType !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Set auth cookie on response with HTTP-only, secure, sameSite: 'lax'
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
  // Ensure cookie is set immediately
  console.log('✅ Auth cookie set:', COOKIE_NAME);
}

/**
 * Set refresh token cookie
 */
export function setRefreshCookie(response: NextResponse, token: string): void {
  response.cookies.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Clear auth cookie on response
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function clearRefreshCookie(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Get auth token from cookies (server-side)
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  return token?.value || null;
}

/**
 * Get current user from cookies (server-side)
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: 'email_verification' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify email verification token
 */
export function verifyEmailToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };
    
    if (decoded.type !== 'email_verification') {
      return null;
    }
    
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };
    
    if (decoded.type !== 'password_reset') {
      return null;
    }
    
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export { COOKIE_NAME };
export { REFRESH_COOKIE_NAME };
