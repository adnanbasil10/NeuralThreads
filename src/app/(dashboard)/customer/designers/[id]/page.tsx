'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Heart,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Award,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  Menu,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

// Types
interface PortfolioItem {
  id: string;
  imageUrl: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  category: string | null;
}

interface Designer {
  id: string;
  userId: string;
  location: string | null;
  yearsExperience: number | null;
  designNiches: string[];
  bio: string | null;
  languages: string[];
  profilePhoto: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  rating: number;
  reviewCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  portfolioItems: PortfolioItem[];
  similarDesigners: {
    id: string;
    profilePhoto: string | null;
    rating: number;
    designNiches: string[];
    user: {
      id: string;
      name: string;
    };
  }[];
}

// Placeholder reviews data
const placeholderReviews = [
  {
    id: '1',
    customerName: 'Sneha Rao',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Absolutely stunning work! The attention to detail on my bridal lehenga was incredible. Highly recommend!',
  },
  {
    id: '2',
    customerName: 'Amit Sharma',
    rating: 5,
    date: '1 month ago',
    comment: 'Very professional and creative. Delivered exactly what I envisioned for my wedding outfit.',
  },
  {
    id: '3',
    customerName: 'Priya Nair',
    rating: 4,
    date: '2 months ago',
    comment: 'Great designs and good communication. The final product exceeded my expectations.',
  },
];

// Placeholder portfolio data
const placeholderPortfolio: PortfolioItem[] = [
  {
    id: 'p1',
    imageUrl: '',
    description: 'Elegant bridal lehenga with intricate zardozi work',
    budgetMin: 45000,
    budgetMax: 65000,
    category: 'BRIDAL',
  },
  {
    id: 'p2',
    imageUrl: '',
    description: 'Contemporary fusion saree with modern draping',
    budgetMin: 25000,
    budgetMax: 35000,
    category: 'FUSION',
  },
  {
    id: 'p3',
    imageUrl: '',
    description: 'Traditional silk saree with temple border',
    budgetMin: 15000,
    budgetMax: 25000,
    category: 'ETHNIC',
  },
  {
    id: 'p4',
    imageUrl: '',
    description: 'Designer cocktail dress with sequin details',
    budgetMin: 18000,
    budgetMax: 28000,
    category: 'WESTERN',
  },
  {
    id: 'p5',
    imageUrl: '',
    description: 'Embroidered anarkali suit with dupatta',
    budgetMin: 20000,
    budgetMax: 30000,
    category: 'ETHNIC',
  },
  {
    id: 'p6',
    imageUrl: '',
    description: 'Minimalist formal gown for reception',
    budgetMin: 35000,
    budgetMax: 50000,
    category: 'FORMAL',
  },
];

