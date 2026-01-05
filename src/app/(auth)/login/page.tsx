'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  Check,
  RefreshCw,
  User,
  Scissors,
  Palette,
} from 'lucide-react';
import { useCsrfToken } from '@/hooks/useCsrfToken';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { csrfToken, refreshCsrfToken, isFetchingCsrfToken } = useCsrfToken();

  // Clear error when user types
  useEffect(() => {
    if (error) {
      setError('');
      setErrorCode('');
    }
  }, [email, password, error]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorCode('');

    try {
      // Always refresh CSRF token before submission to ensure we have a fresh token and cookie
      // This prevents issues with stale tokens or missing cookies
      const token = await refreshCsrfToken();
      
      if (!token) {
        setError('Unable to verify the request. Please refresh the page and try again.');
        setIsLoading(false);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
        credentials: 'include', // Important for cookies
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setError('Invalid response from server. Please try again.');
        setIsLoading(false);
        return;
      }

      if (response.ok && data.success) {
        // Always redirect to role-based dashboard, ignoring any redirect parameter
        // Map role to dashboard/landing page
        const roleLandingPages: Record<string, string> = {
          CUSTOMER: '/customer', // Customers go to dashboard
          DESIGNER: '/designer',
          TAILOR: '/tailor',
        };

        // Get role from response
        const userRole = data.data?.user?.role || data.data?.role;
        
        // Always use role-based dashboard, never use redirectTo parameter
        const redirectUrl = userRole 
          ? (roleLandingPages[userRole] || '/customer')
          : '/customer';

        console.log('Login successful, redirecting to role-based dashboard:', redirectUrl);
        console.log('User role:', userRole);
        console.log('User data:', data.data);

        // Wait a moment for cookies to be set, then redirect
        // This ensures the auth cookie is available when the page loads
        router.refresh();
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      } else {
        // If CSRF error, try refreshing token and show helpful message
        if (data.error?.includes('CSRF') || response.status === 403) {
          setError('Session expired. Please try again.');
          // Refresh token for next attempt
          await refreshCsrfToken();
        } else if (response.status === 500) {
          // Server error - show the specific error message if available
          setError(data.error || 'An error occurred during login. Please try again.');
          setErrorCode(data.code || '');
          // Log additional details in development
          if (process.env.NODE_ENV === 'development' && data.details) {
            console.error('Server error details:', data.details);
          }
        } else {
          setError(data.error || 'Invalid email or password');
          setErrorCode(data.code || '');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address to resend verification');
      return;
    }

    setIsResending(true);

    try {
      // Always refresh CSRF token before submission to ensure we have a fresh token and cookie
      const token = await refreshCsrfToken();
      if (!token) {
        setError('Unable to verify the request. Please refresh the page and try again.');
        setIsResending(false);
        return;
      }

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendSuccess(true);
        setError('');
        setErrorCode('');
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50 flex items-center justify-center py-12 px-4">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-rose-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-stone-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-stone-900 tracking-tight">
                Neural Threads
              </h1>
              <p className="text-[10px] text-stone-500 tracking-widest uppercase">
                Cognitive Couture
              </p>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-stone-300/20 p-8 border border-stone-200">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-stone-900 mb-2">Welcome back</h1>
            <p className="text-stone-700">Sign in to your account to continue</p>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <div className="mb-6 p-4 bg-stone-50 border border-stone-300 rounded-xl flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-stone-700" />
              </div>
              <p className="text-stone-800 text-sm font-medium">
                Verification email sent! Please check your inbox.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-700" />
                </div>
                <div className="flex-1">
                  <p className="text-rose-800 text-sm font-medium">{error}</p>
                  {errorCode === 'EMAIL_NOT_VERIFIED' && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="mt-2 text-sm font-medium text-rose-700 hover:text-rose-900 flex items-center gap-1 transition-colors"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Resend verification email
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-stone-300 focus:border-stone-600 focus:ring-4 focus:ring-stone-200 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-stone-300 focus:border-stone-600 focus:ring-4 focus:ring-stone-200 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-stone-300 rounded-md peer-checked:border-stone-700 peer-checked:bg-stone-700 transition-all flex items-center justify-center">
                    {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                  Remember me
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isFetchingCsrfToken || !csrfToken}
              className="w-full py-4 bg-stone-900 text-white rounded-full font-semibold hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-stone-500">New to Neural Threads?</span>
            </div>
          </div>

          {/* Signup Options */}
          <div className="space-y-3">
            <p className="text-center text-sm text-stone-700 mb-4">Create an account as:</p>
            
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/signup/customer"
                className="group p-4 rounded-xl border-2 border-stone-300 hover:border-stone-600 hover:bg-stone-50 transition-all text-center"
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-stone-100 rounded-xl flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                  <User className="w-5 h-5 text-stone-700" />
                </div>
                <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900 transition-colors">
                  Customer
                </span>
              </Link>

              <Link
                href="/signup/designer"
                className="group p-4 rounded-xl border-2 border-stone-300 hover:border-rose-300 hover:bg-rose-50 transition-all text-center"
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <Palette className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-sm font-medium text-stone-700 group-hover:text-rose-700 transition-colors">
                  Designer
                </span>
              </Link>

              <Link
                href="/signup/tailor"
                className="group p-4 rounded-xl border-2 border-stone-300 hover:border-amber-400 hover:bg-amber-50 transition-all text-center"
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Scissors className="w-5 h-5 text-amber-700" />
                </div>
                <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 transition-colors">
                  Tailor
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-stone-600">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-stone-700 hover:text-stone-900 transition-colors font-medium">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-stone-700 hover:text-stone-900 transition-colors font-medium">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
