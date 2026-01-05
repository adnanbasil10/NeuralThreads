'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Sparkles,
  User,
  Scissors,
  MapPin,
  Phone,
  ImageIcon,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Mail,
  X,
  Award,
  Plus,
} from 'lucide-react';
import { useCsrfToken } from '@/hooks';
import { useToast } from '@/components/ui/Toast';

// Types
interface SampleImage {
  file: File;
  preview: string;
  id: string;
}

interface FormData {
  name: string;
  age: string;
  email: string;
  password: string;
  confirmPassword: string;
  yearsExperience: string;
  location: string;
  skills: string[];
  contactPhone: string;
  contactEmail: string;
  sampleWorks: SampleImage[];
  latitude: number | null;
  longitude: number | null;
  profilePhoto: File | null;
  profilePhotoPreview: string;
}

interface FormErrors {
  [key: string]: string;
}

// Location coordinates
const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  MG_ROAD: { lat: 12.9716, lng: 77.5946 },
  COMMERCIAL_STREET: { lat: 12.9833, lng: 77.6089 },
};

// Options
const locationOptions = [
  { value: 'MG_ROAD', label: 'MG Road', address: 'MG Road, Bengaluru' },
  { value: 'COMMERCIAL_STREET', label: 'Commercial Street', address: 'Commercial Street, Bengaluru' },
];

const skillOptions = [
  { value: 'ALTERATIONS', label: 'Alterations', icon: '✂️', desc: 'Resizing & adjustments' },
  { value: 'STITCHING', label: 'Stitching', icon: '🧵', desc: 'Custom garment creation' },
  { value: 'EMBROIDERY', label: 'Embroidery', icon: '🪡', desc: 'Decorative needlework' },
  { value: 'BUTTON_WORK', label: 'Button Work', icon: '🔘', desc: 'Button repairs & replacement' },
  { value: 'ZIPPER_REPAIR', label: 'Zipper Repair', icon: '🔧', desc: 'Zipper fixes & replacement' },
  { value: 'HEMMING', label: 'Hemming', icon: '📏', desc: 'Length adjustments' },
  { value: 'CUSTOM_FITTING', label: 'Custom Fitting', icon: '👔', desc: 'Tailored measurements' },
  { value: 'BRIDAL_WORK', label: 'Bridal Work', icon: '👰', desc: 'Wedding attire' },
  { value: 'ETHNIC_WEAR', label: 'Ethnic Wear', icon: '🪷', desc: 'Traditional clothing' },
  { value: 'WESTERN_WEAR', label: 'Western Wear', icon: '👗', desc: 'Modern western styles' },
];

