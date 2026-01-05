'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  User,
  Lock,
  Shield,
  Globe,
  Camera,
  Mail,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Trash2,
  Bell,
  MessageCircle,
  Send,
  Smartphone,
  Monitor,
  LogOut,
  Save,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '@/lib/utils/translation';
import { useSecureFetch } from '@/hooks';

type UserRole = 'customer' | 'designer' | 'tailor';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  isEmailVerified: boolean;
  role: string;
  customer?: {
    gender?: string;
    location?: string;
    stylePreferences?: string[];
    bodyShape?: string;
    budgetMin?: number;
    budgetMax?: number;
    languagePreference?: string;
  };
  designer?: {
    location?: string;
    yearsExperience?: number;
    designNiches?: string[];
    bio?: string;
    languages?: string[];
    profilePhoto?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  tailor?: {
    location?: string;
    yearsExperience?: number;
    skills?: string[];
    contactPhone?: string;
    contactEmail?: string;
  };
}

interface NotificationPrefs {
  emailNotifications: boolean;
  chatNotifications: boolean;
  marketingEmails: boolean;
}

const TABS = [
  { id: 'profile', label: 'Profile Information', icon: User },
  { id: 'account', label: 'Account Settings', icon: Lock },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'language', label: 'Language & Region', icon: Globe },
];

const LOCATIONS = [
  { value: 'MG_ROAD', label: 'MG Road' },
  { value: 'COMMERCIAL_STREET', label: 'Commercial Street' },
];

const STYLE_OPTIONS = [
  'Casual', 'Formal', 'Ethnic', 'Western', 'Fusion', 
  'Bohemian', 'Minimalist', 'Vintage', 'Streetwear', 'Avant-garde'
];

const BODY_SHAPES = [
  { value: 'RECTANGLE', label: 'Rectangle' },
  { value: 'PEAR', label: 'Pear' },
  { value: 'HOURGLASS', label: 'Hourglass' },
];

const DESIGN_NICHES = [
  'BRIDAL', 'CASUAL', 'FORMAL', 'ETHNIC', 'WESTERN', 
  'FUSION', 'CONTEMPORARY', 'TRADITIONAL'
];

const LANGUAGES_SPOKEN = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'HINDI', label: 'Hindi' },
  { value: 'KANNADA', label: 'Kannada' },
  { value: 'TAMIL', label: 'Tamil' },
  { value: 'TELUGU', label: 'Telugu' },
];

