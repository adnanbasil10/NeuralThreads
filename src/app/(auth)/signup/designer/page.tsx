'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Sparkles,
  User,
  Briefcase,
  Globe,
  Phone,
  Camera,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Mail,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useCsrfToken } from '@/hooks';

// Types
interface FormData {
  name: string;
  age: string;
  email: string;
  password: string;
  confirmPassword: string;
  yearsExperience: string;
  designNiches: string[];
  bio: string;
  location: string;
  languages: string[];
  contactPhone: string;
  contactEmail: string;
  profilePhoto: File | null;
  profilePhotoPreview: string;
}

interface FormErrors {
  [key: string]: string;
}

// Options
const designNicheOptions = [
  { value: 'BRIDAL', label: 'Bridal', emoji: '👰' },
  { value: 'CASUAL', label: 'Casual', emoji: '👕' },
  { value: 'FORMAL', label: 'Formal', emoji: '👔' },
  { value: 'ETHNIC', label: 'Ethnic', emoji: '🪷' },
  { value: 'WESTERN', label: 'Western', emoji: '👗' },
  { value: 'FUSION', label: 'Fusion', emoji: '✨' },
  { value: 'SPORTSWEAR', label: 'Sportswear', emoji: '🏃' },
];

const locationOptions = [
  { value: 'MG_ROAD', label: 'MG Road' },
  { value: 'COMMERCIAL_STREET', label: 'Commercial Street' },
];

const languageOptions = [
  { value: 'ENGLISH', label: 'English', flag: '🇬🇧' },
  { value: 'HINDI', label: 'Hindi', flag: '🇮🇳' },
  { value: 'KANNADA', label: 'Kannada', flag: '🇮🇳' },
  { value: 'TAMIL', label: 'Tamil', flag: '🇮🇳' },
  { value: 'TELUGU', label: 'Telugu', flag: '🇮🇳' },
];

