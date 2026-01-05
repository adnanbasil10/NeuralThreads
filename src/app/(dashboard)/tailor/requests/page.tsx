'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Phone,
  MessageCircle,
  Loader2,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  User,
  Calendar,
  MapPin,
  Menu,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useSecureFetch } from '@/hooks/useSecureFetch';
import { useSidebar } from '@/contexts/SidebarContext';

interface AlterationRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerLocation?: string;
  description: string;
  imageUrl?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  notes?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
];

// Mock data
const MOCK_REQUESTS: AlterationRequest[] = [
  {
    id: '1',
    customerId: 'c1',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43210',
    customerLocation: 'MG Road',
    description: 'Need to shorten the sleeves on a silk blouse and take in the waist by 2 inches. The blouse is for a wedding next month.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    customerId: 'c2',
    customerName: 'Anjali Patel',
    customerPhone: '+91 87654 32109',
    customerLocation: 'Commercial Street',
    description: 'Hem adjustment for a saree blouse, needs to be taken up by 1 inch.',
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Customer prefers machine stitch. Will be ready by Thursday.',
  },
  {
    id: '3',
    customerId: 'c3',
    customerName: 'Meera Reddy',
    customerPhone: '+91 76543 21098',
    customerLocation: 'MG Road',
    description: 'Zipper replacement on a formal dress. The current zipper is broken.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    customerId: 'c4',
    customerName: 'Kavitha Nair',
    customerPhone: '+91 65432 10987',
    customerLocation: 'Commercial Street',
    description: 'Full alteration of a lehenga - waist adjustment and length modification for wedding ceremony.',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Completed on schedule. Customer very satisfied.',
  },
  {
    id: '5',
    customerId: 'c5',
    customerName: 'Divya Menon',
    customerPhone: '+91 54321 09876',
    customerLocation: 'MG Road',
    description: 'Button work on a kurta - replace all buttons with decorative ones.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function TailorRequestsPage() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const { secureFetch, isReady: isCsrfReady, refreshCsrfToken } = useSecureFetch();
  const { toggleSidebar } = useSidebar();

  const [requests, setRequests] = useState<AlterationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AlterationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch('/api/alterations', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.data && Array.isArray(data.data)) {
          // Transform API response to match expected format
          const transformedRequests: AlterationRequest[] = data.data.map((req: any) => ({
            id: req.id,
            customerId: req.customerId,
            customerName: req.customer?.user?.name || 'Unknown Customer',
            customerPhone: req.customer?.phone || undefined,
            customerLocation: req.customer?.location || undefined,
            description: req.description || '',
            imageUrl: req.imageUrl || undefined,
            status: req.status || 'PENDING',
            createdAt: req.createdAt,
            notes: req.notes || undefined,
          }));
          setRequests(transformedRequests.length > 0 ? transformedRequests : MOCK_REQUESTS);
        } else {
          setRequests(MOCK_REQUESTS);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        setRequests(MOCK_REQUESTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Open detail modal if ID in URL
  useEffect(() => {
    if (selectedId && requests.length > 0) {
      const request = requests.find(r => r.id === selectedId);
      if (request) {
        setSelectedRequest(request);
        setNotes(request.notes || '');
        setShowDetailModal(true);
      }
    }
  }, [selectedId, requests]);

  const openDetailModal = (request: AlterationRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const handleUpdateStatus = async (newStatus: string, request?: AlterationRequest) => {
    const requestToUpdate = request || selectedRequest;
    if (!requestToUpdate || isUpdating) return;

    setIsUpdating(true);
    try {
      // Always refresh CSRF token before making the request to ensure cookie is set
      console.log('🔄 Refreshing CSRF token before request...');
      const freshToken = await refreshCsrfToken();
      if (!freshToken || typeof freshToken !== 'string' || freshToken.length === 0) {
        alert('Unable to get security token. Please refresh the page and try again.');
        setIsUpdating(false);
        return;
      }
      
      console.log('✅ Got fresh CSRF token, length:', freshToken.length);
      
      // Wait a moment for cookie to be set by browser
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('📤 Making request to update status:', newStatus);
      // Pass the token directly to secureFetch to ensure it's used
      const res = await secureFetch(
        `/api/alterations/${requestToUpdate.id}`, 
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Critical: must include cookies
          body: JSON.stringify({ status: newStatus, notes: requestToUpdate.notes || notes }),
        },
        freshToken // Pass the token directly
      );
      
      console.log('Response status:', res.status, res.statusText);
      
      // Check if response is ok before parsing JSON
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error occurred' }));
        console.error('Request failed:', errorData);
        throw new Error(errorData.message || errorData.error || `Request failed with status ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.map(r =>
          r.id === requestToUpdate.id ? { ...r, status: newStatus as any, notes: requestToUpdate.notes || notes } : r
        ));
        // Update selectedRequest if it's the same request
        if (selectedRequest && selectedRequest.id === requestToUpdate.id) {
          setSelectedRequest({ ...selectedRequest, status: newStatus as any, notes: requestToUpdate.notes || notes });
        }
        // Close modal if status changed successfully
        if (newStatus !== 'PENDING') {
          closeDetailModal();
        }
      } else {
        console.error('Failed to update status:', data.message || data.error);
        alert(data.message || data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the status. Please try again.';
      
      // Provide more helpful error messages
      if (errorMessage.includes('CSRF') || errorMessage.includes('csrf')) {
        alert('Security token expired. Please refresh the page and try again.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 lg:hidden"
                title="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <Link
                href="/tailor"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Alteration Requests</h1>
                <p className="text-sm text-gray-500">{filteredRequests.length} requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {STATUS_OPTIONS.map(option => {
              const count = requests.filter(r => option.value === '' || r.status === option.value).length;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === option.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus ? 'Try adjusting your filters' : 'No alteration requests yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Image or Avatar */}
                    <div className="flex-shrink-0">
                      {request.imageUrl ? (
                        <img
                          src={request.imageUrl}
                          alt="Request"
                          className="w-full lg:w-32 h-32 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-full lg:w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <h3 className="font-semibold text-gray-900 text-lg">{request.customerName}</h3>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        {request.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {request.customerPhone}
                          </span>
                        )}
                        {request.customerLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.customerLocation}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus('IN_PROGRESS', request)}
                              disabled={isUpdating || !isCsrfReady}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? 'Updating...' : !isCsrfReady ? 'Loading...' : 'Accept Request'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus('REJECTED', request)}
                              disabled={isUpdating || !isCsrfReady}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? 'Updating...' : !isCsrfReady ? 'Loading...' : 'Reject Request'}
                            </button>
                          </>
                        )}
                        {request.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus('COMPLETED', request)}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? 'Updating...' : 'Mark Complete'}
                          </button>
                        )}
                        <button
                          onClick={() => openDetailModal(request)}
                          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        {request.customerPhone && (
                          <a
                            href={`tel:${request.customerPhone}`}
                            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            Contact
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
              <button
                onClick={closeDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                  {getInitials(selectedRequest.customerName)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedRequest.customerName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    {selectedRequest.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {selectedRequest.customerPhone}
                      </span>
                    )}
                    {selectedRequest.customerLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedRequest.customerLocation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <div className="flex flex-wrap gap-2">
                  {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={isUpdating || !isCsrfReady}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedRequest.status === status
                          ? getStatusColor(status) + ' border'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {isUpdating ? 'Updating...' : !isCsrfReady ? 'Loading...' : getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image */}
              {selectedRequest.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attached Image</label>
                  <img
                    src={selectedRequest.imageUrl}
                    alt="Request"
                    className="w-full rounded-xl object-cover max-h-64"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{selectedRequest.description}</p>
              </div>

              {/* Request Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Request Date</label>
                <p className="text-gray-600">
                  {format(new Date(selectedRequest.createdAt), 'MMMM d, yyyy h:mm a')}
                  <span className="text-gray-400 ml-2">
                    ({formatDistanceToNow(new Date(selectedRequest.createdAt), { addSuffix: true })})
                  </span>
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this request..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                {selectedRequest.customerPhone && (
                  <a
                    href={`tel:${selectedRequest.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call Customer
                  </a>
                )}
                <button
                  onClick={closeDetailModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