const TAILOR_SKILLS = [
  'Alterations', 'Stitching', 'Embroidery', 'Button Work', 
  'Zipper Repair', 'Hemming', 'Custom Fitting', 'Bridal Work',
  'Ethnic Wear', 'Western Wear'
];

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { secureFetch, isFetchingCsrfToken } = useSecureFetch();
  const role = (params.role as string) as UserRole;

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: '',
    gender: '',
    location: '',
    stylePreferences: [] as string[],
    bodyShape: '',
    budgetMin: '',
    budgetMax: '',
    languagePreference: '',
    yearsExperience: '',
    designNiches: [] as string[],
    bio: '',
    languages: [] as string[],
    profilePhoto: '',
    contactPhone: '',
    contactEmail: '',
    skills: [] as string[],
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    emailNotifications: true,
    chatNotifications: true,
    marketingEmails: false,
  });

  // Photo upload
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          // Initialize form with profile data
          const user = data.data;
          const roleData = user[role] || {};
          
          setProfileForm({
            name: user.name || '',
            age: user.age?.toString() || '',
            gender: roleData.gender || '',
            location: roleData.location || '',
            stylePreferences: roleData.stylePreferences || [],
            bodyShape: roleData.bodyShape || '',
            budgetMin: roleData.budgetMin?.toString() || '',
            budgetMax: roleData.budgetMax?.toString() || '',
            languagePreference: roleData.languagePreference || '',
            yearsExperience: roleData.yearsExperience?.toString() || '',
            designNiches: roleData.designNiches || [],
            bio: roleData.bio || '',
            languages: roleData.languages || [],
            profilePhoto: roleData.profilePhoto || '',
            contactPhone: roleData.contactPhone || '',
            contactEmail: roleData.contactEmail || user.email || '',
            skills: roleData.skills || [],
          });

          if (roleData.profilePhoto) {
            setPhotoPreview(roleData.profilePhoto);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        showToast('error', 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [role]);

  // Show toast notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Handle photo upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image must be less than 5MB');
        return;
      }
      setUploadedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  // Toggle array item
  const toggleArrayItem = (field: keyof typeof profileForm, item: string) => {
    const current = profileForm[field] as string[];
    if (current.includes(item)) {
      setProfileForm({ ...profileForm, [field]: current.filter(i => i !== item) });
    } else {
      setProfileForm({ ...profileForm, [field]: [...current, item] });
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      let photoUrl = profileForm.profilePhoto;

      // Upload photo if new one selected
      if (uploadedPhoto) {
        const formDataUpload = new FormData();
        formDataUpload.append('files', uploadedPhoto); // Use 'files' (plural) as expected by API
        formDataUpload.append('folder', 'profiles'); // Specify folder
        const uploadRes = await secureFetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          showToast('error', errorData.message || 'Failed to upload photo');
          setIsSaving(false);
          return;
        }
        
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data) {
          // Handle different response structures
          if (Array.isArray(uploadData.data) && uploadData.data.length > 0) {
            photoUrl = uploadData.data[0].url;
          } else if (uploadData.data.url) {
            photoUrl = uploadData.data.url;
          }
        }
      }

      const res = await secureFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...profileForm,
          age: profileForm.age ? parseInt(profileForm.age) : undefined,
          yearsExperience: profileForm.yearsExperience ? parseInt(profileForm.yearsExperience) : undefined,
          budgetMin: profileForm.budgetMin ? parseFloat(profileForm.budgetMin) : undefined,
          budgetMax: profileForm.budgetMax ? parseFloat(profileForm.budgetMax) : undefined,
          profilePhoto: photoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', t('settings.changesSaved'));
        setUploadedPhoto(null);
      } else {
        showToast('error', data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', t('common.passwordMismatch'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showToast('error', 'Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await secureFetch('/api/users/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast('error', data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('error', 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Save notification preferences
  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const res = await secureFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ notifications: notificationPrefs }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Notification preferences saved');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      showToast('error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showToast('error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await secureFetch('/api/users/account', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        router.push('/login');
      } else {
        showToast('error', data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save language preference
  const handleSaveLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      await secureFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ languagePreference: lang.toUpperCase() }),
      });
      showToast('success', 'Language preference saved');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  // Get gradient based on role
  const getGradient = () => {
    return 'from-warm-taupe via-warm-rose to-warm-coral';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/${role}`}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-700" />
              </Link>
              <h1 className="text-2xl font-serif font-semibold text-stone-900">{t('settings.title')}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-warm-taupe border-b-2 border-warm-coral bg-warm-light/30'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-serif font-semibold text-stone-900 mb-4">{t('settings.editProfile')}</h2>

              {/* Profile Photo (Designer and Tailor) */}
              {(role === 'designer' || role === 'tailor') && (
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white">
                          {profileForm.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        {...getRootProps()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-stone-50 border-2 border-stone-200"
                      >
                        <input {...getInputProps()} />
                        <Camera className="w-4 h-4 text-stone-700" />
                      </div>
                    </div>
                    <div className="text-sm text-stone-600">
                      <p>Click the camera icon to upload a new photo</p>
                      <p>JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">{t('common.fullName')}</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">{t('common.age')}</label>
                  <input
                    type="number"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Customer-specific fields */}
              {role === 'customer' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.gender')}</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      >
                        <option value="">Select gender</option>
                        {GENDERS.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.location')}</label>
                      <select
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      >
                        <option value="">Select location</option>
                        {LOCATIONS.map(loc => (
                          <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.stylePreferences')}</label>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_OPTIONS.map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleArrayItem('stylePreferences', style)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            profileForm.stylePreferences.includes(style)
                              ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.bodyShape')}</label>
                      <select
                        value={profileForm.bodyShape}
                        onChange={(e) => setProfileForm({ ...profileForm, bodyShape: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      >
                        <option value="">Select body shape</option>
                        {BODY_SHAPES.map(shape => (
                          <option key={shape.value} value={shape.value}>{shape.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.languagePreference')}</label>
                      <select
                        value={profileForm.languagePreference}
                        onChange={(e) => setProfileForm({ ...profileForm, languagePreference: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      >
                        <option value="">Select language</option>
                        {LANGUAGES_SPOKEN.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.minimumBudget')} (₹)</label>
                      <input
                        type="number"
                        value={profileForm.budgetMin}
                        onChange={(e) => setProfileForm({ ...profileForm, budgetMin: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.maximumBudget')} (₹)</label>
                      <input
                        type="number"
                        value={profileForm.budgetMax}
                        onChange={(e) => setProfileForm({ ...profileForm, budgetMax: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Designer-specific fields */}
              {role === 'designer' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.location')}</label>
                      <select
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      >
                        <option value="">Select location</option>
                        {LOCATIONS.map(loc => (
                          <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.yearsOfExperience')}</label>
                      <input
                        type="number"
                        value={profileForm.yearsExperience}
                        onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.designNiches')}</label>
                    <div className="flex flex-wrap gap-2">
                      {DESIGN_NICHES.map(niche => (
                        <button
                          key={niche}
                          type="button"
                          onClick={() => toggleArrayItem('designNiches', niche)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            profileForm.designNiches.includes(niche)
                              ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          {niche.charAt(0) + niche.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.bio')}</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent resize-none text-stone-900 placeholder:text-stone-400"
                    />
                    <p className="text-sm text-stone-500 mt-1">{profileForm.bio.length}/500 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES_SPOKEN.map(lang => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => toggleArrayItem('languages', lang.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            profileForm.languages.includes(lang.value)
                              ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.phoneNumber')}</label>
                      <input
                        type="tel"
                        value={profileForm.contactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={profileForm.contactEmail}
                        onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Tailor-specific fields */}
              {role === 'tailor' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.location')}</label>
                      <select
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select location</option>
                        {LOCATIONS.map(loc => (
                          <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.yearsOfExperience')}</label>
                      <input
                        type="number"
                        value={profileForm.yearsExperience}
                        onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.skills')}</label>
                    <div className="flex flex-wrap gap-2">
                      {TAILOR_SKILLS.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleArrayItem('skills', skill)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            profileForm.skills.includes(skill)
                              ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.phoneNumber')}</label>
                      <input
                        type="tel"
                        value={profileForm.contactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={profileForm.contactEmail}
                        onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {t('settings.saveChanges')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              {/* Email */}
              <div>
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">{t('common.email')}</h3>
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <Mail className="w-5 h-5 text-stone-500" />
                  <span className="text-stone-900">{profile?.email}</span>
                  {profile?.isEmailVerified && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div>
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">{t('settings.changePassword')}</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-stone-900 mb-2">{t('settings.currentPassword')}</label>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all pr-12 text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-10 text-stone-500 hover:text-stone-700"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold text-stone-900 mb-2">{t('settings.newPassword')}</label>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all pr-12 text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-10 text-stone-500 hover:text-stone-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold text-stone-900 mb-2">{t('common.confirmPassword')}</label>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-transparent transition-all pr-12 text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-10 text-stone-500 hover:text-stone-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                    className="w-full py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.notifications')}</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 border border-stone-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="font-medium text-stone-900">Email Notifications</p>
                        <p className="text-sm text-stone-600">Receive updates about your account</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailNotifications}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                      className="w-5 h-5 text-warm-coral rounded focus:ring-warm-coral"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 border border-stone-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="font-medium text-stone-900">Chat Notifications</p>
                        <p className="text-sm text-stone-600">Get notified when you receive new messages</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.chatNotifications}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, chatNotifications: e.target.checked })}
                      className="w-5 h-5 text-warm-coral rounded focus:ring-warm-coral"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 border border-stone-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="font-medium text-stone-900">Marketing Emails</p>
                        <p className="text-sm text-stone-600">Receive tips, promotions, and updates</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.marketingEmails}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, marketingEmails: e.target.checked })}
                      className="w-5 h-5 text-warm-coral rounded focus:ring-warm-coral"
                    />
                  </label>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="w-full py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Security Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-8">
              {/* Two-Factor Authentication */}
              <div>
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Two-Factor Authentication</h3>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="font-medium text-stone-900">Authenticator App</p>
                        <p className="text-sm text-stone-600">Add extra security to your account</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-stone-200 text-stone-700 text-sm rounded-full border border-stone-300">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-stone-900">Current Session</p>
                        <p className="text-sm text-stone-600">Windows • Chrome • Active now</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">Active</span>
                  </div>
                </div>
                <button className="mt-4 flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign out of all other sessions
                </button>
              </div>

              {/* Delete Account */}
              <div className="border-t border-stone-200 pt-8">
                <h3 className="text-lg font-serif font-semibold text-red-600 mb-4">{t('settings.deleteAccount')}</h3>
                <p className="text-stone-600 mb-4">{t('settings.deleteAccountWarning')}</p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('settings.deleteAccount')}
                </button>
              </div>
            </div>
          )}

          {/* Language & Region Tab */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-lg font-serif font-semibold text-stone-900 mb-4">{t('settings.selectLanguage')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSaveLanguage(lang.code)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      language === lang.code
                        ? 'border-warm-coral bg-warm-light'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-stone-900">{lang.nativeName}</p>
                    <p className="text-sm text-stone-600">{lang.name}</p>
                    {language === lang.code && (
                      <Check className="w-5 h-5 text-warm-coral mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Your Account?</h3>
              <p className="text-gray-500 mb-4">
                This action is permanent and cannot be undone. All your data, including chats, wardrobe items, and profile information will be permanently deleted.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


