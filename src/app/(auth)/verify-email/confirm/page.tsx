'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  Mail,
  ShieldCheck,
} from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRequestingNew, setIsRequestingNew] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.message || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  // Handle request new verification link
  const handleRequestNew = async () => {
    setIsRequestingNew(true);
    // Redirect to verify-email page where they can request a new link
    router.push('/verify-email');
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

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-12 h-12 text-indigo-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-32 h-32 text-indigo-300 animate-spin" />
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-500">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center animate-scale-in">
                    <CheckCircle className="w-14 h-14 text-green-500" />
                  </div>
                  {/* Sparkle effects */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping opacity-75" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75 animation-delay-200" />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified Successfully!
              </h1>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                Your account is now active and you can start exploring Neural Threads.
              </p>

              {/* Success badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm font-medium mb-6">
                <ShieldCheck className="w-4 h-4" />
                Account Verified
              </div>

              {/* Continue Button */}
              <Link
                href="/login"
                className="block w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                Continue to Login
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Additional info */}
              <p className="mt-6 text-sm text-gray-500">
                You can now sign in with your email and password to access your account.
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-14 h-14 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>

              {/* Error Message */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm">
                  {errorMessage === 'Token has expired' ? (
                    <>
                      <strong>Your verification link has expired.</strong>
                      <br />
                      Verification links are valid for 24 hours. Please request a new one.
                    </>
                  ) : errorMessage === 'Invalid token' || errorMessage === 'Invalid or expired token' ? (
                    <>
                      <strong>Invalid verification link.</strong>
                      <br />
                      The link may have already been used or is malformed.
                    </>
                  ) : errorMessage === 'No verification token provided' ? (
                    <>
                      <strong>No verification token found.</strong>
                      <br />
                      Please use the link from your verification email.
                    </>
                  ) : (
                    errorMessage
                  )}
                </p>
              </div>

              {/* Request New Link Button */}
              <button
                onClick={handleRequestNew}
                disabled={isRequestingNew}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 mb-4"
              >
                {isRequestingNew ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Request New Verification Link
                  </>
                )}
              </button>

              {/* Back to Login */}
              <Link
                href="/login"
                className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Having trouble?{' '}
          <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Contact Support
          </Link>
        </p>
      </div>

      {/* Add custom animation styles */}
      <style jsx global>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}


