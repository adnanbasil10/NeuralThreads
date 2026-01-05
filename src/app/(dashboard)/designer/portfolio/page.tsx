'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  DollarSign,
  Tag,
  FileText,
  Eye,
  MoreVertical,
  Search,
  Filter,
  Grid3X3,
  List,
  Menu,
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useCsrfToken } from '@/hooks/useCsrfToken'; // Import CSRF token hook
import { useSidebar } from '@/contexts/SidebarContext';

interface PortfolioItem {
  id: string;
  imageUrl: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'BRIDAL', label: 'Bridal' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'ETHNIC', label: 'Ethnic' },
  { value: 'WESTERN', label: 'Western' },
  { value: 'FUSION', label: 'Fusion' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'CUSTOM', label: 'Custom' },
];

// Placeholder data
const MOCK_PORTFOLIO: PortfolioItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    description: 'Elegant Bridal Lehenga with intricate embroidery and gold accents. Perfect for the modern bride.',
    budgetMin: 50000,
    budgetMax: 100000,
    category: 'BRIDAL',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400',
    description: 'Traditional Silk Saree with contemporary draping style.',
    budgetMin: 15000,
    budgetMax: 25000,
    category: 'ETHNIC',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    description: 'Summer Casual Dress in breathable cotton fabric.',
    budgetMin: 3000,
    budgetMax: 5000,
    category: 'CASUAL',
    createdAt: '2024-01-08',
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=400',
    description: 'Formal Evening Gown with sequin details.',
    budgetMin: 20000,
    budgetMax: 35000,
    category: 'FORMAL',
    createdAt: '2024-01-05',
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
    description: 'Indo-Western Fusion Outfit for contemporary occasions.',
    budgetMin: 12000,
    budgetMax: 18000,
    category: 'FUSION',
    createdAt: '2024-01-02',
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    description: 'Designer Kurta Set with modern cuts.',
    budgetMin: 8000,
    budgetMax: 12000,
    category: 'ETHNIC',
    createdAt: '2023-12-28',
  },
];

