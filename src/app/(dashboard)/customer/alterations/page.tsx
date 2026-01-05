'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Menu,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useSidebar } from '@/contexts/SidebarContext';

interface AlterationRequest {
  id: string;
  tailorId: string;
  tailorName: string;
  tailorLocation?: string;
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

export default function CustomerAlterationsPage() {
  const { toggleSidebar } = useSidebar();
  const [requests, setRequests] = useState<AlterationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
          const transformedRequests: AlterationRequest[] = data.data.map((req: {
            id: string;
            tailorId: string;
            tailor?: { user?: { name?: string }; location?: string };
            description?: string;
            imageUrl?: string;
            status?: string;
            createdAt: string;
            notes?: string;
          }) => ({
            id: req.id,
            tailorId: req.tailorId,
            tailorName: req.tailor?.user?.name || 'Unknown Tailor',
            tailorLocation: req.tailor?.location || undefined,
            description: req.description || '',
            imageUrl: req.imageUrl || undefined,
            status: req.status || 'PENDING',
            createdAt: req.createdAt,
            notes: req.notes || undefined,
          }));
          setRequests(transformedRequests);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Your request is waiting for the tailor to accept it.';
      case 'IN_PROGRESS': return 'The tailor is working on your alteration request.';
      case 'COMPLETED': return 'Your alteration request has been completed!';
      case 'REJECTED': return 'Your alteration request has been rejected by the tailor.';
      default: return '';
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.tailorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
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
                href="/customer"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-stone-900">My Alteration Requests</h1>
                <p className="text-sm text-stone-500">{filteredRequests.length} requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tailor name or description..."
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-stone-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-warm-coral focus:border-transparent"
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
                      ? 'bg-warm-coral text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-900 mb-2">No requests found</h3>
            <p className="text-stone-500 mb-4">
              {searchQuery || filterStatus ? 'Try adjusting your filters' : 'You haven\'t submitted any alteration requests yet'}
            </p>
            <Link
              href="/customer/tailors"
              className="inline-block px-6 py-3 bg-warm-coral text-white rounded-xl hover:bg-warm-rose transition-colors font-medium"
            >
              Find a Tailor
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow"
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
                        <div className="w-full lg:w-32 h-32 bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral rounded-xl flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <h3 className="font-semibold text-stone-900 text-lg">{request.tailorName}</h3>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                        <span className="text-sm text-stone-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <p className="text-stone-600 mb-3 line-clamp-2">{request.description}</p>

                      {/* Status Message */}
                      <div className={`p-3 rounded-xl mb-3 ${getStatusColor(request.status)}`}>
                        <p className="text-sm font-medium">{getStatusMessage(request.status)}</p>
                        {request.notes && (
                          <p className="text-sm mt-1 opacity-90">{request.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                        {request.tailorLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.tailorLocation}
                          </span>
                        )}
                        <span className="text-stone-400">
                          Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

