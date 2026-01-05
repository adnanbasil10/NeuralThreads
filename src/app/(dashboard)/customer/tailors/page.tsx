'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import {
  Search,
  Filter,
  X,
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Scissors,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Navigation,
  Image as ImageIcon,
  Upload,
  Send,
  Loader2,
  Award,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Menu,
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { debounce } from '@/lib/utils';
import { useSecureFetch } from '@/hooks/useSecureFetch';

// Types
interface SampleWork {
  id: string;
  imageUrl: string;
  description: string | null;
}

interface Tailor {
  id: string;
  userId: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  skills: string[];
  yearsExperience: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  rating: number;
  reviewCount: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  sampleWorks: SampleWork[];
  distance: number;
}

interface Filters {
  location: string;
  skills: string[];
  minExperience: number;
  maxExperience: number;
  sortBy: string;
}

// Skill options
const skillOptions = [
  { value: 'ALTERATIONS', label: 'Alterations', icon: '✂️' },
  { value: 'STITCHING', label: 'Stitching', icon: '🧵' },
  { value: 'EMBROIDERY', label: 'Embroidery', icon: '🪡' },
  { value: 'BUTTON_WORK', label: 'Button Work', icon: '🔘' },
  { value: 'ZIPPER_REPAIR', label: 'Zipper Repair', icon: '🔧' },
  { value: 'HEMMING', label: 'Hemming', icon: '📏' },
  { value: 'CUSTOM_FITTING', label: 'Custom Fitting', icon: '👔' },
  { value: 'BRIDAL_WORK', label: 'Bridal Work', icon: '👰' },
  { value: 'ETHNIC_WEAR', label: 'Ethnic Wear', icon: '🪷' },
  { value: 'WESTERN_WEAR', label: 'Western Wear', icon: '👗' },
];

const locationOptions = [
  { value: 'MG_ROAD', label: 'MG Road' },
  { value: 'COMMERCIAL_STREET', label: 'Commercial Street' },
];

const sortOptions = [
  { value: 'distance', label: 'Distance (Nearest)' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'experience', label: 'Most Experienced' },
];

