'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSecureFetch } from '@/hooks/useSecureFetch';
import {
  ShoppingBag,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Filter,
  Search,
  Menu,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { NoWardrobeItems } from '@/components/ui/EmptyState';
import { WardrobeGrid } from '@/components/ui/ResponsiveGrid';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useSidebar } from '@/contexts/SidebarContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';

interface WardrobeItem {
  id: string;
  imageUrl: string;
  category: string;
  subcategory?: string | null;
  color?: string | null;
  brand?: string | null;
  name?: string | null;
  createdAt: string;
}

const DRESS_SUBCATEGORIES = [
  { value: '', label: 'All Dress Types' },
  { value: 'BRIDAL', label: 'Bridal' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'ETHNIC', label: 'Ethnic' },
  { value: 'WESTERN', label: 'Western' },
  { value: 'FUSION', label: 'Fusion' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export default function WardrobePage() {
  const { secureFetch } = useSecureFetch();
  const { toggleSidebar } = useSidebar();
  const { user, isLoading: isLoadingUser } = useUser();
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWardrobe = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await secureFetch('/api/chatbot/wardrobe');
      
      if (!res.ok) {
        // Handle HTTP errors
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch wardrobe' }));
        console.error('Wardrobe API error:', res.status, errorData);
        
        // If customer profile not found (404), show empty state
        // This is normal for new users who haven't created their profile yet
        if (res.status === 404) {
          console.log('Customer profile not found - showing empty wardrobe');
          setWardrobeItems([]);
          setIsLoading(false);
          return;
        }
        
        // For authentication errors, redirect to login
        if (res.status === 401) {
          console.error('Authentication required for wardrobe');
          // Redirect to login page
          window.location.href = '/login?redirect=/customer/wardrobe';
          return;
        }
        
        // For other errors, show empty state
        setWardrobeItems([]);
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log('Wardrobe data received:', data);
      
      if (data.success && data.data) {
        // API returns items in data.data.items
        const items = data.data.items || [];
        console.log('Setting wardrobe items:', items.length);
        setWardrobeItems(items);
      } else {
        console.error('Failed to fetch wardrobe:', data.error || 'Unknown error');
        setWardrobeItems([]);
      }
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
      setWardrobeItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [secureFetch]);

  useEffect(() => {
    // Only fetch if user is loaded and authenticated
    if (!isLoadingUser && user) {
      fetchWardrobe();
    } else if (!isLoadingUser && !user) {
      // User not authenticated, redirect to login
      window.location.href = '/login?redirect=/customer/wardrobe';
    }
  }, [fetchWardrobe, isLoadingUser, user]);

  const deleteWardrobeItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from your wardrobe?')) return;

    try {
      const res = await secureFetch(`/api/chatbot/wardrobe?id=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWardrobeItems((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      alert('Failed to delete item');
    }
  };

  // Helper function to infer subcategory from item name/description
  const inferSubcategory = (item: WardrobeItem): string | null => {
    if (item.subcategory) return item.subcategory;
    
    // Only infer for DRESS category items
    if (item.category !== 'DRESS') return null;
    
    const searchText = (item.name || '').toLowerCase();
    
    if (searchText.includes('bridal') || searchText.includes('wedding') || searchText.includes('saree') || searchText.includes('lehenga')) {
      return 'BRIDAL';
    }
    if (searchText.includes('casual') || searchText.includes('everyday') || searchText.includes('t-shirt')) {
      return 'CASUAL';
    }
    if (searchText.includes('formal') || searchText.includes('office') || searchText.includes('business')) {
      return 'FORMAL';
    }
    if (searchText.includes('ethnic') || searchText.includes('traditional') || searchText.includes('kurta') || searchText.includes('salwar')) {
      return 'ETHNIC';
    }
    if (searchText.includes('western') || searchText.includes('gown') || searchText.includes('cocktail')) {
      return 'WESTERN';
    }
    if (searchText.includes('fusion') || searchText.includes('contemporary')) {
      return 'FUSION';
    }
    if (searchText.includes('custom') || searchText.includes('designer')) {
      return 'CUSTOM';
    }
    
    return null;
  };

  // Filter items: only show DRESS category items, and apply filters
  const filteredItems = wardrobeItems
    .filter((item) => item.category === 'DRESS') // Only show dress items
    .filter((item) => {
      // Infer subcategory if missing
      const effectiveSubcategory = item.subcategory || inferSubcategory(item);
      
      // Filter by subcategory (dress type)
      const matchesSubcategory = !selectedSubcategory || effectiveSubcategory === selectedSubcategory;
      
      // Filter by search query
      const matchesSearch =
        !searchQuery ||
        item.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSubcategory && matchesSearch;
    });

  // Group by subcategory with inferred values
  const groupedBySubcategory = filteredItems.reduce((acc, item) => {
    const subcat = item.subcategory || inferSubcategory(item) || 'Uncategorized';
    if (!acc[subcat]) acc[subcat] = [];
    acc[subcat].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  // Sort groups by predefined order
  const sortedGroups = Object.entries(groupedBySubcategory).sort(([a], [b]) => {
    const order = ['BRIDAL', 'FORMAL', 'ETHNIC', 'WESTERN', 'FUSION', 'CASUAL', 'CUSTOM', 'Uncategorized'];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-stone-50 flex items-center justify-center -ml-6 lg:-ml-8 -mr-8">
        <Loader2 className="w-8 h-8 text-warm-coral animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-warm-light via-stone-50 to-warm-apricot/30 -ml-6 lg:-ml-8 -mr-8">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-warm-apricot/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-warm-coral/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors lg:hidden"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              <div>
                <h1 className="font-serif text-3xl font-semibold text-stone-900 flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-warm-taupe" />
                  My Wardrobe
                </h1>
                <p className="text-stone-600 mt-2">
                  {wardrobeItems.length} {wardrobeItems.length === 1 ? 'item' : 'items'} saved from Browse Designs & Designer Portfolio
                </p>
              </div>
            </div>
            <Link
              href="/customer/designs"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg transition-all shadow-md font-medium"
            >
              <Heart className="w-5 h-5" />
              Browse Designs
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search by color, brand, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900 placeholder:text-stone-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-stone-400" />
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-warm-coral transition-all text-stone-900"
              >
                {DRESS_SUBCATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Wardrobe Items */}
        {wardrobeItems.length === 0 ? (
          <div className="text-center py-20 bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-stone-200">
            <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Your Wardrobe is Empty</h3>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">
              Start building your wardrobe by saving designs you like from Browse Designs or Designer Portfolio.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/customer/designs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white rounded-xl hover:shadow-lg transition-all shadow-md font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                Browse Designs
              </Link>
              <Link
                href="/customer/designers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-all font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                Browse Designers
              </Link>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-stone-200">
            <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 font-medium">No items found matching your filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(([subcategory, items]) => {
              const subcatLabel = DRESS_SUBCATEGORIES.find(c => c.value === subcategory)?.label || 
                (subcategory === 'Uncategorized' ? 'Uncategorized' : subcategory);
              return (
                <div key={subcategory}>
                  <h2 className="font-serif text-xl font-semibold text-stone-900 mb-4">
                    {subcatLabel} ({items.length})
                  </h2>
                <WardrobeGrid>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all border border-stone-200"
                    >
                      <div className="aspect-square relative overflow-hidden bg-stone-100">
                        <OptimizedImage
                          src={item.imageUrl}
                          alt={item.name || item.category}
                          fill
                          className="group-hover:scale-105 transition-transform duration-300"
                          objectFit="cover"
                          priority={false}
                        />
                        <button
                          onClick={() => deleteWardrobeItem(item.id)}
                          className="absolute top-3 right-3 p-2 bg-warm-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-warm-rose shadow-md z-10"
                          title="Remove from wardrobe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        {item.name && (
                          <h3 className="font-semibold text-stone-900 mb-2">{item.name}</h3>
                        )}
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          {item.color && (
                            <span className="flex items-center gap-1.5">
                              <div
                                className="w-4 h-4 rounded-full border border-stone-300 shadow-sm"
                                style={{ backgroundColor: item.color.toLowerCase() }}
                              />
                              <span className="font-medium">{item.color}</span>
                            </span>
                          )}
                          {item.brand && (
                            <span className="text-stone-500">• {item.brand}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </WardrobeGrid>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