export default function DesignerSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { csrfToken, refreshCsrfToken } = useCsrfToken();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: '',
    yearsExperience: '',
    designNiches: [],
    bio: '',
    location: '',
    languages: ['ENGLISH'],
    contactPhone: '',
    contactEmail: '',
    profilePhoto: null,
    profilePhotoPreview: '',
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profilePhoto: 'Image must be less than 5MB' }));
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        profilePhoto: file,
        profilePhotoPreview: preview,
      }));

      // Clear any previous errors
      if (errors.profilePhoto) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.profilePhoto;
          return newErrors;
        });
      }
    }
  }, [errors.profilePhoto]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const removePhoto = () => {
    if (formData.profilePhotoPreview) {
      URL.revokeObjectURL(formData.profilePhotoPreview);
    }
    setFormData((prev) => ({
      ...prev,
      profilePhoto: null,
      profilePhotoPreview: '',
    }));
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
  };

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
      } else if (parseInt(formData.age) < 18) {
        newErrors.age = 'You must be at least 18 years old to register as a designer';
      } else if (parseInt(formData.age) > 120) {
        newErrors.age = 'Please enter a valid age';
      }

      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      if (!formData.yearsExperience) {
        newErrors.yearsExperience = 'Years of experience is required';
      } else if (parseInt(formData.yearsExperience) < 0 || parseInt(formData.yearsExperience) > 50) {
        newErrors.yearsExperience = 'Experience must be between 0-50 years';
      }

      if (formData.designNiches.length === 0) {
        newErrors.designNiches = 'Please select at least one design niche';
      }

      if (!formData.bio.trim()) {
        newErrors.bio = 'Bio is required';
      } else if (formData.bio.trim().length < 50) {
        newErrors.bio = 'Bio must be at least 50 characters';
      } else if (formData.bio.trim().length > 500) {
        newErrors.bio = 'Bio must not exceed 500 characters';
      }

      if (!formData.location) {
        newErrors.location = 'Please select your location';
      }
    }

    if (step === 3) {
      if (formData.languages.length === 0) {
        newErrors.languages = 'Please select at least one language';
      }
    }

    if (step === 4) {
      if (formData.contactPhone && !validatePhone(formData.contactPhone)) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }

      if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleDesignNiche = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      designNiches: prev.designNiches.includes(niche)
        ? prev.designNiches.filter((n) => n !== niche)
        : [...prev.designNiches, niche],
    }));
    if (errors.designNiches) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.designNiches;
        return newErrors;
      });
    }
  };

  const toggleLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
    if (errors.languages) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.languages;
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.data?.url || null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsLoading(true);

    try {
      // Upload profile photo if provided
      let profilePhotoUrl = null;
      if (formData.profilePhoto) {
        profilePhotoUrl = await uploadToCloudinary(formData.profilePhoto);
      }

      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        setErrors({ submit: 'Unable to verify the request. Please refresh and try again.' });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          name: formData.name,
          role: 'DESIGNER',
          age: parseInt(formData.age),
          yearsExperience: parseInt(formData.yearsExperience),
          designNiches: formData.designNiches,
          bio: formData.bio,
          designerLocation: formData.location,
          languages: formData.languages,
          contactPhone: formData.contactPhone || undefined,
          contactEmail: formData.contactEmail || formData.email.toLowerCase(),
          profilePhoto: profilePhotoUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Account created successfully!', 'Welcome to Neural Threads');
        setShowSuccessModal(true);
      } else {
        const errorMsg = data.error || 'An error occurred during signup';
        toast.error(errorMsg, 'Signup Failed');
        setErrors({ submit: errorMsg });
      }
    } catch {
      const errorMsg = 'Network error. Please try again.';
      toast.error(errorMsg, 'Signup Failed');
      setErrors({ submit: errorMsg });
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal', icon: User },
    { number: 2, title: 'Professional', icon: Briefcase },
    { number: 3, title: 'Languages', icon: Globe },
    { number: 4, title: 'Contact', icon: Phone },
    { number: 5, title: 'Photo', icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50 py-8 px-4">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full shadow-2xl animate-scale-in">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-2">Account Created Successfully! 🎉</h3>
              <p className="text-stone-700 mb-6">
                Welcome to Neural Threads, <strong>{formData.name}</strong>! Your designer account is ready. You can start creating your portfolio and connecting with customers.
              </p>
              <div className="bg-rose-50 rounded-xl p-4 mb-6 border border-rose-200">
                <p className="text-sm text-rose-800 font-medium">
                  ✨ Start showcasing your designs and building your brand!
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
          <h1 className="font-serif text-3xl text-stone-900 mb-2">Join as a Designer</h1>
          <p className="text-stone-700">Showcase your talent to thousands of fashion enthusiasts</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-2 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium hidden sm:block ${
                    currentStep >= step.number ? 'text-rose-600' : 'text-stone-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded-full transition-all ${
                    currentStep > step.number ? 'bg-rose-500' : 'bg-stone-200'
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
                <div className="p-2 bg-rose-100 rounded-xl">
                  <User className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-sm text-gray-500">Let&apos;s start with the basics</p>
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

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Your age (must be 18+)"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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

          {/* Step 2: Professional Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Briefcase className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-stone-900">Professional Details</h2>
                  <p className="text-sm text-stone-600">Tell us about your design expertise</p>
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience}
                  onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                  placeholder="e.g., 5"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.yearsExperience
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none`}
                />
                {errors.yearsExperience && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.yearsExperience}
                  </p>
                )}
              </div>

              {/* Design Niches */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Niches <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Select all that apply to your expertise</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {designNicheOptions.map((niche) => (
                    <button
                      key={niche.value}
                      type="button"
                      onClick={() => toggleDesignNiche(niche.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                        formData.designNiches.includes(niche.value)
                          ? 'border-rose-500 bg-rose-50 text-rose-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {formData.designNiches.includes(niche.value) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-lg mb-1 block">{niche.emoji}</span>
                      <span className="font-medium text-sm">{niche.label}</span>
                    </button>
                  ))}
                </div>
                {errors.designNiches && (
                  <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.designNiches}
                  </p>
                )}
                {formData.designNiches.length > 0 && (
                  <p className="mt-3 text-sm text-rose-700 font-medium">
                    {formData.designNiches.length} niche{formData.designNiches.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Tell customers about your design journey and style</p>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="I'm a passionate designer specializing in..."
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                    errors.bio
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none`}
                />
                <div className="flex justify-between mt-2">
                  {errors.bio ? (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.bio}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`text-xs ${
                      formData.bio.length > 450
                        ? formData.bio.length > 500
                          ? 'text-red-500'
                          : 'text-amber-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {formData.bio.length}/500
                  </span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Location <span className="text-red-500">*</span>
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
                  <option value="">Select your location</option>
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
            </div>
          )}

          {/* Step 3: Languages */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Globe className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Languages Spoken</h2>
                  <p className="text-sm text-gray-500">Help customers communicate with you</p>
                </div>
              </div>

              <div className="bg-rose-50 rounded-xl p-4 mb-6 border border-rose-200">
                <p className="text-sm text-rose-800 font-medium">
                  🌍 Speaking multiple languages helps you connect with more customers in their preferred language.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select all languages you speak <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => toggleLanguage(lang.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        formData.languages.includes(lang.value)
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium text-gray-700 flex-1 text-left">{lang.label}</span>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          formData.languages.includes(lang.value)
                            ? 'bg-rose-500 border-rose-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.languages.includes(lang.value) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.languages && (
                  <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.languages}
                  </p>
                )}
                {formData.languages.length > 0 && (
                  <p className="mt-4 text-sm text-rose-700 font-medium">
                    ✓ {formData.languages.length} language{formData.languages.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Contact Details */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Phone className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-stone-900">Contact Details</h2>
                  <p className="text-sm text-gray-500">How customers can reach you</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-700">
                  📞 Adding your phone number helps customers reach you faster for consultations.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-gray-400">(optional but recommended)</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.contactPhone
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none`}
                />
                {errors.contactPhone && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactPhone}
                  </p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email <span className="text-gray-400">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Leave blank to use your signup email: {formData.email}
                </p>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder={formData.email || 'business@example.com'}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    errors.contactEmail
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                  } focus:ring-4 outline-none`}
                />
                {errors.contactEmail && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Profile Photo */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Camera className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-stone-900">Profile Photo</h2>
                  <p className="text-sm text-gray-500">Add a professional photo</p>
                </div>
              </div>

              <div className="bg-rose-50 rounded-xl p-4 mb-6 border border-rose-200">
                <p className="text-sm text-rose-800 font-medium">
                  📸 Designers with profile photos get 3x more inquiries! A professional headshot works best.
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Photo <span className="text-gray-400">(optional but recommended)</span>
                </label>

                {formData.profilePhotoPreview ? (
                  <div className="relative">
                    <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-4 border-rose-200">
                      <img
                        src={formData.profilePhotoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                      style={{ right: 'calc(50% - 96px - 40px)' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <p className="text-center mt-4 text-sm text-green-600 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Photo uploaded successfully
                    </p>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragActive
                        ? 'border-rose-500 bg-rose-50'
                        : errors.profilePhoto
                        ? 'border-red-300 bg-red-50'
                        : 'border-stone-300 hover:border-rose-400 hover:bg-rose-50/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-2xl flex items-center justify-center">
                      {isDragActive ? (
                        <ImageIcon className="w-8 h-8 text-rose-600" />
                      ) : (
                        <Upload className="w-8 h-8 text-rose-600" />
                      )}
                    </div>
                    {isDragActive ? (
                      <p className="text-rose-600 font-medium">Drop your photo here...</p>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium mb-1">
                          Drag & drop your photo here
                        </p>
                        <p className="text-sm text-gray-500 mb-3">or click to browse</p>
                        <p className="text-xs text-gray-400">
                          JPG or PNG, max 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}

                {errors.profilePhoto && (
                  <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.profilePhoto}
                  </p>
                )}
              </div>

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
                    <span className="text-gray-500">Experience:</span>
                    <span className="text-gray-900 font-medium">{formData.yearsExperience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Niches:</span>
                    <span className="text-gray-900 font-medium">{formData.designNiches.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Languages:</span>
                    <span className="text-gray-900 font-medium">{formData.languages.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-gray-900 font-medium">
                      {locationOptions.find((l) => l.value === formData.location)?.label}
                    </span>
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

            {currentStep < 5 ? (
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
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Designer Account
                    <Sparkles className="w-5 h-5" />
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

        {/* Other Signup Options */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Not a designer?{' '}
            <Link href="/signup/customer" className="text-stone-700 hover:text-stone-900 hover:underline">
              Sign up as Customer
            </Link>
            {' or '}
            <Link href="/signup/tailor" className="text-stone-700 hover:text-stone-900 hover:underline">
              Sign up as Tailor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