// Placeholder data
const placeholderTailors: Tailor[] = [
  {
    id: '1',
    userId: 'u1',
    location: 'MG_ROAD',
    latitude: 12.9720,
    longitude: 77.5950,
    skills: ['ALTERATIONS', 'STITCHING', 'CUSTOM_FITTING', 'ETHNIC_WEAR'],
    yearsExperience: 15,
    contactPhone: '+91 98765 43210',
    contactEmail: 'rajesh.tailor@example.com',
    rating: 4.8,
    reviewCount: 156,
    user: { id: 'u1', name: 'Rajesh Kumar', email: 'rajesh@example.com' },
    sampleWorks: [
      { id: 's1', imageUrl: '', description: 'Custom suit alteration' },
      { id: 's2', imageUrl: '', description: 'Bridal blouse stitching' },
    ],
    distance: 0.8,
  },
  {
    id: '2',
    userId: 'u2',
    location: 'MG_ROAD',
    latitude: 12.9730,
    longitude: 77.5960,
    skills: ['ALTERATIONS', 'HEMMING', 'BUTTON_WORK', 'ZIPPER_REPAIR'],
    yearsExperience: 8,
    contactPhone: '+91 87654 32109',
    contactEmail: null,
    rating: 4.6,
    reviewCount: 89,
    user: { id: 'u2', name: 'Suresh Babu', email: 'suresh@example.com' },
    sampleWorks: [
      { id: 's3', imageUrl: '', description: 'Trouser hemming' },
    ],
    distance: 1.2,
  },
  {
    id: '3',
    userId: 'u3',
    location: 'MG_ROAD',
    latitude: 12.9700,
    longitude: 77.5940,
    skills: ['BRIDAL_WORK', 'EMBROIDERY', 'ETHNIC_WEAR', 'STITCHING'],
    yearsExperience: 20,
    contactPhone: '+91 76543 21098',
    contactEmail: 'lakshmi.tailoring@example.com',
    rating: 4.9,
    reviewCount: 234,
    user: { id: 'u3', name: 'Lakshmi Devi', email: 'lakshmi@example.com' },
    sampleWorks: [
      { id: 's4', imageUrl: '', description: 'Bridal lehenga' },
      { id: 's5', imageUrl: '', description: 'Embroidered saree blouse' },
      { id: 's6', imageUrl: '', description: 'Designer kurti' },
    ],
    distance: 1.5,
  },
  {
    id: '4',
    userId: 'u4',
    location: 'COMMERCIAL_STREET',
    latitude: 12.9840,
    longitude: 77.6100,
    skills: ['WESTERN_WEAR', 'ALTERATIONS', 'CUSTOM_FITTING'],
    yearsExperience: 12,
    contactPhone: '+91 65432 10987',
    contactEmail: 'mohan.fashion@example.com',
    rating: 4.7,
    reviewCount: 112,
    user: { id: 'u4', name: 'Mohan Rao', email: 'mohan@example.com' },
    sampleWorks: [
      { id: 's7', imageUrl: '', description: 'Formal blazer' },
      { id: 's8', imageUrl: '', description: 'Western dress alteration' },
    ],
    distance: 2.3,
  },
  {
    id: '5',
    userId: 'u5',
    location: 'MG_ROAD',
    latitude: 12.9710,
    longitude: 77.5955,
    skills: ['ALTERATIONS', 'STITCHING', 'HEMMING', 'BUTTON_WORK'],
    yearsExperience: 5,
    contactPhone: '+91 54321 09876',
    contactEmail: null,
    rating: 4.5,
    reviewCount: 45,
    user: { id: 'u5', name: 'Venkatesh P', email: 'venkatesh@example.com' },
    sampleWorks: [],
    distance: 0.5,
  },
  {
    id: '6',
    userId: 'u6',
    location: 'COMMERCIAL_STREET',
    latitude: 12.9825,
    longitude: 77.6080,
    skills: ['ETHNIC_WEAR', 'BRIDAL_WORK', 'EMBROIDERY', 'CUSTOM_FITTING'],
    yearsExperience: 18,
    contactPhone: '+91 43210 98765',
    contactEmail: 'sunita.creations@example.com',
    rating: 4.85,
    reviewCount: 198,
    user: { id: 'u6', name: 'Sunita Sharma', email: 'sunita@example.com' },
    sampleWorks: [
      { id: 's9', imageUrl: '', description: 'Designer anarkali' },
      { id: 's10', imageUrl: '', description: 'Wedding saree blouse' },
    ],
    distance: 3.1,
  },
];

