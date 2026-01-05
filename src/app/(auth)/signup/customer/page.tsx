'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import validator from 'validator';
import {
  Sparkles,
  User,
  MapPin,
  Heart,
  DollarSign,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Mail,
  X,
} from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { validatePassword } from '@/lib/security/validation';
import { useCsrfToken } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/lib/utils';

// Types
interface FormData {
  name: string;
  age: string;
  email: string;
  gender: string;
  password: string;
  confirmPassword: string;
  location: string;
  languagePreference: string;
  bodyShape: string;
  stylePreferences: string[];
  budgetMin: string;
  budgetMax: string;
}

interface FormErrors {
  [key: string]: string;
}

// Options
const genderOptions = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const locationOptions = [
  { value: 'MG_ROAD', label: 'MG Road' },
  { value: 'COMMERCIAL_STREET', label: 'Commercial Street' },
];

const languageOptions = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'HINDI', label: 'Hindi' },
  { value: 'KANNADA', label: 'Kannada' },
  { value: 'TAMIL', label: 'Tamil' },
  { value: 'TELUGU', label: 'Telugu' },
];

const bodyShapeOptions = [
  { value: 'RECTANGLE', label: 'Rectangle' },
  { value: 'PEAR', label: 'Pear' },
  { value: 'HOURGLASS', label: 'Hourglass' },
  { value: 'APPLE', label: 'Apple' },
  { value: 'INVERTED_TRIANGLE', label: 'Inverted Triangle' },
];

const styleOptions = [
  'Casual',
  'Formal',
  'Ethnic',
  'Western',
  'Fusion',
  'Bohemian',
  'Minimalist',
  'Vintage',
  'Streetwear',
  'Avant-garde',
];

