'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Sparkles,
  User,
  MapPin,
  Star,
  ExternalLink,
  Grid3x3,
  List,
  Heart,
  Loader2,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSecureFetch } from '@/hooks/useSecureFetch';
import { Menu } from 'lucide-react';

interface PortfolioItem {
  id: string;
  imageUrl: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  category: string | null;
  createdAt: string;
  designer: {
    id: string;
    location: string | null;
    rating: number;
    reviewCount: number;
    profilePhoto: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'BRIDAL', label: 'Bridal' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'ETHNIC', label: 'Ethnic' },
  { value: 'WESTERN', label: 'Western' },
  { value: 'FUSION', label: 'Fusion' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function BrowseDesignsPage() {
  const { toggleSidebar } = useSidebar();
  const [designs, setDesigns] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedDesigns, setSavedDesigns] = useState<Set<string>>(new Set());
  const [savingDesignId, setSavingDesignId] = useState<string | null>(null);
  const { secureFetch } = useSecureFetch();
  
  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all designs
  useEffect(() => {
    const fetchDesigns = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (minPrice !== '') params.set('minPrice', String(minPrice));
        if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
        // Note: search is handled client-side for better UX

        const res = await fetch(`/api/designs?${params.toString()}`, {
          credentials: 'include',
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ API Error:', res.status, errorText);
          throw new Error(`API error: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('📦 API Response:', data);

        if (data.success && data.data) {
          console.log('✅ Fetched designs:', data.data.length);
          // Show all portfolio items from all designers
          setDesigns(data.data);
        } else {
          console.warn('⚠️ No designs found or API error:', data);
          setDesigns([]);
        }
      } catch (error) {
        console.error('Error fetching designs:', error);
        setDesigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesigns();
  }, [category, minPrice, maxPrice]); // Removed search from dependencies since it's client-side

  // Load saved designs on mount
  useEffect(() => {
    const loadSavedDesigns = async () => {
      try {
        const res = await fetch('/api/chatbot/wardrobe', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.data?.items) {
          // Create a set of saved image URLs
          const savedUrls = new Set(data.data.items.map((item: any) => item.imageUrl));
          // Find designs that match saved URLs
          const savedIds = new Set(
            designs
              .filter((design) => savedUrls.has(design.imageUrl))
              .map((design) => design.id)
          );
          setSavedDesigns(savedIds);
        }
      } catch (error) {
        console.error('Error loading saved designs:', error);
      }
    };

    if (designs.length > 0) {
      loadSavedDesigns();
    }
  }, [designs]);

  // Filter designs by search (client-side for description)
  const filteredDesigns = useMemo(() => {
    if (!search) return designs;
    const searchLower = search.toLowerCase();
    return designs.filter(
      (item) =>
        item.description?.toLowerCase().includes(searchLower) ||
        item.designer.user.name.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
    );
  }, [designs, search]);

  // Map design category to wardrobe category
  const mapToWardrobeCategory = (designCategory: string | null, description: string | null): string => {
    const desc = (description || '').toLowerCase();
    const cat = (designCategory || '').toLowerCase();
    
    if (cat.includes('bridal') || desc.includes('saree') || desc.includes('lehenga') || desc.includes('gown')) {
      return 'DRESS';
    }
    if (cat.includes('casual') || desc.includes('t-shirt') || desc.includes('top') || desc.includes('shirt')) {
      return 'UPPERWEAR';
    }
    if (desc.includes('pant') || desc.includes('jeans') || desc.includes('trouser')) {
      return 'BOTTOMWEAR';
    }
    if (desc.includes('shoe') || desc.includes('sandal') || desc.includes('heel')) {
      return 'SHOES';
    }
    if (desc.includes('bag') || desc.includes('purse') || desc.includes('clutch')) {
      return 'BAG';
    }
    if (desc.includes('jacket') || desc.includes('blazer') || desc.includes('coat')) {
      return 'JACKET';
    }
    
    return 'DRESS'; // Default to DRESS for most fashion items
  };

  // Save design to wardrobe
  const handleSaveDesign = async (e: React.MouseEvent, design: PortfolioItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (savingDesignId === design.id || savedDesigns.has(design.id)) return;

    try {
      setSavingDesignId(design.id);

      const wardrobeCategory = mapToWardrobeCategory(design.category, design.description);
      const formData = new FormData();
      formData.append('imageUrl', design.imageUrl);
      formData.append('category', wardrobeCategory);
      
      // Use design.category as subcategory (BRIDAL, CASUAL, FORMAL, etc.) only if category is DRESS
      if (wardrobeCategory === 'DRESS' && design.category) {
        // Validate that design.category is a valid PortfolioCategory enum value
        const validSubcategories = ['BRIDAL', 'CASUAL', 'FORMAL', 'ETHNIC', 'WESTERN', 'FUSION', 'CUSTOM'];
        if (validSubcategories.includes(design.category)) {
          formData.append('subcategory', design.category);
        }
      }
      
      formData.append('name', design.description || 'Design from Browse');

      const res = await secureFetch('/api/chatbot/wardrobe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSavedDesigns((prev) => new Set([...prev, design.id]));
        // Show success message (you can replace with a toast notification)
        console.log('✅ Design saved to wardrobe:', data.message);
      } else {
        const errorMessage = data.error || data.message || 'Failed to save design to wardrobe';
        console.error('❌ Save error:', errorMessage);
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Error saving design:', error);
      const errorMessage = error?.message || 'An error occurred. Please try again.';
      alert(errorMessage);
    } finally {
      setSavingDesignId(null);
    }
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Price on request';
    if (min && max) return `₹${formatNumber(min)} - ₹${formatNumber(max)}`;
    if (min) return `From ₹${formatNumber(min)}`;
    return `Up to ₹${formatNumber(max || 0)}`;
  };

  const formatLocation = (location: string | null) => {
    if (!location) return 'Unknown';
    return location.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const hasActiveFilters = category || minPrice !== '' || maxPrice !== '' || search;

  return (
    <div className="w-full max-w-full box-border pb-12 overflow-x-hidden">
      {/* Header Bar - White box like other pages */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-stone-200 sticky top-0 z-20 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-6 mb-6">
          {/* Left: Menu Button + Title and Count */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
              title="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-stone-700" />
            </button>
            
            <div>
              <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-1">Browse Designs</h1>
              <p className="text-sm text-stone-600">
                {isLoading ? 'Loading...' : `${filteredDesigns.length} design${filteredDesigns.length === 1 ? '' : 's'} found`}
              </p>
            </div>
          </div>

          {/* Middle: Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search designs, designers, or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-full focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-warm-taupe text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-warm-taupe text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls - Added spacing */}
        <div className="space-y-4 pt-4">

          {/* Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                showFilters
                  ? 'bg-warm-coral text-white border-warm-coral'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>

            {/* Category Quick Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-700 text-sm font-medium focus:ring-2 focus:ring-warm-coral focus:border-transparent shadow-sm"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}

            {/* Results Count */}
            <div className="ml-auto text-sm text-stone-600 font-medium">
              {isLoading ? 'Loading...' : `Showing ${filteredDesigns.length} design${filteredDesigns.length === 1 ? '' : 's'}`}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
              <h4 className="font-semibold text-stone-900 text-sm mb-4">Price Range</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-warm-coral focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="100000"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-warm-coral focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Designs Grid/List - Added top margin for spacing */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-warm-coral border-t-transparent rounded-full" />
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-20">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">No Designs Found</h3>
          <p className="text-stone-500 mb-4 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search or filter criteria to see more results.'
              : 'No portfolio items have been added by designers yet. Once designers add their portfolio items, they will appear here.'}
          </p>
          {!hasActiveFilters && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Link
                href="/customer/designers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-warm-coral text-white rounded-xl hover:bg-warm-coral/90 transition-colors font-medium"
              >
                <Users className="w-5 h-5" />
                Browse Designers
              </Link>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDesigns.map((item) => (
            <Link
              key={item.id}
              href={`/customer/designers/${item.designer.id}`}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all relative group">
                <div className="aspect-square bg-gradient-to-br from-warm-light to-warm-apricot/30 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.description || 'Design'}
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
                  {/* Save Button - Always visible */}
                  <button
                    onClick={(e) => handleSaveDesign(e, item)}
                    disabled={savingDesignId === item.id}
                    className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-all z-20 hover:scale-110 ${
                      savedDesigns.has(item.id)
                        ? 'bg-warm-rose text-white shadow-warm-rose/50'
                        : 'bg-white/95 text-stone-700 hover:bg-warm-rose hover:text-white'
                    } ${savingDesignId === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={savedDesigns.has(item.id) ? 'Saved to wardrobe' : 'Save to wardrobe'}
                  >
                    {savingDesignId === item.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Heart className={`w-5 h-5 ${savedDesigns.has(item.id) ? 'fill-current' : ''}`} />
                    )}
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-sm text-stone-700 font-medium line-clamp-2 mb-2">
                    {item.description || 'Untitled Design'}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-stone-400" />
                    <span className="text-xs text-stone-600">{item.designer.user.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-warm-taupe font-semibold">
                      {formatPrice(item.budgetMin, item.budgetMax)}
                    </p>
                    {item.category && (
                      <span className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-stone-600">
                      {item.designer.rating.toFixed(1)} ({item.designer.reviewCount})
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDesigns.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all p-4 relative">
              <Link
                href={`/customer/designers/${item.designer.id}`}
                className="block group"
              >
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-warm-light to-warm-apricot/30 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.description || 'Design'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-warm-coral/50" />
                      </div>
                    )}
                    {/* Save Button for List View - Always visible */}
                    <button
                      onClick={(e) => handleSaveDesign(e, item)}
                      disabled={savingDesignId === item.id}
                      className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all z-20 hover:scale-110 ${
                        savedDesigns.has(item.id)
                          ? 'bg-warm-rose text-white shadow-warm-rose/50'
                          : 'bg-white/95 text-stone-700 hover:bg-warm-rose hover:text-white'
                      } ${savingDesignId === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={savedDesigns.has(item.id) ? 'Saved to wardrobe' : 'Save to wardrobe'}
                    >
                      {savingDesignId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className={`w-4 h-4 ${savedDesigns.has(item.id) ? 'fill-current' : ''}`} />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2 line-clamp-1">
                      {item.description || 'Untitled Design'}
                    </h3>
                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-600">{item.designer.user.name}</span>
                      </div>
                      {item.designer.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-stone-400" />
                          <span className="text-sm text-stone-600">
                            {formatLocation(item.designer.location)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-stone-600">
                          {item.designer.rating.toFixed(1)} ({item.designer.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-base text-warm-taupe font-semibold">
                        {formatPrice(item.budgetMin, item.budgetMax)}
                      </p>
                      {item.category && (
                        <span className="px-3 py-1 text-xs bg-stone-100 text-stone-600 rounded-full">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