export default function TailorSignupPage() {
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
    location: '',
    skills: [],
    contactPhone: '',
    contactEmail: '',
    sampleWorks: [],
    latitude: null,
    longitude: null,
    profilePhoto: null,
    profilePhotoPreview: '',
  });

  // Generate unique ID for images
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Profile photo dropzone handler
  const onProfilePhotoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profilePhoto: 'Image must be less than 5MB' }));
        return;
      }
      const preview = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        profilePhoto: file,
        profilePhotoPreview: preview,
      }));
      if (errors.profilePhoto) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.profilePhoto;
          return newErrors;
        });
      }
    }
  }, [errors.profilePhoto]);

  const { getRootProps: getProfilePhotoRootProps, getInputProps: getProfilePhotoInputProps, isDragActive: _isProfilePhotoDragActive } = useDropzone({
    onDrop: onProfilePhotoDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  // Dropzone configuration for sample works
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentCount = formData.sampleWorks.length;
    const remainingSlots = 5 - currentCount;
    
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, sampleWorks: 'Maximum 5 images allowed' }));
      return;
    }

    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    const validFiles: SampleImage[] = [];

    for (const file of filesToAdd) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, sampleWorks: `${file.name} exceeds 5MB limit` }));
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: generateId(),
      });
    }

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        sampleWorks: [...prev.sampleWorks, ...validFiles],
      }));

      if (errors.sampleWorks) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.sampleWorks;
          return newErrors;
        });
      }
    }
  }, [formData.sampleWorks.length, errors.sampleWorks]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 5 * 1024 * 1024,
    disabled: formData.sampleWorks.length >= 5,
  });

  const removeImage = (id: string) => {
    const imageToRemove = formData.sampleWorks.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setFormData((prev) => ({
      ...prev,
      sampleWorks: prev.sampleWorks.filter((img) => img.id !== id),
    }));
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
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
        newErrors.age = 'You must be at least 18 years old to register as a tailor';
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

      if (!formData.location) {
        newErrors.location = 'Please select your shop location';
      }

      if (formData.skills.length === 0) {
        newErrors.skills = 'Please select at least one specialization';
      }
    }

    if (step === 3) {
      if (!formData.contactPhone) {
        newErrors.contactPhone = 'Phone number is required for tailors';
      } else if (!validatePhone(formData.contactPhone)) {
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
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Auto-assign coordinates when location changes
      if (field === 'location' && value in locationCoordinates) {
        newData.latitude = locationCoordinates[value].lat;
        newData.longitude = locationCoordinates[value].lng;
      }
      
      return newData;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    if (errors.skills) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.skills;
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
    if (!validateStep(4)) return;

    setIsLoading(true);

    try {
      // Upload profile photo if provided
      let profilePhotoUrl = null;
      if (formData.profilePhoto) {
        profilePhotoUrl = await uploadToCloudinary(formData.profilePhoto);
      }

      // Upload sample work images
      const uploadedUrls: string[] = [];
      for (const image of formData.sampleWorks) {
        const url = await uploadToCloudinary(image.file);
        if (url) {
          uploadedUrls.push(url);
        }
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
          role: 'TAILOR',
          age: parseInt(formData.age),
          yearsExperience: parseInt(formData.yearsExperience),
          tailorLocation: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          skills: formData.skills,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail || formData.email.toLowerCase(),
          profilePhoto: profilePhotoUrl,
          sampleWorkUrls: uploadedUrls,
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
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal', icon: User },
    { number: 2, title: 'Professional', icon: Scissors },
    { number: 3, title: 'Contact', icon: Phone },
    { number: 4, title: 'Portfolio', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50 py-8 px-4">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full shadow-2xl animate-scale-in">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-2">Account Created Successfully! 🎉</h3>
              <p className="text-stone-700 mb-6">
                Welcome to Neural Threads, <strong>{formData.name}</strong>! Your tailor account is ready. Customers can now discover your services.
              </p>
              <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
                <p className="text-sm text-amber-800 font-medium">
                  🪡 Start receiving alteration requests from customers in your area!
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
          <h1 className="font-serif text-3xl text-stone-900 mb-2">Join as a Tailor</h1>
          <p className="text-stone-700">Connect with customers who need your expert craftsmanship</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/30'
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
                  className={`text-xs mt-2 font-medium hidden sm:block ${
                    currentStep >= step.number ? 'text-amber-700' : 'text-stone-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step.number ? 'bg-amber-600' : 'bg-stone-200'
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
                <div className="p-2 bg-amber-100 rounded-xl">
                  <User className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-stone-900">Personal Information</h2>
                  <p className="text-sm text-stone-600">Let&apos;s start with your basic details</p>
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
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Scissors className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-stone-900">Professional Details</h2>
                  <p className="text-sm text-stone-600">Tell us about your tailoring expertise</p>
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    placeholder="e.g., 10"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all ${
                      errors.yearsExperience
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none`}
                  />
                </div>
                {errors.yearsExperience && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.yearsExperience}
                  </p>
                )}
              </div>

              {/* Shop Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Location <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select where your tailoring shop is located
                </p>
                <div className="space-y-3">
                  {locationOptions.map((loc) => (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => handleInputChange('location', loc.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        formData.location === loc.value
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        formData.location === loc.value ? 'bg-amber-600' : 'bg-stone-100'
                      }`}>
                        <MapPin className={`w-5 h-5 ${
                          formData.location === loc.value ? 'text-white' : 'text-stone-500'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{loc.label}</p>
                        <p className="text-sm text-gray-500">{loc.address}</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.location === loc.value
                            ? 'bg-amber-600 border-amber-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.location === loc.value && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {formData.location && formData.latitude && formData.longitude && (
                  <p className="mt-3 text-xs text-amber-700 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
                {errors.location && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Specializations/Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Select all services you offer</p>
                <div className="grid grid-cols-2 gap-3">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => toggleSkill(skill.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                        formData.skills.includes(skill.value)
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {formData.skills.includes(skill.value) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-lg block mb-1">{skill.icon}</span>
                      <span className="font-medium text-sm text-gray-900 block">{skill.label}</span>
                      <span className="text-xs text-gray-500">{skill.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.skills && (
                  <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.skills}
                  </p>
                )}
                {formData.skills.length > 0 && (
                  <p className="mt-3 text-sm text-amber-700 font-medium">
                    {formData.skills.length} specialization{formData.skills.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Contact Details */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Phone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
                  <p className="text-sm text-gray-500">How customers can reach you</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-700">
                  📞 As a tailor, customers need to reach you quickly for measurements and consultations. A phone number is required.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all ${
                      errors.contactPhone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none`}
                  />
                </div>
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
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder={formData.email || 'shop@example.com'}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all ${
                      errors.contactEmail
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-300 focus:border-stone-600 focus:ring-stone-200'
                    } focus:ring-4 outline-none`}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactEmail}
                  </p>
                )}
              </div>

              {/* Contact Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-3">Contact Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span className="text-gray-700">{formData.contactPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-amber-600" />
                    <span className="text-gray-700">{formData.contactEmail || formData.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="text-gray-700">
                      {locationOptions.find(l => l.value === formData.location)?.label || 'Not selected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Sample Work */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Sample Work</h2>
                  <p className="text-sm text-gray-500">Showcase your craftsmanship</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-700">
                  📸 Tailors with sample work photos get 4x more requests! Show off your best work to attract customers.
                </p>
              </div>

              {/* Image Gallery */}
              {formData.sampleWorks.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Uploaded Images ({formData.sampleWorks.length}/5)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.sampleWorks.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-amber-200">
                          <img
                            src={image.preview}
                            alt={`Sample work ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-lg text-white text-xs">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              {formData.sampleWorks.length < 5 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Upload Sample Work <span className="text-gray-400">(optional but recommended)</span>
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragActive
                        ? 'border-amber-500 bg-amber-50'
                        : errors.sampleWorks
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-2xl flex items-center justify-center">
                      {isDragActive ? (
                        <ImageIcon className="w-8 h-8 text-amber-600" />
                      ) : (
                        <Plus className="w-8 h-8 text-amber-600" />
                      )}
                    </div>
                    {isDragActive ? (
                      <p className="text-amber-600 font-medium">Drop your images here...</p>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium mb-1">
                          {formData.sampleWorks.length === 0
                            ? 'Drag & drop images here'
                            : 'Add more images'}
                        </p>
                        <p className="text-sm text-gray-500 mb-3">or click to browse</p>
                        <p className="text-xs text-gray-400">
                          JPG or PNG, max 5MB per image • {5 - formData.sampleWorks.length} slots remaining
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {errors.sampleWorks && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.sampleWorks}
                </p>
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
                    <span className="text-gray-500">Experience:</span>
                    <span className="text-gray-900 font-medium">{formData.yearsExperience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-gray-900 font-medium">
                      {locationOptions.find((l) => l.value === formData.location)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Skills:</span>
                    <span className="text-gray-900 font-medium">{formData.skills.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sample Works:</span>
                    <span className="text-gray-900 font-medium">{formData.sampleWorks.length} images</span>
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
                    Create Tailor Account
                    <Scissors className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-600 font-semibold hover:text-orange-600 transition-colors">
            Sign In
          </Link>
        </p>

        {/* Other Signup Options */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Not a tailor?{' '}
            <Link href="/signup/customer" className="text-amber-600 hover:underline">
              Sign up as Customer
            </Link>
            {' or '}
            <Link href="/signup/designer" className="text-amber-600 hover:underline">
              Sign up as Designer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
