import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file.\n' +
      'For Gmail, you need to:\n' +
      '1. Enable 2-Step Verification\n' +
      '2. Generate an App Password: https://myaccount.google.com/apppasswords\n' +
      '3. Use the App Password as SMTP_PASS'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

// Create transporter lazily to ensure env vars are loaded
let transporterInstance: ReturnType<typeof createTransporter> | null = null;

function getTransporter() {
  if (!transporterInstance) {
    transporterInstance = createTransporter();
  }
  return transporterInstance;
}

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Neural Threads <noreply@neuralthreads.com>';

/**
 * Base email template with Neural Threads branding
 */
function getEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neural Threads</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px; color: white;">✦</span>
                </div>
                <span style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Neural Threads</span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #a3a3a3;">Where Fashion Meets Technology</p>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #171717 0%, #0f0f0f 100%); border-radius: 24px; border: 1px solid #262626;">
                <tr>
                  <td style="padding: 48px 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #525252;">
                © ${new Date().getFullYear()} Neural Threads. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #404040;">
                This email was sent to you because you signed up for Neural Threads.
                <br>
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send verification email to new users
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string
): Promise<void> {
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">
      Welcome to Neural Threads! 🎉
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
      Hi ${name}, we're thrilled to have you join our fashion community.
    </p>

    <div style="background: #262626; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #e5e5e5; line-height: 1.6;">
        To get started, please verify your email address by clicking the button below:
      </p>
      
      <a href="${verificationUrl}" 
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center;">
        Verify Email Address
      </a>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 14px; color: #737373; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 32px 0; font-size: 13px; color: #a855f7; word-break: break-all; background: #1a1a1a; padding: 12px 16px; border-radius: 8px; border: 1px solid #262626;">
      ${verificationUrl}
    </p>

    <div style="border-top: 1px solid #262626; padding-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #525252;">
        ⏱️ This link will expire in 24 hours for security reasons.
      </p>
    </div>
  `;

  const html = getEmailTemplate(content);

  try {
    const transporter = getTransporter();
    
    // Verify connection before sending
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: '✨ Verify your Neural Threads account',
      html,
    });
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: email,
      from: FROM_EMAIL,
    });
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error code:', (error as any).code);
      console.error('Error response:', (error as any).response);
    }
    throw error; // Re-throw to be caught by signup route
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string
): Promise<void> {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">
      Reset Your Password 🔐
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
      Hi ${name}, we received a request to reset your password.
    </p>

    <div style="background: #262626; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #e5e5e5; line-height: 1.6;">
        Click the button below to create a new password:
      </p>
      
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center;">
        Reset Password
      </a>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 14px; color: #737373; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 32px 0; font-size: 13px; color: #a855f7; word-break: break-all; background: #1a1a1a; padding: 12px 16px; border-radius: 8px; border: 1px solid #262626;">
      ${resetUrl}
    </p>

    <div style="border-top: 1px solid #262626; padding-top: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #525252;">
        ⏱️ This link will expire in 1 hour for security reasons.
      </p>
      <p style="margin: 0; font-size: 13px; color: #525252;">
        🛡️ If you didn't request this, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  const html = getEmailTemplate(content);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: '🔐 Reset your Neural Threads password',
    html,
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: string
): Promise<void> {
  const dashboardUrl = `${BASE_URL}/${role.toLowerCase()}`;

  const roleFeatures: Record<string, string[]> = {
    CUSTOMER: [
      '👗 Browse designer collections',
      '✨ Virtual try-on experience',
      '📍 Find tailors near you',
      '💬 Chat with designers',
    ],
    DESIGNER: [
      '🎨 Showcase your portfolio',
      '💼 Connect with customers',
      '📊 Track your analytics',
      '💬 Manage conversations',
    ],
    TAILOR: [
      '🪡 List your services',
      '📍 Get discovered locally',
      '📋 Manage alteration requests',
      '⭐ Build your reputation',
    ],
  };

  const features = roleFeatures[role] || roleFeatures.CUSTOMER;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">
      You're All Set! 🎉
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 16px; color: #a3a3a3; line-height: 1.6;">
      Welcome to the Neural Threads community, ${name}!
    </p>

    <div style="background: #262626; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
      <p style="margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #e5e5e5;">
        Here's what you can do:
      </p>
      
      ${features.map(feature => `
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #d4d4d4; line-height: 1.6;">
          ${feature}
        </p>
      `).join('')}
    </div>

    <a href="${dashboardUrl}" 
       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center;">
      Go to Dashboard
    </a>
  `;

  const html = getEmailTemplate(content);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: '🎉 Welcome to Neural Threads!',
    html,
  });
}


