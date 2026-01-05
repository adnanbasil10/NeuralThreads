import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email/sender';

/**
 * Test endpoint to verify email configuration
 * GET /api/test-email?email=your-email@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testEmail = searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please provide an email address: /api/test-email?email=your-email@example.com' 
        },
        { status: 400 }
      );
    }

    // Generate a test token
    const testToken = 'test-token-' + Date.now();
    const testName = 'Test User';

    console.log('🧪 Testing email configuration...');
    console.log('📧 Sending test email to:', testEmail);

    await sendVerificationEmail(testEmail, testToken, testName);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      email: testEmail,
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code;
    const errorResponse = (error as any)?.response;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
        details: {
          message: errorMessage,
          code: errorCode,
          response: errorResponse,
          troubleshooting: [
            '1. Check that SMTP_USER and SMTP_PASS are set in .env',
            '2. For Gmail, use an App Password (not your regular password)',
            '3. Make sure 2-Step Verification is enabled',
            '4. Check server console for more details',
          ],
        },
      },
      { status: 500 }
    );
  }
}









