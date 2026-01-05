import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'nt.csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const CSRF_TTL_SECONDS = 60 * 60; // 1 hour

function getSecret(): string {
  return process.env.CSRF_SECRET || process.env.JWT_SECRET || 'neural-threads-csrf-secret';
}

function hashToken(token: string): string {
  return createHmac('sha256', getSecret()).update(token).digest('hex');
}

export function createCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function attachCsrfCookie(response: NextResponse, token: string): void {
  const hashedToken = hashToken(token);
  const cookieOptions: Parameters<typeof response.cookies.set>[2] = {
    httpOnly: true,
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    secure: process.env.NODE_ENV === 'production',
    maxAge: CSRF_TTL_SECONDS,
    path: '/',
  };
  
  // In development, ensure cookie works on localhost
  if (process.env.NODE_ENV === 'development') {
    cookieOptions.secure = false;
  }
  
  response.cookies.set(CSRF_COOKIE_NAME, hashedToken, cookieOptions);
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ CSRF cookie set:', {
      name: CSRF_COOKIE_NAME,
      hasValue: !!hashedToken,
      valueLength: hashedToken.length,
      options: cookieOptions,
    });
  }
}

export function validateCsrfToken(request: NextRequest): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return;
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    throw new Error('Missing CSRF token');
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) {
    throw new Error('Missing CSRF secret');
  }

  const hashedHeader = hashToken(headerToken);
  const headerBuffer = Buffer.from(hashedHeader, 'hex');
  const cookieBuffer = Buffer.from(cookieToken, 'hex');

  if (
    headerBuffer.length === 0 ||
    cookieBuffer.length === 0 ||
    headerBuffer.length !== cookieBuffer.length ||
    !timingSafeEqual(headerBuffer, cookieBuffer)
  ) {
    throw new Error('Invalid CSRF token');
  }
}


