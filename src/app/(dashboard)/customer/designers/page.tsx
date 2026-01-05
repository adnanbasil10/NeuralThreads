'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  X,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Sparkles,
  MessageCircle,
  Users,
  Menu,
} from 'lucide-react';
import { formatNumber, debounce } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

// Types
interface Designer {
  id: string;
  userId: string;
  location: string | null;
  yearsExperience: number | null;
  designNiches: string[];
  bio: string | null;
  languages: string[];
  profilePhoto: string | null;
  rating: number;
  reviewCount: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  portfolioItems: {
    id: string;
    imageUrl: string;
    budgetMin: number | null;
    budgetMax: number | null;
  }[];
}

interface Filters {
  search: string;
  niches: string[];
  location: string;
  minExperience: number;
  maxExperience: number;
  minBudget: number;
  maxBudget: number;
  languages: string[];
}

// Options
const nicheOptions = [
  { value: 'BRIDAL', label: 'Bridal', emoji: '👰' },
  { value: 'CASUAL', label: 'Casual', emoji: '👕' },
  { value: 'FORMAL', label: 'Formal', emoji: '👔' },
  { value: 'ETHNIC', label: 'Ethnic', emoji: '🪷' },
  { value: 'WESTERN', label: 'Western', emoji: '👗' },
  { value: 'FUSION', label: 'Fusion', emoji: '✨' },
  { value: 'SPORTSWEAR', label: 'Sportswear', emoji: '🏃' },
];

