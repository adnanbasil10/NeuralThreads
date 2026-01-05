'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Clock,
  Inbox,
  Send,
} from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle resend verification email
  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendSuccess(false);
    setResendError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setResendSuccess(true);
        setCountdown(60);
      } else {
        setResendError(data.message || 'Failed to resend verification email');
      }
    } catch {
      setResendError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Neural Threads
              </span>
            </Link>
          </div>

          {/* Mail Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <Mail className="w-12 h-12 text-indigo-600" />
              </div>
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-20" />
              {/* Envelope indicator */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Send className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Check Your Email
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            We&apos;ve sent a verification link to
            <br />
            <span className="font-semibold text-indigo-600">{email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Inbox className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Click the link in the email to verify your account
                </p>
                <p className="text-xs text-gray-500">
                  The link will expire in 24 hours. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
            </div>
          </div>

          {/* Resend Section */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 text-center mb-4">
              Didn&apos;t receive the email?
            </p>

            {resendSuccess && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm mb-4 bg-green-50 rounded-lg py-2">
                <CheckCircle className="w-4 h-4" />
                Verification email sent successfully!
              </div>
            )}

            {resendError && (
              <div className="text-red-500 text-sm text-center mb-4 bg-red-50 rounded-lg py-2 px-3">
                {resendError}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                countdown > 0 || isResending
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-200'
              }`}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend Verification Email
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Back to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