export default function CustomerSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { csrfToken, refreshCsrfToken, isFetchingCsrfToken } = useCsrfToken();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    email: '',
    gender: '',
    password: '',
    confirmPassword: '',
    location: '',
    languagePreference: 'ENGLISH',
    bodyShape: '',
    stylePreferences: [],
    budgetMin: '',
    budgetMax: '',
  });

  // Validation functions
  const validateEmail = (email: string): boolean => validator.isEmail(email);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (!formData.age) {
        newErrors.age = 'Age is required';
      } else if (parseInt(formData.age) < 13) {
        newErrors.age = 'You must be at least 13 years old';
      } else if (parseInt(formData.age) > 120) {
        newErrors.age = 'Please enter a valid age';
      }

      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.gender) {
        newErrors.gender = 'Please select your gender';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordCheck = validatePassword(formData.password);
        if (!passwordCheck.isValid) {
          newErrors.password = passwordCheck.errors[0];
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      if (!formData.location) {
        newErrors.location = 'Please select your preferred location';
      }

      if (!formData.languagePreference) {
        newErrors.languagePreference = 'Please select your language preference';
      }

      if (!formData.bodyShape) {
        newErrors.bodyShape = 'Please select your body shape';
      }
    }

    if (step === 3) {
      if (formData.stylePreferences.length === 0) {
        newErrors.stylePreferences = 'Please select at least one style preference';
      }
    }

    if (step === 4) {
      if (!formData.budgetMin) {
        newErrors.budgetMin = 'Minimum budget is required';
      } else if (parseInt(formData.budgetMin) < 0) {
        newErrors.budgetMin = 'Budget cannot be negative';
      }

      if (!formData.budgetMax) {
        newErrors.budgetMax = 'Maximum budget is required';
      } else if (parseInt(formData.budgetMax) <= parseInt(formData.budgetMin)) {
        newErrors.budgetMax = 'Maximum budget must be greater than minimum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleStylePreference = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(style)
        ? prev.stylePreferences.filter((s) => s !== style)
        : [...prev.stylePreferences, style],
    }));
    // Clear error when user selects a style
    if (errors.stylePreferences) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.stylePreferences;
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);

    try {
      // Ensure we have a CSRF token before making the request
      let token: string | null = csrfToken;
      if (!token) {
        token = await refreshCsrfToken();
      }
      if (!token) {
        const errorMsg = 'Unable to verify the request. Please refresh and try again.';
        toast.error(errorMsg, 'Security Error');
        setErrors({ submit: errorMsg });
        setIsLoading(false);
        return;
      }

      const normalizedEmail =
        validator.normalizeEmail(formData.email) || formData.email.toLowerCase();

      const signupData = {
        email: normalizedEmail,
        password: formData.password,
        name: formData.name.trim(),
        role: 'CUSTOMER' as const,
        age: parseInt(formData.age) || undefined,
        gender: formData.gender || undefined,
        location: formData.location || undefined,
        stylePreferences: formData.stylePreferences || [],
        bodyShape: formData.bodyShape || undefined,
        languagePreference: formData.languagePreference || 'ENGLISH',
        budgetMin: parseInt(formData.budgetMin) || undefined,
        budgetMax: parseInt(formData.budgetMax) || undefined,
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify(signupData),
        credentials: 'include', // Important for CSRF cookie
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text.substring(0, 500),
        });
        throw new Error(`Server returned ${response.status}: ${response.statusText || 'Invalid response format'}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        const text = await response.text();
        console.error('Response body:', text.substring(0, 500));
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok && data.success) {
        toast.success('Account created successfully!', 'Welcome to Neural Threads');
        setShowSuccessModal(true);
      } else {
        const errorMsg = data?.error || data?.message || `Signup failed (${response.status})`;
        toast.error(errorMsg, 'Signup Failed');
        setErrors({ submit: errorMsg });
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error. Please try again.';
      toast.error(errorMsg, 'Signup Failed');
      setErrors({ submit: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Location', icon: MapPin },
    { number: 3, title: 'Style', icon: Heart },
    { number: 4, title: 'Budget', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50 py-8 px-4">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full shadow-2xl animate-scale-in">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-stone-700 to-stone-800 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-2">Account Created Successfully! 🎉</h3>
              <p className="text-stone-700 mb-6">
                Welcome to Neural Threads, <strong>{formData.name}</strong>! Your account has been created and you can start using the platform right away.
              </p>
              <div className="bg-stone-50 rounded-xl p-4 mb-6 border border-stone-200">
                <p className="text-sm text-stone-800 font-medium">
                  ✨ You can now browse designers, find tailors, and explore fashion!
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-800 hover:shadow-lg transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6">
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
          <h1 className="font-serif text-3xl text-stone-900 mb-2">Create Your Account</h1>
          <p className="text-stone-700">Join thousands of fashion enthusiasts</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    currentStep >= step.number
                      ? 'bg-stone-700 text-white shadow-lg shadow-stone-500/30'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    currentStep >= step.number ? 'text-stone-700' : 'text-stone-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step.number ? 'bg-stone-700' : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8">
          {/* Error Banner */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{errors.submit}</p>
              <button
                onClick={() => setErrors((prev) => ({ ...prev, submit: '' }))}
                className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <User className="w-5 h-5 text-stone-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-sm text-gray-500">Tell us about yourself</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Age & Gender */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="13"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Your age"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                      errors.age
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none`}
                  />
                  {errors.age && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.age}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                      errors.gender
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none bg-white`}
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all ${
                      errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
                <PasswordStrengthMeter password={formData.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-sm text-green-500 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Passwords match
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Location & Preferences */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-stone-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Location & Preferences</h2>
                  <p className="text-sm text-gray-500">Help us personalize your experience</p>
                </div>
              </div>

              {/* Preferred Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.location
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none bg-white`}
                >
                  <option value="">Select your preferred location</option>
                  {locationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Preference <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.languagePreference}
                  onChange={(e) => handleInputChange('languagePreference', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.languagePreference
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none bg-white`}
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.languagePreference && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.languagePreference}
                  </p>
                )}
              </div>

              {/* Body Shape */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Shape <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  This helps us recommend outfits that flatter your figure
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bodyShapeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('bodyShape', option.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        formData.bodyShape === option.value
                          ? 'border-stone-600 bg-stone-50 text-stone-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
                {errors.bodyShape && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.bodyShape}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Style Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Heart className="w-5 h-5 text-stone-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Style Preferences</h2>
                  <p className="text-sm text-gray-500">Select all styles that appeal to you</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What styles do you love? <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  Select at least one style preference to help us curate your feed
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {styleOptions.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStylePreference(style)}
                      className={`p-4 rounded-xl border-2 transition-all text-center relative ${
                        formData.stylePreferences.includes(style)
                          ? 'border-stone-600 bg-stone-50 text-stone-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {formData.stylePreferences.includes(style) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-stone-700 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="font-medium">{style}</span>
                    </button>
                  ))}
                </div>
                {errors.stylePreferences && (
                  <p className="mt-4 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.stylePreferences}
                  </p>
                )}
                {formData.stylePreferences.length > 0 && (
                  <p className="mt-4 text-sm text-stone-700 font-medium">
                    {formData.stylePreferences.length} style{formData.stylePreferences.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Budget Range */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-stone-100 rounded-xl">
                  <DollarSign className="w-5 h-5 text-stone-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Budget Range</h2>
                  <p className="text-sm text-gray-500">Set your comfortable price range</p>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 mb-6 border border-stone-200">
                <p className="text-sm text-stone-800 font-medium">
                  💡 Your budget helps us show you designs and services within your range. You can always adjust this later.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Minimum Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Budget (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.budgetMin}
                      onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                      placeholder="1,000"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all ${
                        errors.budgetMin
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                      } focus:ring-4 outline-none`}
                    />
                  </div>
                  {errors.budgetMin && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.budgetMin}
                    </p>
                  )}
                </div>

                {/* Maximum Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Budget (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.budgetMax}
                      onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                      placeholder="50,000"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all ${
                        errors.budgetMax
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                      } focus:ring-4 outline-none`}
                    />
                  </div>
                  {errors.budgetMax && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.budgetMax}
                    </p>
                  )}
                </div>
              </div>

              {formData.budgetMin && formData.budgetMax && parseInt(formData.budgetMax) > parseInt(formData.budgetMin) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-green-700">
                    ✓ Budget range: ₹{formatNumber(parseInt(formData.budgetMin))} - ₹{formatNumber(parseInt(formData.budgetMax))}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Account Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-gray-900 font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900 font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-gray-900 font-medium">
                      {locationOptions.find((l) => l.value === formData.location)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Styles:</span>
                    <span className="text-gray-900 font-medium">{formData.stylePreferences.length} selected</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 transition-all"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isFetchingCsrfToken || !csrfToken}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-stone-700 font-semibold hover:text-stone-900 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
