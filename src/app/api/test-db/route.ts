import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db/test-connection';

/**
 * Test database connection endpoint
 * Useful for debugging database issues
 * GET /api/test-db
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const result = await testDatabaseConnection();

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      databaseUrl: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set',
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        details: result.details,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set',
      },
      { status: 500 }
    );
  }
}