export default function DesignerPortfolioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action');
  const { toggleSidebar } = useSidebar();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { csrfToken, refreshCsrfToken } = useCsrfToken(); // Get CSRF token
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(actionParam === 'add');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    description: '',
    budgetMin: '',
    budgetMax: '',
    category: 'CASUAL',
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch portfolio items
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/designers/portfolio', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          // Map and validate portfolio items
          const validItems = data.data
            .map((item: any) => ({
              id: item.id,
              imageUrl: item.imageUrl || '',
              description: item.description || '',
              budgetMin: item.budgetMin,
              budgetMax: item.budgetMax,
              category: item.category || 'CUSTOM',
              createdAt: item.createdAt || new Date().toISOString(),
            }))
            .filter((item: PortfolioItem) => item.id); // Keep all items, even without images
          
          console.log('Portfolio items loaded:', validItems.length);
          console.log('Items with images:', validItems.filter((i: PortfolioItem) => i.imageUrl && i.imageUrl.trim() !== '').length);
          console.log('Sample item:', validItems[0]);
          setItems(validItems);
        } else {
          console.log('No portfolio items found or API error');
          setItems([]);
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      
      // Revoke previous preview URL if exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      const previewUrl = URL.createObjectURL(file);
      console.log('Created preview URL:', previewUrl);
      setUploadedImage(file);
      setImagePreview(previewUrl);
    }
  }, [imagePreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      description: '',
      budgetMin: '',
      budgetMax: '',
      category: 'CASUAL',
    });
    setUploadedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
    setSelectedItem(null);
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (item: PortfolioItem) => {
    setSelectedItem(item);
    setFormData({
      description: item.description,
      budgetMin: item.budgetMin?.toString() || '',
      budgetMax: item.budgetMax?.toString() || '',
      category: item.category,
    });
    setImagePreview(item.imageUrl);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (item: PortfolioItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Handle add/edit submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageUrl = selectedItem?.imageUrl || '';

      // Upload image if new one selected
      if (uploadedImage) {
        // Get CSRF token before upload
        const token = csrfToken || (await refreshCsrfToken());
        if (!token) {
          alert('Unable to verify the request. Please refresh the page and try again.');
          setIsSaving(false);
          return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('files', uploadedImage); // Note: 'files' (plural) as expected by API
        formDataUpload.append('folder', 'portfolios'); // Use 'portfolios' folder key
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'x-csrf-token': token, // Add CSRF token to headers
          },
          body: formDataUpload,
        });
        
        // Check if response is ok before parsing JSON
        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          let errorMessage = 'Failed to upload image. Please try again.';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If parsing fails, use the text or default message
            if (uploadRes.status === 401) {
              errorMessage = 'Authentication required. Please log in again.';
            } else if (uploadRes.status === 403) {
              errorMessage = 'Invalid request. Please refresh the page and try again.';
            } else if (uploadRes.status === 400) {
              errorMessage = 'Invalid image file. Please check the file format and size (max 5MB).';
            }
          }
          console.error('Upload error:', uploadRes.status, errorMessage);
          alert(errorMessage);
          setIsSaving(false);
          return;
        }

        const uploadData = await uploadRes.json();
        console.log('Upload response:', uploadData);
        
        // Handle different response structures
        if (uploadData.success && uploadData.data) {
          // API returns array of results
          if (Array.isArray(uploadData.data) && uploadData.data.length > 0) {
            imageUrl = uploadData.data[0].url;
          } else if (uploadData.data.url) {
            imageUrl = uploadData.data.url;
          }
        }
        
        if (!imageUrl) {
          console.error('Failed to get image URL from upload response:', uploadData);
          const errorMsg = uploadData.message || uploadData.error || 'Failed to upload image. Please try again.';
          alert(errorMsg);
          setIsSaving(false);
          return;
        }
        
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Ensure we have a valid image URL
      const finalImageUrl = imageUrl || imagePreview;
      if (!finalImageUrl || finalImageUrl.trim() === '') {
        alert('Please upload an image for your portfolio item.');
        setIsSaving(false);
        return;
      }

      const payload = {
        imageUrl: finalImageUrl,
        description: formData.description,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        category: formData.category,
      };

      console.log('Saving portfolio item:', { ...payload, imageUrl: finalImageUrl.substring(0, 50) + '...' });

      if (selectedItem) {
        // Update existing
        const res = await fetch(`/api/designers/portfolio/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log('Update response:', data);
        if (data.success) {
          setItems(items.map(item => item.id === selectedItem.id ? { ...item, ...payload, imageUrl: finalImageUrl } : item));
        } else {
          alert(data.message || 'Failed to update portfolio item');
        }
      } else {
        // Create new
        const res = await fetch('/api/designers/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log('Create response:', data);
        if (data.success) {
          setItems([{ ...payload, id: data.data.id, createdAt: new Date().toISOString(), imageUrl: finalImageUrl }, ...items]);
        } else {
          alert(data.message || 'Failed to create portfolio item');
        }
      }

      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/designers/portfolio/${selectedItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter(item => item.id !== selectedItem.id));
      }
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter items
  // Memoized filtered items with debounced search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !debouncedSearchQuery || item.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = !filterCategory || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearchQuery, filterCategory]);

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return `₹${formatNumber(amount)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-coral animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-stone-50 to-warm-apricot/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0 lg:hidden"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-stone-700" />
              </button>
              <Link
                href="/designer"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-700" />
              </Link>
              <div>
                <h1 className="font-serif text-xl font-semibold text-stone-900">My Portfolio</h1>
                <p className="text-sm text-stone-600">{items.length} items</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warm-coral to-warm-rose text-white rounded-xl hover:shadow-lg hover:shadow-warm-rose/30 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              Add New Item
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search portfolio items..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-stone-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral transition-all text-stone-900"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-warm-coral' : 'hover:bg-stone-200 text-stone-600'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-warm-coral' : 'hover:bg-stone-200 text-stone-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-stone-900 mb-2">No portfolio items</h3>
            <p className="text-stone-600 mb-6">Start building your portfolio by adding your first design.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-warm-coral to-warm-rose text-white rounded-xl hover:shadow-lg hover:shadow-warm-rose/30 transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Item
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-300/20 border border-stone-200 overflow-hidden group hover:shadow-2xl hover:shadow-stone-400/30 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 flex items-center justify-center">
                  {item.imageUrl && item.imageUrl.trim() !== '' ? (
                    <OptimizedImage
                      src={item.imageUrl}
                      alt={item.description || 'Portfolio item'}
                      fill
                      priority={false}
                      objectFit="contain"
                      className="group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                      <ImageIcon className="w-12 h-12 text-stone-400 mb-2" />
                      <span className="text-xs text-stone-500">No image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Actions Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-medium text-stone-700 hover:bg-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-warm-coral/95 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-warm-rose transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>

                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-stone-700 border border-stone-200">
                    {item.category}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-stone-900 font-medium line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-coral font-semibold">
                      {formatCurrency(item.budgetMin)} - {formatCurrency(item.budgetMax)}
                    </span>
                    <span className="text-stone-500 text-xs">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-300/20 border border-stone-200 overflow-hidden">
            <div className="divide-y divide-stone-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-5 hover:bg-stone-50/50 transition-colors"
                >
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl && item.imageUrl.trim() !== '' ? (
                          <OptimizedImage
                            src={item.imageUrl}
                            alt={item.description || 'Portfolio item'}
                            fill
                            objectFit="contain"
                            className=""
                            sizes="80px"
                          />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                        <ImageIcon className="w-8 h-8 text-stone-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{item.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="px-2.5 py-1 bg-warm-light text-warm-taupe rounded-lg text-xs font-medium border border-warm-apricot">{item.category}</span>
                      <span className="text-warm-coral font-semibold">
                        {formatCurrency(item.budgetMin)} - {formatCurrency(item.budgetMax)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="p-2 hover:bg-warm-light rounded-lg text-warm-coral transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                {showEditModal ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1 text-warm-coral" />
                  Design Image
                </label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center" style={{ minHeight: '256px' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-64 object-contain"
                      onError={(e) => {
                        console.error('Image preview error:', e);
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imagePreview && !selectedItem?.imageUrl?.includes(imagePreview) && imagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(imagePreview);
                        }
                        setImagePreview('');
                        setUploadedImage(null);
                      }}
                      className="absolute top-3 right-3 p-2 bg-warm-coral text-white rounded-full hover:bg-warm-rose transition-colors shadow-lg z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-warm-coral bg-warm-light/50'
                        : 'border-stone-300 hover:border-warm-coral bg-stone-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-warm-coral' : 'text-stone-400'}`} />
                    <p className="text-stone-700 font-medium">
                      {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-sm text-stone-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  <FileText className="w-4 h-4 inline mr-1 text-warm-coral" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your design..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral resize-none text-stone-900 transition-all"
                />
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1 text-warm-coral" />
                    Min Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="5000"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral text-stone-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1 text-warm-coral" />
                    Max Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="15000"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral text-stone-900 transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  <Tag className="w-4 h-4 inline mr-1 text-warm-coral" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:bg-white focus:border-warm-coral text-stone-900 transition-all"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (!imagePreview && !uploadedImage)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-warm-coral to-warm-rose text-white rounded-xl hover:shadow-lg hover:shadow-warm-rose/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {showEditModal ? 'Update Item' : 'Add Item'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-warm-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-warm-coral" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900 mb-2">Delete Portfolio Item?</h3>
              <p className="text-stone-600 mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-warm-coral to-warm-rose text-white rounded-xl hover:shadow-lg hover:shadow-warm-rose/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
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


