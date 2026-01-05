import { NextResponse } from 'next/server';
import { attachCsrfCookie, createCsrfToken } from '@/lib/security/csrf';

export async function GET() {
  const token = createCsrfToken();
  const response = NextResponse.json({ success: true, token });
  attachCsrfCookie(response, token);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 CSRF token generated and cookie set');
  }
  
  return response;
}