const locationOptions = [
  { value: '', label: 'All Locations' },
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

// Placeholder data for demo
const placeholderDesigners: Designer[] = [
  {
    id: '1',
    userId: 'u1',
    location: 'MG_ROAD',
    yearsExperience: 12,
    designNiches: ['BRIDAL', 'ETHNIC'],
    bio: 'Specializing in bridal couture with a modern twist.',
    languages: ['ENGLISH', 'HINDI', 'KANNADA'],
    profilePhoto: null,
    rating: 4.9,
    reviewCount: 128,
    user: { id: 'u1', name: 'Priya Mehta', email: 'priya@example.com' },
    portfolioItems: [],
  },
  {
    id: '2',
    userId: 'u2',
    location: 'COMMERCIAL_STREET',
    yearsExperience: 8,
    designNiches: ['CASUAL', 'WESTERN'],
    bio: 'Contemporary casual wear for the modern individual.',
    languages: ['ENGLISH', 'TELUGU'],
    profilePhoto: null,
    rating: 4.8,
    reviewCount: 94,
    user: { id: 'u2', name: 'Arjun Reddy', email: 'arjun@example.com' },
    portfolioItems: [],
  },
  {
    id: '3',
    userId: 'u3',
    location: 'MG_ROAD',
    yearsExperience: 10,
    designNiches: ['FUSION', 'ETHNIC'],
    bio: 'Blending traditional and modern aesthetics.',
    languages: ['ENGLISH', 'HINDI'],
    profilePhoto: null,
    rating: 4.9,
    reviewCount: 156,
    user: { id: 'u3', name: 'Ananya Singh', email: 'ananya@example.com' },
    portfolioItems: [],
  },
  {
    id: '4',
    userId: 'u4',
    location: 'COMMERCIAL_STREET',
    yearsExperience: 15,
    designNiches: ['BRIDAL', 'FORMAL'],
    bio: 'Luxury bridal and formal wear specialist.',
    languages: ['ENGLISH', 'KANNADA', 'TAMIL'],
    profilePhoto: null,
    rating: 4.7,
    reviewCount: 87,
    user: { id: 'u4', name: 'Vikram Patel', email: 'vikram@example.com' },
    portfolioItems: [],
  },
  {
    id: '5',
    userId: 'u5',
    location: 'MG_ROAD',
    yearsExperience: 6,
    designNiches: ['WESTERN', 'CASUAL'],
    bio: 'Modern western fashion with Indian influences.',
    languages: ['ENGLISH', 'HINDI'],
    profilePhoto: null,
    rating: 4.8,
    reviewCount: 112,
    user: { id: 'u5', name: 'Meera Krishnan', email: 'meera@example.com' },
    portfolioItems: [],
  },
  {
    id: '6',
    userId: 'u6',
    location: 'COMMERCIAL_STREET',
    yearsExperience: 20,
    designNiches: ['ETHNIC', 'BRIDAL'],
    bio: 'Master craftsman of traditional Indian wear.',
    languages: ['ENGLISH', 'HINDI', 'KANNADA', 'TAMIL'],
    profilePhoto: null,
    rating: 4.95,
    reviewCount: 245,
    user: { id: 'u6', name: 'Rajesh Kumar', email: 'rajesh@example.com' },
    portfolioItems: [],
  },
];

export default function BrowseDesignersPage() {
  const { toggleSidebar, sidebarOpen } = useSidebar();
  const [designers, setDesigners] = useState<Designer[]>(placeholderDesigners);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    niches: [],
    location: '',
    minExperience: 0,
    maxExperience: 20,
    minBudget: 0,
    maxBudget: 100000,
    languages: [],
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  // Debounced search function
  const debouncedApplyFilters = useMemo(
    () => debounce<(filters: Filters) => void>((filters: Filters) => {
      setAppliedFilters(filters);
      setCurrentPage(1); // Reset to first page on filter change        
    }, 500),
    []
  );

  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    debouncedApplyFilters(newFilters);
  }, [filters, debouncedApplyFilters]);

  // Fetch designers from API
  useEffect(() => {
    const fetchDesigners = async () => {
      setIsLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (appliedFilters.search) params.append('search', appliedFilters.search);
        appliedFilters.niches.forEach(niche => params.append('niche', niche));
        if (appliedFilters.location) params.append('location', appliedFilters.location);
        if (appliedFilters.minExperience > 0) params.append('minExperience', appliedFilters.minExperience.toString());
        if (appliedFilters.maxExperience < 20) params.append('maxExperience', appliedFilters.maxExperience.toString());
        if (appliedFilters.minBudget > 0) params.append('minBudget', appliedFilters.minBudget.toString());
        if (appliedFilters.maxBudget < 100000) params.append('maxBudget', appliedFilters.maxBudget.toString());
        appliedFilters.languages.forEach(lang => params.append('language', lang));
        params.append('page', currentPage.toString());
        params.append('limit', '12');
        params.append('sortBy', 'rating');
        params.append('sortOrder', 'desc');
        // Add timestamp to ensure fresh data (cache invalidation happens on server, but this helps)
        params.append('_t', Date.now().toString());
        
        const response = await fetch(`/api/designers?${params.toString()}`);
        const data = await response.json();

        // Transform API data to match our Designer interface
        const transformedDesigners = data.success && data.data 
          ? data.data.map((designer: any) => ({
              id: designer.id,
              userId: designer.userId,
              location: designer.location,
              yearsExperience: designer.yearsExperience,
              designNiches: designer.designNiches || [],
              bio: designer.bio,
              languages: designer.languages || [],
              profilePhoto: designer.profilePhoto,
              rating: designer.rating || 0,
              reviewCount: designer.reviewCount || 0,
              user: {
                id: designer.user.id,
                name: designer.user.name,
                email: designer.user.email,
              },
              portfolioItems: (designer.portfolioItems || []).map((item: any) => ({
                id: item.id,
                imageUrl: item.imageUrl,
                budgetMin: item.budgetMin,
                budgetMax: item.budgetMax,
              })),
            }))
          : [];

        // Combine real designers with placeholder designers
        const allDesigners = [...transformedDesigners, ...placeholderDesigners];
        
        // Apply filters to combined list
        let filtered = allDesigners;
        if (appliedFilters.search) {
          filtered = filtered.filter((d) =>
            d.user.name.toLowerCase().includes(appliedFilters.search.toLowerCase())
          );
        }

        if (appliedFilters.niches.length > 0) {
          filtered = filtered.filter((d) =>
            d.designNiches.some((n: string) => appliedFilters.niches.includes(n))
          );
        }

        if (appliedFilters.location) {
          filtered = filtered.filter((d) => d.location === appliedFilters.location);
        }

        if (appliedFilters.minExperience > 0) {
          filtered = filtered.filter(
            (d) => (d.yearsExperience || 0) >= appliedFilters.minExperience
          );
        }

        if (appliedFilters.maxExperience < 20) {
          filtered = filtered.filter(
            (d) => (d.yearsExperience || 0) <= appliedFilters.maxExperience
          );
        }

        if (appliedFilters.languages.length > 0) {
          filtered = filtered.filter((d) =>
            d.languages.some((l: string) => appliedFilters.languages.includes(l))
          );
        }

        // Apply budget filter
        if (appliedFilters.minBudget > 0 || appliedFilters.maxBudget < 100000) {
          filtered = filtered.filter((d) => {
            const hasItemInBudget = d.portfolioItems.some(
              (item: { budgetMin: number | null; budgetMax: number | null }) =>
                (item.budgetMin === null || item.budgetMin >= appliedFilters.minBudget) &&
                (item.budgetMax === null || item.budgetMax <= appliedFilters.maxBudget)
            );
            return hasItemInBudget || d.portfolioItems.length === 0;
          });
        }

        setDesigners(filtered);
        // Calculate total pages based on filtered results
        const itemsPerPage = 12;
        setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
      } catch (error) {
        console.error('Error fetching designers:', error);
        // Fallback to placeholder data on error
        setDesigners(placeholderDesigners);
        setTotalPages(3);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesigners();
    
    // Refresh designers every 30 seconds to show portfolio updates
    const refreshInterval = setInterval(() => {
      fetchDesigners();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [appliedFilters, currentPage]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    const cleared: Filters = {
      search: '',
      niches: [],
      location: '',
      minExperience: 0,
      maxExperience: 20,
      minBudget: 0,
      maxBudget: 100000,
      languages: [],
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const toggleNiche = (niche: string) => {
    setFilters((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
  };

  const toggleLanguage = (language: string) => {
    setFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatLocation = (location: string | null) => {
    if (!location) return 'Unknown';
    return location.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const activeFilterCount =
    (appliedFilters.niches.length > 0 ? 1 : 0) +
    (appliedFilters.location ? 1 : 0) +
    (appliedFilters.minExperience > 0 || appliedFilters.maxExperience < 20 ? 1 : 0) +
    (appliedFilters.languages.length > 0 ? 1 : 0);

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
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              
              <div>
                <h1 className="font-serif text-3xl font-semibold text-stone-900">Browse Designers</h1>
                <p className="text-sm text-stone-600">
                  {designers.length} designer{designers.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="Search designers, styles..."
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-full focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all"
                />
              </div>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-warm-light text-warm-taupe rounded-full font-medium border border-warm-apricot hover:bg-warm-apricot transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-warm-coral text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0 max-w-full">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-300/20 border border-stone-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-semibold text-stone-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-warm-coral" />
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-warm-rose hover:text-warm-taupe font-medium transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Design Niches */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">Design Niche</h3>
                <div className="space-y-2">
                  {nicheOptions.map((niche) => (
                    <label
                      key={niche.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                          filters.niches.includes(niche.value)
                            ? 'bg-warm-coral border-warm-coral shadow-md'
                            : 'border-stone-300 group-hover:border-warm-apricot bg-stone-50'
                        }`}
                        onClick={() => toggleNiche(niche.value)}
                      >
                        {filters.niches.includes(niche.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                        {niche.emoji} {niche.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">Location</h3>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-warm-coral transition-all text-stone-900"
                >
                  {locationOptions.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">
                  Experience: {filters.minExperience}-{filters.maxExperience}+ years
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-600 font-medium">Minimum</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.minExperience}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minExperience: parseInt(e.target.value) }))
                      }
                      className="w-full accent-warm-coral"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 font-medium">Maximum</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.maxExperience}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, maxExperience: parseInt(e.target.value) }))
                      }
                      className="w-full accent-warm-coral"
                    />
                  </div>
                </div>
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">
                  Budget: ₹{formatNumber(filters.minBudget)} - ₹{formatNumber(filters.maxBudget)}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-600 font-medium">Minimum</label>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="5000"
                      value={filters.minBudget}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minBudget: parseInt(e.target.value) }))
                      }
                      className="w-full accent-warm-coral"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 font-medium">Maximum</label>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="5000"
                      value={filters.maxBudget}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, maxBudget: parseInt(e.target.value) }))
                      }
                      className="w-full accent-warm-coral"
                    />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <h3 className="font-semibold text-stone-900 mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => toggleLanguage(lang.value)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all font-medium ${
                        filters.languages.includes(lang.value)
                          ? 'bg-rose-400 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyFilters}
                className="w-full py-3.5 bg-gradient-to-r from-warm-coral to-warm-rose text-white font-semibold rounded-full hover:shadow-lg hover:shadow-warm-rose/30 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Main Content - Designer Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 animate-pulse border border-stone-200 shadow-xl shadow-stone-300/20">
                    <div className="w-20 h-20 bg-stone-200 rounded-2xl mx-auto mb-4" />
                    <div className="h-5 bg-stone-200 rounded w-3/4 mx-auto mb-2" />
                    <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto mb-4" />
                    <div className="h-10 bg-stone-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : designers.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-stone-200 shadow-xl shadow-stone-300/20">
                <div className="w-16 h-16 bg-gradient-to-br from-stone-200 to-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-stone-600" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-stone-900 mb-2">No designers found</h3>
                <p className="text-stone-600 mb-6">Try adjusting your filters to see more results</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-gradient-to-r from-warm-coral to-warm-rose text-white font-medium rounded-full hover:shadow-lg hover:shadow-warm-rose/30 transition-all"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {designers.map((designer) => (
                    <div
                      key={designer.id}
                      className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-300/20 hover:shadow-2xl hover:shadow-stone-400/30 transition-all overflow-hidden group border border-stone-200"
                    >
                      {/* Header Gradient */}
                      <div className="h-28 bg-gradient-to-br from-warm-coral via-warm-rose to-warm-taupe relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-warm-light/30 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-warm-apricot/30 rounded-full blur-2xl"></div>
                      </div>

                      {/* Profile Photo */}
                      <div className="relative -mt-14 px-6">
                        <div className="w-28 h-28 bg-gradient-to-br from-warm-rose to-warm-taupe rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-xl">
                          {designer.profilePhoto ? (
                            <img
                              src={designer.profilePhoto}
                              alt={designer.user.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            getInitials(designer.user.name)
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 pt-4">
                        <h3 className="font-serif text-xl font-semibold text-stone-900 mb-1">
                          {designer.user.name}
                        </h3>

                        {/* Niches */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {designer.designNiches.slice(0, 3).map((niche) => (
                            <span
                              key={niche}
                              className="px-3 py-1 bg-warm-light text-warm-taupe text-xs font-medium rounded-full border border-warm-apricot"
                            >
                              {niche.charAt(0) + niche.slice(1).toLowerCase()}
                            </span>
                          ))}
                        </div>

                        {/* Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-stone-600">
                            <Clock className="w-4 h-4 text-stone-400" />
                            {designer.yearsExperience || 0} years experience
                          </div>
                          <div className="flex items-center gap-2 text-sm text-stone-600">
                            <MapPin className="w-4 h-4 text-stone-400" />
                            {formatLocation(designer.location)}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-warm-coral fill-warm-coral" />
                            <span className="font-semibold text-stone-900">{designer.rating}</span>
                            <span className="text-stone-500">({designer.reviewCount} reviews)</span>
                          </div>
                        </div>

                        {/* Languages */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {designer.languages.slice(0, 3).map((lang) => (
                            <span
                              key={lang}
                              className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-lg border border-stone-200"
                            >
                              {lang.charAt(0) + lang.slice(1).toLowerCase()}
                            </span>
                          ))}
                          {designer.languages.length > 3 && (
                            <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-lg border border-stone-200">
                              +{designer.languages.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            href={`/customer/designers/${designer.id}`}
                            className="flex-1 py-2.5 text-center text-sm font-medium text-warm-taupe bg-warm-light hover:bg-warm-apricot rounded-xl transition-all border border-warm-apricot"
                          >
                            View Portfolio
                          </Link>
                          <Link
                            href={`/customer/chats/new?designer=${designer.id}`}
                            className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-gradient-to-r from-warm-coral to-warm-rose hover:shadow-lg hover:shadow-warm-rose/30 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-stone-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === i + 1
                          ? 'bg-gradient-to-r from-warm-coral to-warm-rose text-white shadow-md'
                          : 'hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-stone-700"
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl shadow-stone-900/20 overflow-y-auto animate-slide-in-right border-l border-stone-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-stone-200 p-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-stone-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Same filter content as desktop */}
              {/* Design Niches */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">Design Niche</h3>
                <div className="space-y-2">
                  {nicheOptions.map((niche) => (
                    <label
                      key={niche.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                          filters.niches.includes(niche.value)
                            ? 'bg-warm-coral border-warm-coral shadow-md'
                            : 'border-stone-300 group-hover:border-warm-apricot bg-stone-50'
                        }`}
                        onClick={() => toggleNiche(niche.value)}
                      >
                        {filters.niches.includes(niche.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                        {niche.emoji} {niche.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">Location</h3>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-warm-coral transition-all text-stone-900"
                >
                  {locationOptions.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">
                  Experience: {filters.minExperience}-{filters.maxExperience}+ years
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-600 font-medium">Minimum</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.minExperience}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minExperience: parseInt(e.target.value) }))
                      }
                      className="w-full accent-warm-coral"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 font-medium">Maximum</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.maxExperience}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, maxExperience: parseInt(e.target.value) }))
                      }
                      className="w-full accent-warm-coral"
                    />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => toggleLanguage(lang.value)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all font-medium ${
                        filters.languages.includes(lang.value)
                          ? 'bg-warm-coral text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Filter Actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 p-4 flex gap-3">
              <button
                onClick={handleClearFilters}
                className="flex-1 py-3 text-stone-700 font-medium border border-stone-300 rounded-full hover:bg-stone-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-3 bg-gradient-to-r from-warm-coral to-warm-rose text-white font-semibold rounded-full hover:shadow-lg hover:shadow-warm-rose/30 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