export default function BrowseTailorsPage() {
  const { toggleSidebar } = useSidebar();
  const { secureFetch } = useSecureFetch();
  const [tailors, setTailors] = useState<Tailor[]>(placeholderTailors);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);

  // Modal states
  const [selectedTailor, setSelectedTailor] = useState<Tailor | null>(null);
  const [showAlterationForm, setShowAlterationForm] = useState(false);
  const [alterationDescription, setAlterationDescription] = useState('');
  const [alterationImage, setAlterationImage] = useState<File | null>(null);
  const [alterationImagePreview, setAlterationImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Rating states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentUserReview, setCurrentUserReview] = useState<any | null>(null);

  const [filters, setFilters] = useState<Filters>({
    location: 'MG_ROAD',
    skills: [],
    minExperience: 0,
    maxExperience: 20,
    sortBy: 'distance',
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  // Debounced filter application using useCallback
  const applyFilters = useCallback((newFilters: Filters) => {
    setAppliedFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, 500),
    [applyFilters]
  );

  // Handle filter changes with debouncing
  useEffect(() => {
    debouncedApplyFilters(filters);
  }, [filters, debouncedApplyFilters]);

  // Dropzone for alteration image
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image must be less than 5MB');
        return;
      }
      setAlterationImage(file);
      setAlterationImagePreview(URL.createObjectURL(file));
      setSubmitError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  // Fetch tailors from API
  useEffect(() => {
    const fetchTailors = async () => {
      setIsLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (appliedFilters.location) params.append('location', appliedFilters.location);
        appliedFilters.skills.forEach(skill => params.append('skill', skill));
        if (appliedFilters.minExperience > 0) params.append('minExperience', appliedFilters.minExperience.toString());
        if (appliedFilters.maxExperience < 20) params.append('maxExperience', appliedFilters.maxExperience.toString());
        params.append('sortBy', appliedFilters.sortBy);
        params.append('page', currentPage.toString());
        params.append('limit', '12');

        const response = await fetch(`/api/tailors?${params.toString()}`);
        const data = await response.json();

        // Transform API data to match our Tailor interface
        const transformedTailors = data.success && data.data
          ? data.data.map((tailor: any) => ({
              id: tailor.id,
              userId: tailor.userId,
              location: tailor.location,
              latitude: tailor.latitude,
              longitude: tailor.longitude,
              skills: tailor.skills || [],
              yearsExperience: tailor.yearsExperience,
              contactPhone: tailor.contactPhone,
              contactEmail: tailor.contactEmail,
              rating: tailor.rating || 0,
              reviewCount: tailor.reviewCount || 0,
              user: {
                id: tailor.user.id,
                name: tailor.user.name,
                email: tailor.user.email,
              },
              sampleWorks: (tailor.sampleWorks || []).map((work: any) => ({
                id: work.id,
                imageUrl: work.imageUrl,
                description: work.description,
              })),
              distance: tailor.distance || 0,
            }))
          : [];

        // Combine real tailors with placeholder tailors
        const allTailors = [...transformedTailors, ...placeholderTailors];

        // Apply filters to combined list
        let filtered = allTailors;

        // Filter by location
        if (appliedFilters.location) {
          filtered = filtered.filter((t) => t.location === appliedFilters.location);
        }

        // Filter by skills
        if (appliedFilters.skills.length > 0) {
          filtered = filtered.filter((t) =>
            t.skills.some((s: string) => appliedFilters.skills.includes(s))
          );
        }

        // Filter by experience
        filtered = filtered.filter(
          (t) =>
            (t.yearsExperience || 0) >= appliedFilters.minExperience &&
            (t.yearsExperience || 0) <= appliedFilters.maxExperience
        );

        // Sort
        filtered.sort((a, b) => {
          switch (appliedFilters.sortBy) {
            case 'distance':
              return a.distance - b.distance;
            case 'rating':
              return b.rating - a.rating;
            case 'experience':
              return (b.yearsExperience || 0) - (a.yearsExperience || 0);
            default:
              return a.distance - b.distance;
          }
        });

        setTailors(filtered);
        // Calculate total pages based on filtered results
        const itemsPerPage = 12;
        setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
      } catch (error) {
        console.error('Error fetching tailors:', error);
        // Fallback to placeholder data on error
        setTailors(placeholderTailors);
        setTotalPages(2);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTailors();
  }, [appliedFilters, currentPage]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    const cleared: Filters = {
      location: 'MG_ROAD',
      skills: [],
      minExperience: 0,
      maxExperience: 20,
      sortBy: 'distance',
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const toggleSkill = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const openTailorModal = (tailor: Tailor) => {
    setSelectedTailor(tailor);
    setShowAlterationForm(false);
    setShowRatingForm(false);
    setAlterationDescription('');
    setAlterationImage(null);
    setAlterationImagePreview('');
    setSubmitSuccess(false);
    setSubmitError('');
    setSelectedRating(0);
    setRatingComment('');
    // Fetch reviews for this tailor
    fetchTailorReviews(tailor.id);
  };

  const fetchTailorReviews = async (tailorId: string) => {
    try {
      const response = await fetch(`/api/reviews?tailorId=${tailorId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setReviews(data.data);
        // Check if current user has reviewed
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          const userReview = data.data.find(
            (r: any) => r.customer.user.id === userData.data.id
          );
          if (userReview) {
            setCurrentUserReview(userReview);
            setSelectedRating(userReview.rating);
            setRatingComment(userReview.comment || '');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0 || !selectedTailor) {
      alert('Please select a rating');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailorId: selectedTailor.id,
          rating: selectedRating,
          comment: ratingComment || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh reviews and tailor data
        await fetchTailorReviews(selectedTailor.id);
        
        // Refresh the tailor list to update ratings
        const params = new URLSearchParams();
        if (appliedFilters.location) params.append('location', appliedFilters.location);
        appliedFilters.skills.forEach(skill => params.append('skill', skill));
        if (appliedFilters.minExperience > 0) params.append('minExperience', appliedFilters.minExperience.toString());
        if (appliedFilters.maxExperience < 20) params.append('maxExperience', appliedFilters.maxExperience.toString());
        params.append('sortBy', appliedFilters.sortBy);
        params.append('page', currentPage.toString());
        params.append('limit', '12');

        const tailorResponse = await fetch(`/api/tailors?${params.toString()}`);
        const tailorData = await tailorResponse.json();

        if (tailorData.success && tailorData.data) {
          const transformedTailors = tailorData.data.map((tailor: any) => ({
            id: tailor.id,
            userId: tailor.userId,
            location: tailor.location,
            latitude: tailor.latitude,
            longitude: tailor.longitude,
            skills: tailor.skills || [],
            yearsExperience: tailor.yearsExperience,
            contactPhone: tailor.contactPhone,
            contactEmail: tailor.contactEmail,
            rating: tailor.rating || 0,
            reviewCount: tailor.reviewCount || 0,
            user: {
              id: tailor.user.id,
              name: tailor.user.name,
              email: tailor.user.email,
            },
            sampleWorks: (tailor.sampleWorks || []).map((work: any) => ({
              id: work.id,
              imageUrl: work.imageUrl,
              description: work.description,
            })),
            distance: tailor.distance || 0,
          }));

          // Combine real tailors with placeholder tailors
          const allTailors = [...transformedTailors, ...placeholderTailors];

          // Apply filters to combined list
          let filtered = allTailors;
          if (appliedFilters.location) {
            filtered = filtered.filter((t) => t.location === appliedFilters.location);
          }
          if (appliedFilters.skills.length > 0) {
            filtered = filtered.filter((t) =>
              t.skills.some((s: string) => appliedFilters.skills.includes(s))
            );
          }
          filtered = filtered.filter(
            (t) =>
              (t.yearsExperience || 0) >= appliedFilters.minExperience &&
              (t.yearsExperience || 0) <= appliedFilters.maxExperience
          );
          filtered.sort((a, b) => {
            switch (appliedFilters.sortBy) {
              case 'distance':
                return a.distance - b.distance;
              case 'rating':
                return b.rating - a.rating;
              case 'experience':
                return (b.yearsExperience || 0) - (a.yearsExperience || 0);
              default:
                return a.distance - b.distance;
            }
          });

          setTailors(filtered);
          
          // Update the selected tailor in the modal with new rating
          const updatedTailor = filtered.find(t => t.id === selectedTailor.id);
          if (updatedTailor) {
            setSelectedTailor(updatedTailor);
          }
        }
        
        setShowRatingForm(false);
        alert(currentUserReview ? 'Review updated successfully!' : 'Thank you for your review!');
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const closeTailorModal = () => {
    setSelectedTailor(null);
    if (alterationImagePreview) {
      URL.revokeObjectURL(alterationImagePreview);
    }
  };

  const handleSubmitAlteration = async () => {
    if (!alterationDescription.trim()) {
      setSubmitError('Please describe the alteration you need');
      return;
    }

    if (!selectedTailor?.id) {
      setSubmitError('Please select a tailor');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Upload image first if provided (using secureFetch for CSRF)
      let imageUrl = null;
      if (alterationImage) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', alterationImage);
          
          const uploadRes = await secureFetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.success && uploadData.data?.url) {
              imageUrl = uploadData.data.url;
            } else {
              console.warn('Image upload succeeded but no URL returned:', uploadData);
              // Continue without image - not critical
            }
          } else {
            const uploadError = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
            console.warn('Image upload failed:', uploadError);
            // Continue without image - not critical for submission
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue without image - not critical
        }
      }

      // Submit alteration request
      const response = await secureFetch('/api/alterations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tailorId: selectedTailor.id,
          description: alterationDescription.trim(),
          imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        setAlterationDescription('');
        setAlterationImage(null);
        if (alterationImagePreview) {
          URL.revokeObjectURL(alterationImagePreview);
          setAlterationImagePreview('');
        }
        setSubmitError('');
      } else {
        // Extract error message with more details
        const errorMessage = data.error || data.message || 'Failed to submit request';
        const details = data.details ? ` (${JSON.stringify(data.details)})` : '';
        setSubmitError(errorMessage + details);
        console.error('Alteration submission error:', {
          status: response.status,
          error: errorMessage,
          details: data.details,
          fullData: data,
        });
      }
    } catch (error: any) {
      console.error('Alteration submission exception:', error);
      const errorMessage = error?.message || 'Network error. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAlterationImage = () => {
    if (alterationImagePreview) {
      URL.revokeObjectURL(alterationImagePreview);
    }
    setAlterationImage(null);
    setAlterationImagePreview('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m away`;
    }
    return `${distance.toFixed(1)} km away`;
  };

  const activeFilterCount =
    (appliedFilters.skills.length > 0 ? 1 : 0) +
    (appliedFilters.minExperience > 0 || appliedFilters.maxExperience < 20 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-stone-50 to-warm-apricot/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-warm-apricot/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-warm-coral/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors flex-shrink-0"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              
              <div>
                <h1 className="font-serif text-3xl font-semibold text-stone-900">Find Tailors</h1>
                <p className="text-sm text-stone-600">
                  {tailors.length} tailor{tailors.length !== 1 ? 's' : ''} near you
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Location Selector */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-warm-light text-warm-taupe rounded-xl border border-warm-apricot shadow-sm">
                <Navigation className="w-4 h-4" />
                <select
                  value={filters.location}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, location: e.target.value }));
                    setAppliedFilters((prev) => ({ ...prev, location: e.target.value }));
                  }}
                  className="bg-transparent border-0 font-medium focus:ring-0 cursor-pointer text-warm-taupe"
                >
                  {locationOptions.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Selector */}
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }));
                  setAppliedFilters((prev) => ({ ...prev, sortBy: e.target.value }));
                }}
                className="hidden sm:block px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-warm-coral focus:border-warm-coral text-stone-900"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-warm-light text-warm-taupe rounded-xl font-medium border border-warm-apricot shadow-sm"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-warm-coral text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-warm-taupe" />
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-warm-coral hover:text-warm-rose font-medium transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">Your Location</h3>
                <div className="space-y-2">
                  {locationOptions.map((loc) => (
                    <label
                      key={loc.value}
                      className="flex items-center gap-3 cursor-pointer hover:bg-stone-50 p-2 rounded-xl transition-colors"
                    >
                      <input
                        type="radio"
                        name="location"
                        value={loc.value}
                        checked={filters.location === loc.value}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, location: e.target.value }))
                        }
                        className="w-4 h-4 text-warm-coral focus:ring-warm-coral"
                      />
                      <span className="text-sm text-stone-700">{loc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">Skills Needed</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {skillOptions.map((skill) => (
                    <label
                      key={skill.value}
                      className="flex items-center gap-3 cursor-pointer group hover:bg-stone-50 p-2 rounded-xl transition-colors"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          filters.skills.includes(skill.value)
                            ? 'bg-warm-coral border-warm-coral shadow-sm'
                            : 'border-stone-300 group-hover:border-warm-coral'
                        }`}
                        onClick={() => toggleSkill(skill.value)}
                      >
                        {filters.skills.includes(skill.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-stone-700">
                        {skill.icon} {skill.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">
                  Experience: {filters.minExperience}-{filters.maxExperience}+ years
                </h3>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.maxExperience}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxExperience: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-warm-coral"
                />
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyFilters}
                className="w-full py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg transition-all shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Main Content - Tailor Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : tailors.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-sm">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">No tailors found</h3>
                <p className="text-stone-600 mb-6">
                  Try adjusting your filters or location to see more results
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white font-medium rounded-xl hover:shadow-lg transition-all shadow-md"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tailors.map((tailor) => (
                    <div
                      key={tailor.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-stone-200"
                    >
                      {/* Header */}
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-16 h-16 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md">
                            {getInitials(tailor.user.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-semibold text-stone-900 mb-1">
                              {tailor.user.name}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-stone-600">
                              <MapPin className="w-3.5 h-3.5" />
                              {tailor.location?.replace('_', ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Rating & Experience */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-200">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-stone-900">{tailor.rating}</span>
                            <span className="text-sm text-stone-500">({tailor.reviewCount})</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-stone-600">
                            <Clock className="w-4 h-4 text-stone-400" />
                            {tailor.yearsExperience} years exp.
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {tailor.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 bg-warm-light text-warm-taupe text-xs font-medium rounded-full border border-warm-apricot"
                            >
                              {skill.replace('_', ' ')}
                            </span>
                          ))}
                          {tailor.skills.length > 3 && (
                            <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs rounded-full border border-stone-200">
                              +{tailor.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-6 pb-6 flex gap-2">
                        <Link
                          href={`/customer/chats/new?tailor=${tailor.id}`}
                          className="flex-1 py-2.5 text-center text-sm font-medium text-warm-taupe bg-warm-light hover:bg-warm-apricot rounded-xl transition-all border border-warm-apricot flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </Link>
                        <button
                          onClick={() => {
                            openTailorModal(tailor);
                            setShowAlterationForm(true);
                          }}
                          className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral hover:shadow-md rounded-xl transition-all shadow-md"
                        >
                          Request Alteration
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-stone-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-medium transition-all shadow-sm ${
                        currentPage === i + 1
                          ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                          : 'hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-stone-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-stone-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Mobile filter content - same as desktop */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">Your Location</h3>
                <div className="space-y-2">
                  {locationOptions.map((loc) => (
                    <label
                      key={loc.value}
                      className="flex items-center gap-3 cursor-pointer hover:bg-stone-50 p-2 rounded-xl transition-colors"
                    >
                      <input
                        type="radio"
                        name="location-mobile"
                        value={loc.value}
                        checked={filters.location === loc.value}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, location: e.target.value }))
                        }
                        className="w-4 h-4 text-warm-coral focus:ring-warm-coral"
                      />
                      <span className="text-sm text-stone-700">{loc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-stone-900 mb-3">Skills Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill.value}
                      onClick={() => toggleSkill(skill.value)}
                      className={`px-3 py-1.5 text-sm rounded-xl transition-all border ${
                        filters.skills.includes(skill.value)
                          ? 'bg-warm-coral text-white border-warm-coral shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-warm-coral'
                      }`}
                    >
                      {skill.icon} {skill.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-stone-900 mb-3">Sort By</h3>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-warm-coral text-stone-900"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex gap-3">
              <button
                onClick={handleClearFilters}
                className="flex-1 py-3 text-stone-700 font-medium border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white font-semibold rounded-xl shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailor Detail Modal */}
      {selectedTailor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeTailorModal}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10 shadow-sm">
              <h2 className="text-xl font-serif font-semibold text-stone-900">{selectedTailor.user.name}</h2>
              <button
                onClick={closeTailorModal}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>

            <div className="p-6">
              {/* Tailor Info */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md">
                  {getInitials(selectedTailor.user.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-stone-900">{selectedTailor.rating}</span>
                    <span className="text-stone-600">({selectedTailor.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-stone-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedTailor.location?.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedTailor.yearsExperience} years
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">Skills & Services</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTailor.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-warm-light text-warm-taupe text-sm font-medium rounded-xl border border-warm-apricot"
                    >
                      {skillOptions.find((s) => s.value === skill)?.icon}{' '}
                      {skill.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Work */}
              {selectedTailor.sampleWorks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-stone-900 mb-3">Sample Work</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedTailor.sampleWorks.map((work) => (
                      <div key={work.id} className="group">
                        <div className="aspect-square bg-gradient-to-br from-warm-light to-warm-apricot rounded-xl overflow-hidden mb-2 flex items-center justify-center border border-warm-apricot shadow-sm">
                          {work.imageUrl ? (
                            <img
                              src={work.imageUrl}
                              alt={work.description || 'Sample work'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Scissors className="w-8 h-8 text-warm-taupe" />
                          )}
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-2">{work.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="mb-6 border-t border-stone-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-900">Reviews ({selectedTailor.reviewCount})</h3>
                  {!showRatingForm && !currentUserReview && (
                    <button
                      onClick={() => setShowRatingForm(true)}
                      className="text-sm text-warm-coral hover:text-warm-rose font-medium transition-colors"
                    >
                      Write Review
                    </button>
                  )}
                </div>

                {showRatingForm && (
                  <div className="mb-6 p-4 bg-warm-light rounded-xl border border-warm-apricot">
                    <h4 className="font-semibold text-stone-900 mb-3">
                      {currentUserReview ? 'Update Your Review' : 'Write a Review'}
                    </h4>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Rating *
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSelectedRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                star <= selectedRating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Comment (optional)
                      </label>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-warm-coral resize-none text-stone-900 placeholder:text-stone-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowRatingForm(false);
                          if (!currentUserReview) {
                            setSelectedRating(0);
                            setRatingComment('');
                          }
                        }}
                        className="flex-1 py-2 text-stone-700 font-medium border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitRating}
                        disabled={isSubmittingRating || selectedRating === 0}
                        className="flex-1 py-2 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        {isSubmittingRating ? 'Submitting...' : currentUserReview ? 'Update' : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-sm text-stone-600 text-center py-4">
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {reviews.map((review) => {
                      const reviewDate = new Date(review.createdAt);
                      const formattedDate = reviewDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <div key={review.id} className="pb-4 border-b border-stone-200 last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white font-medium text-xs shadow-sm">
                              {review.customer.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-semibold text-stone-900 text-sm">
                                  {review.customer.user.name}
                                </h5>
                                <span className="text-xs text-stone-500">{formattedDate}</span>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= review.rating
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-stone-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.comment && (
                                <p className="text-sm text-stone-600">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Toggle between View and Request Form */}
              {!showAlterationForm ? (
                <button
                  onClick={() => setShowAlterationForm(true)}
                  className="w-full py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Scissors className="w-5 h-5" />
                  Request Alteration
                </button>
              ) : (
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-warm-coral" />
                    Request Alteration
                  </h3>

                  {submitSuccess ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-serif font-semibold text-stone-900 mb-2">
                        Request Submitted!
                      </h4>
                      <p className="text-stone-600 mb-4">
                        {selectedTailor.user.name} will contact you soon.
                      </p>
                      <button
                        onClick={() => {
                          setShowAlterationForm(false);
                          setSubmitSuccess(false);
                        }}
                        className="text-warm-coral font-medium hover:text-warm-rose transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      {submitError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">{submitError.split(' (')[0]}</p>
                            {submitError.includes('(') && process.env.NODE_ENV === 'development' && (
                              <p className="text-xs text-red-600 mt-1 opacity-75">
                                {submitError.split('(')[1]?.replace(')', '')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Describe your alteration needs <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={alterationDescription}
                          onChange={(e) => setAlterationDescription(e.target.value)}
                          placeholder="e.g., I need to shorten the sleeves of my kurta by 2 inches..."
                          rows={4}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-warm-coral resize-none text-stone-900 placeholder:text-stone-400"
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Upload garment photo <span className="text-stone-400">(optional)</span>
                        </label>

                        {alterationImagePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={alterationImagePreview}
                              alt="Garment preview"
                              className="w-32 h-32 object-cover rounded-xl border-2 border-warm-apricot shadow-sm"
                            />
                            <button
                              onClick={removeAlterationImage}
                              className="absolute -top-2 -right-2 p-1 bg-warm-coral text-white rounded-full hover:bg-warm-rose shadow-md transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                              isDragActive
                                ? 'border-warm-coral bg-warm-light'
                                : 'border-stone-300 hover:border-warm-coral hover:bg-stone-50'
                            }`}
                          >
                            <input {...getInputProps()} />
                            <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                            <p className="text-sm text-stone-600">
                              {isDragActive
                                ? 'Drop image here...'
                                : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-xs text-stone-500 mt-1">JPG, PNG up to 5MB</p>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowAlterationForm(false)}
                          className="flex-1 py-3 text-stone-700 font-medium border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitAlteration}
                          disabled={isSubmitting || !alterationDescription.trim()}
                          className="flex-1 py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Submit Request
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


