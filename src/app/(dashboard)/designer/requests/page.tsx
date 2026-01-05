'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSecureFetch } from '@/hooks/useSecureFetch';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Calendar,
  User,
  DollarSign,
  Image as ImageIcon,
  X,
  Menu,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber, formatDate } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

interface Request {
  id: string;
  customer: {
    user: {
      name: string;
      email: string;
    };
  };
  description: string;
  status: string;
  createdAt: string;
  quotedPrice?: number | null;
  imageUrl?: string | null;
  referenceImageUrl?: string | null;
  notes?: string | null;
  chatId?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border border-blue-200',
  IN_PROGRESS: 'bg-warm-light text-warm-taupe border border-warm-apricot',
  COMPLETED: 'bg-green-100 text-green-800 border border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border border-red-200',
  CANCELLED: 'bg-stone-200 text-stone-700 border border-stone-300',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle,
  IN_PROGRESS: Loader2,
  COMPLETED: CheckCircle,
  REJECTED: XCircle,
  CANCELLED: XCircle,
};

export default function DesignerRequestsPage() {
  const { secureFetch } = useSecureFetch();
  const { toggleSidebar } = useSidebar();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await secureFetch('/api/design-requests');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRequests(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string, request: Request) => {
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'ACCEPTED' && quotedPrice) {
        updateData.quotedPrice = parseFloat(quotedPrice);
      }
      
      if (notes) {
        updateData.notes = notes;
      }

      const res = await secureFetch(`/api/design-requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRequests(prev => prev.map(r => 
            r.id === request.id ? { ...r, ...updateData, status: newStatus } : r
          ));
          setShowModal(false);
          setSelectedRequest(null);
          setQuotedPrice('');
          setNotes('');
        }
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (request: Request) => {
    setSelectedRequest(request);
    setQuotedPrice(request.quotedPrice?.toString() || '');
    setNotes(request.notes || '');
    setShowModal(true);
  };

  const filteredRequests = requests.filter(
    (req) => selectedStatus === 'all' || req.status === selectedStatus
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warm-taupe animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0 lg:hidden"
              title="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-stone-700" />
            </button>
            <h1 className="text-3xl font-serif font-semibold text-stone-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-warm-taupe" />
              Requests & Orders
            </h1>
          </div>
          <p className="text-stone-600">Manage customer requests and orders</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2.5 rounded-xl transition-all font-medium ${
              selectedStatus === 'all'
                ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            All
          </button>
          {Object.keys(STATUS_COLORS).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2.5 rounded-xl transition-all font-medium ${
                selectedStatus === status
                  ? 'bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral text-white shadow-md'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon="requests"
            title="No requests yet"
            description="Customer requests and orders will appear here"
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const StatusIcon = STATUS_ICONS[request.status] || Clock;
              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md hover:border-warm-apricot transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center shadow-md">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900">
                          {request.customer.user.name}
                        </h3>
                        <p className="text-sm text-stone-600">{request.customer.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className={`w-5 h-5 ${
                          request.status === 'IN_PROGRESS' 
                            ? 'animate-spin text-warm-taupe' 
                            : 'text-stone-600'
                        }`}
                      />
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[request.status] || STATUS_COLORS.PENDING
                        }`}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-stone-700 mb-4">{request.description}</p>

                  {/* Images */}
                  {(request.imageUrl || request.referenceImageUrl) && (
                    <div className="flex gap-2 mb-4">
                      {request.referenceImageUrl && (
                        <div className="relative">
                          <img
                            src={request.referenceImageUrl}
                            alt="Reference"
                            className="w-24 h-24 object-cover rounded-lg border border-stone-200"
                          />
                          <span className="absolute -top-1 -right-1 bg-warm-coral text-white text-xs px-1.5 py-0.5 rounded">
                            Ref
                          </span>
                        </div>
                      )}
                      {request.imageUrl && (
                        <img
                          src={request.imageUrl}
                          alt="Design"
                          className="w-24 h-24 object-cover rounded-lg border border-stone-200"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-stone-600 pt-4 border-t border-stone-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-500" />
                        {formatDate(request.createdAt)}
                      </div>
                      {request.quotedPrice && (
                        <div className="flex items-center gap-1 font-semibold text-stone-900">
                          <DollarSign className="w-4 h-4" />
                          ₹{formatNumber(request.quotedPrice)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openModal(request)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                          >
                            Accept & Quote
                          </button>
                          <button
                            onClick={() => handleUpdateStatus('REJECTED', request)}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.chatId && (
                        <Link 
                          href={`/designer/chats/${request.chatId}`}
                          className="flex items-center gap-2 text-warm-coral hover:text-warm-rose font-medium transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accept & Quote Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-stone-900">Accept Request & Set Price</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-stone-600 mb-2">Customer: {selectedRequest.customer.user.name}</p>
              <p className="text-sm text-stone-700">{selectedRequest.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Quoted Price (₹)
                </label>
                <input
                  type="number"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="Enter price"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or requirements..."
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-warm-coral focus:border-warm-coral resize-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus('ACCEPTED', selectedRequest)}
                  disabled={isUpdating || !quotedPrice}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Accepting...' : 'Accept & Set Price'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