// Placeholder designer data
const placeholderDesigner: Designer = {
  id: '1',
  userId: 'u1',
  location: 'MG_ROAD',
  yearsExperience: 12,
  designNiches: ['BRIDAL', 'ETHNIC', 'FUSION'],
  bio: 'With over a decade of experience in bridal couture, I specialize in creating stunning, one-of-a-kind pieces that blend traditional craftsmanship with contemporary aesthetics. Every design is a unique story, meticulously crafted to reflect the personality and vision of my clients.\n\nI believe that fashion should empower and inspire. My journey began in a small tailoring shop in Jaipur, where I learned the art of hand embroidery from master craftsmen. Today, I bring that same dedication to detail to every piece I create.\n\nMy work has been featured in Vogue India, Femina, and various bridal exhibitions across the country.',
  languages: ['ENGLISH', 'HINDI', 'KANNADA'],
  profilePhoto: null,
  contactPhone: '+91 98765 43210',
  contactEmail: 'priya.designs@example.com',
  rating: 4.9,
  reviewCount: 128,
  user: {
    id: 'u1',
    name: 'Priya Mehta',
    email: 'priya@example.com',
    createdAt: '2020-01-15T00:00:00.000Z',
  },
  portfolioItems: placeholderPortfolio,
  similarDesigners: [
    {
      id: '2',
      profilePhoto: null,
      rating: 4.8,
      designNiches: ['BRIDAL', 'FORMAL'],
      user: { id: 'u2', name: 'Arjun Reddy' },
    },
    {
      id: '3',
      profilePhoto: null,
      rating: 4.9,
      designNiches: ['FUSION', 'ETHNIC'],
      user: { id: 'u3', name: 'Ananya Singh' },
    },
    {
      id: '4',
      profilePhoto: null,
      rating: 4.7,
      designNiches: ['ETHNIC', 'BRIDAL'],
      user: { id: 'u4', name: 'Vikram Patel' },
    },
  ],
};

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function DesignerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const [designer, setDesigner] = useState<Designer>(placeholderDesigner);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews'>('portfolio');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [currentUserReview, setCurrentUserReview] = useState<Review | null>(null);
  
  // Portfolio filter states
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioCategory, setPortfolioCategory] = useState<string>('');
  const [portfolioMinPrice, setPortfolioMinPrice] = useState<number | ''>('');
  const [portfolioMaxPrice, setPortfolioMaxPrice] = useState<number | ''>('');
  const [showPortfolioFilters, setShowPortfolioFilters] = useState(false);

  // Portfolio categories for filtering
  const portfolioCategories = [
    { value: '', label: 'All Categories' },
    { value: 'BRIDAL', label: 'Bridal' },
    { value: 'CASUAL', label: 'Casual' },
    { value: 'FORMAL', label: 'Formal' },
    { value: 'ETHNIC', label: 'Ethnic' },
    { value: 'WESTERN', label: 'Western' },
    { value: 'FUSION', label: 'Fusion' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  // Filter portfolio items
  const filteredPortfolioItems = useMemo(() => {
    return designer.portfolioItems.filter((item) => {
      // Search filter
      if (portfolioSearch) {
        const searchLower = portfolioSearch.toLowerCase();
        const matchesSearch = 
          item.description?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (portfolioCategory && item.category !== portfolioCategory) {
        return false;
      }

      // Price filters
      if (portfolioMinPrice !== '' && item.budgetMax !== null) {
        if (item.budgetMax < Number(portfolioMinPrice)) return false;
      }
      if (portfolioMaxPrice !== '' && item.budgetMin !== null) {
        if (item.budgetMin > Number(portfolioMaxPrice)) return false;
      }

      return true;
    });
  }, [designer.portfolioItems, portfolioSearch, portfolioCategory, portfolioMinPrice, portfolioMaxPrice]);

  // Fetch designer data from API and track view
  useEffect(() => {
    const fetchDesigner = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      try {
        // Fetch designer data - this will automatically increment profile views
        // Add timestamp to ensure fresh data after profile updates
        const response = await fetch(`/api/designers/${params.id}?_t=${Date.now()}`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success && data.data) {
          const designerData = data.data;
          // Transform API data to match our Designer interface
          setDesigner({
            id: designerData.id,
            userId: designerData.userId,
            location: designerData.location,
            yearsExperience: designerData.yearsExperience,
            designNiches: designerData.designNiches || [],
            bio: designerData.bio,
            languages: designerData.languages || [],
            profilePhoto: designerData.profilePhoto,
            contactPhone: designerData.contactPhone,
            contactEmail: designerData.contactEmail,
            rating: designerData.rating || 0,
            reviewCount: designerData.reviewCount || 0,
            user: {
              id: designerData.user.id,
              name: designerData.user.name,
              email: designerData.user.email,
              createdAt: designerData.user.createdAt,
            },
            portfolioItems: (designerData.portfolioItems || []).map((item: any) => ({
              id: item.id,
              imageUrl: item.imageUrl,
              description: item.description,
              budgetMin: item.budgetMin,
              budgetMax: item.budgetMax,
              category: item.category,
            })),
            similarDesigners: (designerData.similarDesigners || []).map((sim: any) => ({
              id: sim.id,
              profilePhoto: sim.profilePhoto,
              rating: sim.rating || 0,
              designNiches: sim.designNiches || [],
              user: {
                id: sim.user.id,
                name: sim.user.name,
              },
            })),
          });
        } else {
          console.warn('Failed to fetch designer, using placeholder data');
          setDesigner(placeholderDesigner);
        }
      } catch (error) {
        console.error('Error fetching designer:', error);
        // Fallback to placeholder data on error
        setDesigner(placeholderDesigner);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesigner();
    
    // Refresh designer data every 30 seconds to show profile updates
    const refreshInterval = setInterval(() => {
      fetchDesigner();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [params.id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!params.id) return;
      
      setIsLoadingReviews(true);
      try {
        const response = await fetch(`/api/reviews?designerId=${params.id}`);
        const data = await response.json();

        if (data.success && data.data) {
          setReviews(data.data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [params.id, activeTab]);

  // Check if current user has already reviewed
  useEffect(() => {
    const checkUserReview = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          const userReview = reviews.find(
            (r) => r.customer.user.id === userData.data.id
          );
          if (userReview) {
            setCurrentUserReview(userReview);
            setSelectedRating(userReview.rating);
            setRatingComment(userReview.comment || '');
          }
        }
      } catch (error) {
        console.error('Error checking user review:', error);
      }
    };

    if (reviews.length > 0) {
      checkUserReview();
    }
  }, [reviews]);

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designerId: params.id,
          rating: selectedRating,
          comment: ratingComment || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh reviews and designer data
        const reviewsRes = await fetch(`/api/reviews?designerId=${params.id}`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data);
        }

        const designerRes = await fetch(`/api/designers/${params.id}`);
        const designerData = await designerRes.json();
        if (designerData.success) {
          const d = designerData.data;
          setDesigner({
            ...designer,
            rating: d.rating || 0,
            reviewCount: d.reviewCount || 0,
          });
        }

        setShowRatingForm(false);
        setSelectedRating(0);
        setRatingComment('');
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

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Price on request';
    if (min && max) return `₹${formatNumber(min)} - ₹${formatNumber(max)}`;
    if (min) return `From ₹${formatNumber(min)}`;
    return `Up to ₹${formatNumber(max || 0)}`;
  };

  const memberSince = () => {
    const date = new Date(designer.user.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) =>
      prev === designer.portfolioItems.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setLightboxIndex((prev) =>
      prev === 0 ? designer.portfolioItems.length - 1 : prev - 1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-warm-taupe border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0 lg:hidden"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`p-2.5 rounded-xl transition-all ${
                  isSaved
                    ? 'bg-warm-rose/20 text-warm-rose'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-8 border border-stone-200">
          {/* Cover Gradient */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-warm-taupe via-warm-rose to-warm-coral relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -bottom-16 left-6 sm:left-10">
              <div className="w-32 h-32 bg-gradient-to-br from-warm-taupe to-warm-coral rounded-3xl flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
                {designer.profilePhoto ? (
                  <img
                    src={designer.profilePhoto}
                    alt={designer.user.name}
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  getInitials(designer.user.name)
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 sm:pt-20 px-6 sm:px-10 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                    {designer.user.name}
                  </h1>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Verified
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-stone-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-stone-400" />
                    {formatLocation(designer.location)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-stone-400" />
                    {designer.yearsExperience} years experience
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-stone-900">{designer.rating}</span>
                    <span className="text-stone-400">({designer.reviewCount} reviews)</span>
                  </div>
                </div>

                {/* Niches */}
                <div className="flex flex-wrap gap-2">
                  {designer.designNiches.map((niche) => (
                    <span
                      key={niche}
                      className="px-3 py-1.5 bg-warm-light text-warm-taupe text-sm font-medium rounded-full border border-warm-apricot"
                    >
                      {niche.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/customer/chats/new?designer=${designer.id}`}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-warm-taupe to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-warm-rose/30 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Chat
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-stone-200">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">About</h2>
              <div className="prose prose-stone max-w-none">
                {designer.bio ? (
                  designer.bio.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-stone-600 leading-relaxed mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-stone-500 italic">No bio provided yet.</p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-200">
              <div className="flex border-b border-stone-200">
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'portfolio'
                      ? 'text-warm-taupe border-b-2 border-warm-coral'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Portfolio ({designer.portfolioItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-warm-taupe border-b-2 border-warm-coral'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Reviews ({designer.reviewCount})
                </button>
              </div>

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="p-6">
                  {designer.portfolioItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-stone-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-900 mb-2">No Portfolio Items Yet</h3>
                      <p className="text-stone-500">
                        This designer hasn't added any portfolio items yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Search and Filter Bar */}
                      <div className="mb-6 space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                          <input
                            type="text"
                            placeholder="Search designs by description or category..."
                            value={portfolioSearch}
                            onChange={(e) => setPortfolioSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent text-stone-900 placeholder-stone-400"
                          />
                        </div>

                        {/* Filter Toggle and Quick Filters */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => setShowPortfolioFilters(!showPortfolioFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                              showPortfolioFilters
                                ? 'bg-warm-coral text-white border-warm-coral'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="text-sm font-medium">Filters</span>
                          </button>

                          {/* Category Quick Filter */}
                          <select
                            value={portfolioCategory}
                            onChange={(e) => setPortfolioCategory(e.target.value)}
                            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 text-sm font-medium focus:ring-2 focus:ring-warm-coral focus:border-transparent"
                          >
                            {portfolioCategories.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>

                          {/* Clear Filters */}
                          {(portfolioSearch || portfolioCategory || portfolioMinPrice !== '' || portfolioMaxPrice !== '') && (
                            <button
                              onClick={() => {
                                setPortfolioSearch('');
                                setPortfolioCategory('');
                                setPortfolioMinPrice('');
                                setPortfolioMaxPrice('');
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
                            >
                              <X className="w-4 h-4" />
                              Clear
                            </button>
                          )}

                          {/* Results Count */}
                          <div className="ml-auto text-sm text-stone-600">
                            Showing {filteredPortfolioItems.length} of {designer.portfolioItems.length} designs
                          </div>
                        </div>

                        {/* Advanced Filters */}
                        {showPortfolioFilters && (
                          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
                            <h4 className="font-semibold text-stone-900 text-sm">Price Range</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-stone-600 mb-1">Min Price (₹)</label>
                                <input
                                  type="number"
                                  value={portfolioMinPrice}
                                  onChange={(e) => setPortfolioMinPrice(e.target.value ? Number(e.target.value) : '')}
                                  placeholder="0"
                                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-warm-coral focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-stone-600 mb-1">Max Price (₹)</label>
                                <input
                                  type="number"
                                  value={portfolioMaxPrice}
                                  onChange={(e) => setPortfolioMaxPrice(e.target.value ? Number(e.target.value) : '')}
                                  placeholder="100000"
                                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-warm-coral focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Portfolio Grid */}
                      {filteredPortfolioItems.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-stone-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-stone-900 mb-2">No Designs Found</h3>
                          <p className="text-stone-500">
                            Try adjusting your search or filter criteria.
                          </p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredPortfolioItems.map((item, index) => {
                            const originalIndex = designer.portfolioItems.findIndex((i) => i.id === item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => openLightbox(originalIndex >= 0 ? originalIndex : index)}
                                className="group cursor-pointer"
                              >
                                <div className="aspect-square bg-gradient-to-br from-warm-light to-warm-apricot/30 rounded-xl overflow-hidden mb-2 relative border border-stone-200 shadow-sm hover:shadow-md transition-all">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.description || 'Portfolio item'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Sparkles className="w-12 h-12 text-warm-coral/50" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <p className="text-sm text-stone-700 font-medium line-clamp-2">
                                  {item.description || 'Untitled Design'}
                                </p>
                                <p className="text-sm text-warm-taupe mt-1 font-semibold">
                                  {formatPrice(item.budgetMin, item.budgetMax)}
                                </p>
                                {item.category && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="p-6">
                  {/* Rating Form */}
                  {!showRatingForm && !currentUserReview && (
                    <button
                      onClick={() => setShowRatingForm(true)}
                      className="w-full mb-6 py-3 bg-gradient-to-r from-warm-taupe to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      Write a Review
                    </button>
                  )}

                  {showRatingForm && (
                    <div className="mb-6 p-6 bg-stone-50 rounded-xl border border-stone-200">
                      <h3 className="font-semibold text-stone-900 mb-4">
                        {currentUserReview ? 'Update Your Review' : 'Write a Review'}
                      </h3>
                      
                      {/* Star Rating Input */}
                      <div className="mb-4">
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
                                className={`w-8 h-8 transition-colors ${
                                  star <= selectedRating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-stone-300'
                                }`}
                              />
                            </button>
                          ))}
                          {selectedRating > 0 && (
                            <span className="ml-2 text-sm text-stone-600">
                              {selectedRating} {selectedRating === 1 ? 'star' : 'stars'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comment Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Comment (optional)
                        </label>
                        <textarea
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Share your experience..."
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent resize-none text-stone-900"
                        />
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowRatingForm(false);
                            if (!currentUserReview) {
                              setSelectedRating(0);
                              setRatingComment('');
                            }
                          }}
                          className="flex-1 py-2.5 text-stone-700 font-medium border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitRating}
                          disabled={isSubmittingRating || selectedRating === 0}
                          className="flex-1 py-2.5 bg-gradient-to-r from-warm-taupe to-warm-coral text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingRating ? 'Submitting...' : currentUserReview ? 'Update Review' : 'Submit Review'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {isLoadingReviews ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-warm-taupe border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-stone-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-900 mb-2">No Reviews Yet</h3>
                      <p className="text-stone-500">
                        Be the first to review this designer!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => {
                        const reviewDate = new Date(review.createdAt);
                        const formattedDate = reviewDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={review.id}
                            className="pb-6 border-b border-stone-100 last:border-0 last:pb-0"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-warm-light to-warm-apricot rounded-full flex items-center justify-center text-warm-taupe font-medium text-sm">
                                {review.customer.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-stone-900">
                                    {review.customer.user.name}
                                  </h4>
                                  <span className="text-sm text-stone-400">{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-stone-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-stone-600">{review.comment}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">
              <h3 className="font-serif font-bold text-stone-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                {designer.contactPhone && (
                  <a
                    href={`tel:${designer.contactPhone}`}
                    className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-warm-light rounded-xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-warm-taupe" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Phone</p>
                      <p className="font-medium text-stone-900">{designer.contactPhone}</p>
                    </div>
                  </a>
                )}
                {designer.contactEmail && (
                  <a
                    href={`mailto:${designer.contactEmail}`}
                    className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-warm-light rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-warm-taupe" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Email</p>
                      <p className="font-medium text-stone-900 truncate">{designer.contactEmail}</p>
                    </div>
                  </a>
                )}
                {designer.languages.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    <div className="w-10 h-10 bg-warm-light rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-warm-taupe" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Languages</p>
                      <p className="font-medium text-stone-900">
                        {designer.languages
                          .map((l) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">
              <h3 className="font-serif font-bold text-stone-900 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-warm-light rounded-xl">
                  <Clock className="w-6 h-6 text-warm-taupe mx-auto mb-2" />
                  <p className="text-2xl font-bold text-stone-900">{designer.yearsExperience || 0}</p>
                  <p className="text-xs text-stone-500">Years Exp.</p>
                </div>
                <div className="text-center p-4 bg-warm-apricot/20 rounded-xl">
                  <Star className="w-6 h-6 text-amber-500 mx-auto mb-2 fill-amber-500" />
                  <p className="text-2xl font-bold text-stone-900">{designer.rating.toFixed(1)}</p>
                  <p className="text-xs text-stone-500">Rating</p>
                </div>
                <div className="text-center p-4 bg-warm-rose/20 rounded-xl">
                  <Users className="w-6 h-6 text-warm-rose mx-auto mb-2" />
                  <p className="text-2xl font-bold text-stone-900">{designer.reviewCount}</p>
                  <p className="text-xs text-stone-500">Reviews</p>
                </div>
                <div className="text-center p-4 bg-warm-coral/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-warm-coral mx-auto mb-2" />
                  <p className="text-2xl font-bold text-stone-900">
                    {designer.portfolioItems.length}
                  </p>
                  <p className="text-xs text-stone-500">Designs</p>
                </div>
              </div>
              <p className="text-xs text-stone-500 text-center mt-4">
                Member since {memberSince()}
              </p>
            </div>

            {/* Similar Designers */}
            {designer.similarDesigners && designer.similarDesigners.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">
                <h3 className="font-serif font-bold text-stone-900 mb-4">Similar Designers</h3>
                <div className="space-y-4">
                  {designer.similarDesigners.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/customer/designers/${similar.id}`}
                      className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-coral rounded-xl flex items-center justify-center text-white font-bold">
                        {similar.profilePhoto ? (
                          <img
                            src={similar.profilePhoto}
                            alt={similar.user.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          getInitials(similar.user.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900">{similar.user.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-sm text-stone-600">{similar.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-stone-300">•</span>
                          <span className="text-sm text-stone-500 truncate">
                            {similar.designNiches[0]?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Designer'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-stone-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="max-w-7xl max-h-[80vh] px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl aspect-square flex items-center justify-center">
              {designer.portfolioItems[lightboxIndex]?.imageUrl ? (
                <img
                  src={designer.portfolioItems[lightboxIndex].imageUrl}
                  alt={designer.portfolioItems[lightboxIndex].description || 'Portfolio item'}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center p-8">
                  <Sparkles className="w-24 h-24 text-warm-coral/50 mx-auto mb-4" />
                  <p className="text-stone-600">
                    {designer.portfolioItems[lightboxIndex]?.description}
                  </p>
                  <p className="text-warm-taupe mt-2 font-medium">
                    {formatPrice(
                      designer.portfolioItems[lightboxIndex]?.budgetMin,
                      designer.portfolioItems[lightboxIndex]?.budgetMax
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center mt-4 text-white">
              <p className="font-medium">
                {designer.portfolioItems[lightboxIndex]?.description}
              </p>
              <p className="text-white/60 mt-1">
                {lightboxIndex + 1} of {designer.portfolioItems.length}
              </p>
            </div>
          </div>

          <button
            onClick={nextImage}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}


