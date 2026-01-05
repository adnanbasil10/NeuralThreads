'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  User,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Globe,
  Edit2,
  Save,
  X,
  Camera,
  Award,
  Star,
  Palette,
  Loader2,
  CheckCircle,
  Upload,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useSecureFetch } from '@/hooks/useSecureFetch';
import { useCsrfToken } from '@/hooks/useCsrfToken';

interface DesignerProfile {
  id: string;
  location?: string | null;
  yearsExperience?: number | null;
  designNiches: string[];
  bio?: string | null;
  languages: string[];
  profilePhoto?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  rating: number;
  reviewCount: number;
}

export default function DesignerProfilePage() {
  const { user } = useUser();
  const { secureFetch } = useSecureFetch();
  const { csrfToken, refreshCsrfToken } = useCsrfToken();
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    yearsExperience: '',
    contactPhone: '',
    contactEmail: '',
    designNiches: [] as string[],
    languages: [] as string[],
  });

  const availableNiches = [
    'Bridal Wear',
    'Ethnic Fashion',
    'Fusion Wear',
    'Western',
    'Formal Wear',
    'Casual Wear',
    'Traditional',
    'Contemporary',
  ];

  const availableLanguages = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'];

  // Handle photo upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      
      // Revoke previous preview URL if it was a blob
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, [photoPreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile?.profilePhoto) {
      setPhotoPreview(profile.profilePhoto);
    }
  }, [profile]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await secureFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.designer) {
          const designer = data.data.designer;
          setProfile(designer);
          setFormData({
            bio: designer.bio || '',
            location: designer.location || '',
            yearsExperience: designer.yearsExperience?.toString() || '',
            contactPhone: designer.contactPhone || '',
            contactEmail: designer.contactEmail || '',
            designNiches: designer.designNiches || [],
            languages: designer.languages || [],
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    try {
      setUploadingPhoto(true);

      // Get CSRF token
      const token = csrfToken || (await refreshCsrfToken());
      if (!token) {
        alert('Unable to verify the request. Please refresh the page and try again.');
        return;
      }

      // Upload to Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append('files', selectedPhoto);
      formDataUpload.append('folder', 'profiles');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': token,
        },
        body: formDataUpload,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        alert(errorData.message || 'Failed to upload photo. Please try again.');
        return;
      }

      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.data) {
        let photoUrl = '';
        if (Array.isArray(uploadData.data) && uploadData.data.length > 0) {
          photoUrl = uploadData.data[0].url;
        } else if (uploadData.data.url) {
          photoUrl = uploadData.data.url;
        }

        if (photoUrl) {
          // Update profile with new photo URL
          const res = await secureFetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profilePhoto: photoUrl }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              // Clean up blob URL
              if (photoPreview && photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
              }
              setSelectedPhoto(null);
              await fetchProfile();
              alert('Profile photo updated successfully!');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Upload photo first if a new one was selected
      if (selectedPhoto) {
        await handlePhotoUpload();
      }

      const updateData = {
        bio: formData.bio,
        location: formData.location,
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        designNiches: formData.designNiches,
        languages: formData.languages,
      };

      const res = await secureFetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSaveSuccess(true);
          setIsEditing(false);
          setSelectedPhoto(null);
          await fetchProfile();
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNiche = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      designNiches: prev.designNiches.includes(niche)
        ? prev.designNiches.filter((n) => n !== niche)
        : [...prev.designNiches, niche],
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-stone-900 flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-warm-taupe" />
            Profile
          </h1>
          <p className="text-stone-600">Manage your designer profile information</p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Profile updated successfully!</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-6">
          {/* Profile Header with Photo */}
          <div className="relative bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral p-8">
            <div className="absolute inset-0 bg-black/5" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={user?.name || 'Designer'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-warm-taupe" />
                  )}
                </div>
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <button
                        type="button"
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-stone-50 transition-colors cursor-pointer"
                        title="Upload profile photo"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-5 h-5 text-stone-700 animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-stone-700" />
                        )}
                      </button>
                    </div>
                    {selectedPhoto && (
                      <button
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-warm-coral text-white text-xs rounded-lg hover:bg-warm-rose transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-serif text-3xl text-white mb-2">{user?.name || 'Designer'}</h2>
                <p className="text-white/90 mb-4">{user?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                  {profile.rating > 0 && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span className="text-white font-semibold">{profile.rating.toFixed(1)}</span>
                      <span className="text-white/80 text-sm">
                        ({profile.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                  {profile.yearsExperience && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Award className="w-4 h-4 text-white" />
                      <span className="text-white text-sm">
                        {profile.yearsExperience} years experience
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-white font-medium flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-white hover:bg-stone-50 rounded-lg transition-colors text-stone-900 font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedPhoto(null);
                        setPhotoPreview(profile?.profilePhoto || '');
                        fetchProfile();
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-white font-medium flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself and your design philosophy..."
                  rows={4}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                />
              ) : (
                <p className="text-stone-700 leading-relaxed">
                  {profile.bio || 'No bio added yet. Click Edit Profile to add one.'}
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-500" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                  />
                ) : (
                  <p className="text-stone-700">{profile.location || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-stone-500" />
                  Years of Experience
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                    placeholder="Years"
                    min="0"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                  />
                ) : (
                  <p className="text-stone-700">
                    {profile.yearsExperience ? `${profile.yearsExperience} years` : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-500" />
                  Contact Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 1234567890"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                  />
                ) : (
                  <p className="text-stone-700">{profile.contactPhone || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-500" />
                  Contact Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
                  />
                ) : (
                  <p className="text-stone-700">{profile.contactEmail || user?.email || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Design Niches */}
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-stone-500" />
                Design Niches
              </label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {availableNiches.map((niche) => (
                    <button
                      key={niche}
                      onClick={() => toggleNiche(niche)}
                      className={`px-4 py-2 rounded-xl transition-all font-medium ${
                        formData.designNiches.includes(niche)
                          ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.designNiches.length > 0 ? (
                    profile.designNiches.map((niche) => (
                      <span
                        key={niche}
                        className="px-4 py-2 bg-warm-light text-warm-taupe rounded-xl font-medium border border-warm-apricot"
                      >
                        {niche}
                      </span>
                    ))
                  ) : (
                    <p className="text-stone-500">No niches selected</p>
                  )}
                </div>
              )}
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-500" />
                Languages
              </label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((language) => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`px-4 py-2 rounded-xl transition-all font-medium ${
                        formData.languages.includes(language)
                          ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.languages.length > 0 ? (
                    profile.languages.map((language) => (
                      <span
                        key={language}
                        className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-medium border border-stone-200"
                      >
                        {language}
                      </span>
                    ))
                  ) : (
                    <p className="text-stone-500">No languages selected</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

