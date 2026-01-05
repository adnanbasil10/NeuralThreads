'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Scissors,
  ClipboardList,
  Images,
  MessageCircle,
  User,
  Settings,
  ChevronRight,
  Star,
  MapPin,
  Upload,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  ArrowRight,
  Loader2,
  Award,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';

interface TailorStats {
  pendingRequests: number;
  completedWork: number;
  totalCustomers: number;
  sampleWorkItems: number;
}

interface AlterationRequest {
  id: string;
  customerName?: string;
  customer?: {
    user?: {
      name: string;
    };
  };
  description: string;
  imageUrl?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

interface RecentInquiry {
  id: string;
  customerName: string;
  customerPhoto?: string;
  message: string;
  time: string;
  isUnread: boolean;
  isOnline?: boolean;
}

interface SampleWorkItem {
  id: string;
  imageUrl: string;
  description: string;
  views: number;
  category: string | null;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

export default function TailorDashboard() {
  const { user, isLoading: isLoadingUser } = useUser();
  const [tailorName, setTailorName] = useState('Tailor');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TailorStats>({
    pendingRequests: 0,
    completedWork: 0,
    totalCustomers: 0,
    sampleWorkItems: 0,
  });
  const [recentRequests, setRecentRequests] = useState<AlterationRequest[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [sampleWorkItems, setSampleWorkItems] = useState<SampleWorkItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (user) {
      setTailorName(user.name || 'Tailor');
      if (user.profile?.profilePhoto) {
        setProfilePhoto(user.profile.profilePhoto);
      }
      if (user.profile?.location) {
        setLocation(user.profile.location);
      }
      if (user.profile?.skills) {
        setSkills(user.profile.skills);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingUser && user) {
      fetchDashboardData();
    }
  }, [isLoadingUser, user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [requestsRes, chatsRes, sampleWorkRes, profileRes] = await Promise.all([
        fetch('/api/alterations', { credentials: 'include' }),
        fetch('/api/chat', { credentials: 'include' }),
        fetch('/api/tailors/sample-work', { credentials: 'include' }).catch(() => null),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);

      let allRequests: AlterationRequest[] = [];

      // Process chats (recent customer inquiries)
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        if (chatsData.success && chatsData.data && Array.isArray(chatsData.data)) {
          const inquiries = chatsData.data.slice(0, 4).map((chat: any) => ({
            id: chat.id,
            customerName: chat.customer?.user?.name || 'Customer',
            customerPhoto: chat.customer?.profilePhoto || null,
            message: chat.messages?.[0]?.content || 'New message',
            time: chat.messages?.[0]?.createdAt 
              ? formatDistanceToNow(new Date(chat.messages[0].createdAt), { addSuffix: true })
              : formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }),
            isUnread: (chat.unreadCount || 0) > 0,
            isOnline: false, // Could be enhanced with socket.io
          }));
          setRecentInquiries(inquiries);
          // activeChats removed from stats
        }
      }

      // Process alteration requests
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        if (requestsData.success && requestsData.data && Array.isArray(requestsData.data)) {
          allRequests = requestsData.data;
          // Transform requests to include customerName
          const transformedRequests = allRequests.map((r: any) => ({
            ...r,
            customerName: r.customer?.user?.name || 'Customer',
          }));
          const requests = transformedRequests.slice(0, 4);
          setRecentRequests(requests);
          
          // Calculate stats
          const pending = allRequests.filter((r: any) => r.status === 'PENDING').length;
          const completed = allRequests.filter((r: any) => r.status === 'COMPLETED').length;
          const totalCustomers = new Set(allRequests.map((r: any) => r.customerId)).size;
          
          setStats(prev => ({
            ...prev,
            pendingRequests: pending,
            completedWork: completed,
            totalCustomers,
          }));

          // Generate recent activity from requests
          const activities: Activity[] = [];
          transformedRequests.slice(0, 2).forEach((request: any) => {
            activities.push({
              id: `request-${request.id}`,
              type: 'request',
              title: `New request from ${request.customerName}`,
              description: request.description.substring(0, 50) + '...',
              time: formatDistanceToNow(new Date(request.createdAt), { addSuffix: true }),
              icon: ClipboardList,
              color: 'indigo',
            });
          });
          setRecentActivity(activities.slice(0, 4));
        }
      }

      // Process sample work
      if (sampleWorkRes && sampleWorkRes.ok) {
        const sampleWorkData = await sampleWorkRes.json();
        if (sampleWorkData.success && sampleWorkData.data && Array.isArray(sampleWorkData.data)) {
          const sorted = sampleWorkData.data
            .slice(0, 3)
            .map((item: any) => ({
              id: item.id,
              imageUrl: item.imageUrl,
              description: item.description || 'Sample work',
              views: 0, // Sample work doesn't have views field
              category: null,
            }));
          setSampleWorkItems(sorted);
          setStats(prev => ({ ...prev, sampleWorkItems: sampleWorkData.data.length }));
        }
      }

      // Fetch tailor profile for additional data
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data?.tailor) {
          const tailor = profileData.data.tailor;
          if (tailor.location) {
            setLocation(tailor.location);
          }
          if (tailor.skills) {
            setSkills(tailor.skills);
          }
          if (tailor.profilePhoto) {
            setProfilePhoto(tailor.profilePhoto);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; light: string }> = {
      indigo: { bg: 'bg-stone-600', text: 'text-stone-700', light: 'bg-stone-50' },
      pink: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50' },
      purple: { bg: 'bg-stone-600', text: 'text-stone-700', light: 'bg-stone-50' },
      amber: { bg: 'bg-amber-600', text: 'text-amber-700', light: 'bg-amber-50' },
    };
    return colors[color] || colors.indigo;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'IN_PROGRESS': return 'bg-warm-light text-warm-taupe border border-warm-apricot';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-stone-200 text-stone-700 border border-stone-300';
    }
  };

  if (isLoadingUser || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full box-border pb-8 overflow-x-hidden">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-warm-taupe via-warm-rose to-warm-coral rounded-2xl p-6 mb-6">
        <div className="absolute inset-0 bg-black/5" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-100/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h1 className="font-serif text-3xl text-white mb-2 max-lg:text-2xl">
            Welcome back, {tailorName}! ✂️
          </h1>
          <p className="text-white/90 mb-6 max-w-xl">
            Here's what's happening with your alteration requests and sample work.
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                Tailor
              </span>
            )}
            {location && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/tailor/sample-work"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-white font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Sample Work
            </Link>
            <Link
              href="/tailor/requests"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-white font-medium"
            >
              <ClipboardList className="w-4 h-4" />
              View Requests
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-6 max-xl:grid-cols-2 max-sm:grid-cols-1 w-full max-w-full box-border">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 animate-pulse"
            >
              <div className="h-12 bg-stone-200 rounded-xl mb-4" />
              <div className="h-8 bg-stone-200 rounded mb-2" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6 max-xl:grid-cols-2 max-sm:grid-cols-1 w-full max-w-full box-border">
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.pendingRequests)}</p>
            <p className="text-sm text-stone-600">Pending Requests</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.completedWork)}</p>
            <p className="text-sm text-stone-600">Completed Work</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-rose-50">
                <User className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.totalCustomers)}</p>
            <p className="text-sm text-stone-600">Total Customers</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-stone-50">
                <Images className="w-6 h-6 text-stone-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.sampleWorkItems)}</p>
            <p className="text-sm text-stone-600">Sample Work Items</p>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 max-xl:grid-cols-1 w-full max-w-full box-border">
        {/* Left Column - Recent Requests & Sample Work */}
        <div className="min-w-0 max-w-full box-border overflow-hidden space-y-6">
          {/* Recent Customer Inquiries */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-lg text-stone-900">Recent Customer Inquiries</h2>
                <p className="text-sm text-stone-600">Latest messages from customers</p>
              </div>
              <Link
                href="/tailor/chats"
                className="text-stone-700 hover:text-stone-900 font-medium text-sm flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-stone-200 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-stone-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-stone-200 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-stone-200 rounded w-full mb-1" />
                          <div className="h-3 bg-stone-200 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentInquiries.length > 0 ? (
                <div className="space-y-3">
                  {recentInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 transition-colors border border-stone-200"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                          {getInitials(inquiry.customerName)}
                        </div>
                        {inquiry.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-stone-900 flex items-center gap-2">
                            {inquiry.customerName}
                            {inquiry.isUnread && (
                              <span className="w-2 h-2 bg-warm-coral rounded-full" />
                            )}
                          </p>
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {inquiry.time}
                          </span>
                        </div>
                        <p className="text-sm text-stone-600 truncate">{inquiry.message}</p>
                        <Link
                          href={`/tailor/chats`}
                          className="mt-2 inline-block text-sm text-warm-coral hover:text-warm-rose font-medium transition-colors"
                        >
                          Reply →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <p className="text-stone-600">No inquiries yet</p>
                  <p className="text-sm text-stone-500">Customer messages will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Alteration Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-lg text-stone-900">Recent Alteration Requests</h2>
                <p className="text-sm text-stone-600">Latest requests from customers</p>
              </div>
              <Link
                href="/tailor/requests"
                className="text-stone-700 hover:text-stone-900 font-medium text-sm flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-stone-200 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-stone-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-stone-200 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-stone-200 rounded w-full mb-1" />
                          <div className="h-3 bg-stone-200 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map((request: any) => {
                    const customerName = request.customerName || request.customer?.user?.name || 'Customer';
                    return (
                      <div
                        key={request.id}
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 transition-colors border border-stone-200"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                            {getInitials(customerName)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-stone-900 flex items-center gap-2">
                              {customerName}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-stone-600 truncate mb-2">{request.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </span>
                            <Link
                              href={`/tailor/requests?id=${request.id}`}
                              className="text-sm text-warm-coral hover:text-warm-rose font-medium transition-colors"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <p className="text-stone-600">No requests yet</p>
                  <p className="text-sm text-stone-500">Customer requests will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Sample Work Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-lg text-stone-900">Sample Work Performance</h2>
                <p className="text-sm text-stone-600">Your most viewed work</p>
              </div>
              <Link
                href="/tailor/sample-work"
                className="text-stone-700 hover:text-stone-900 font-medium text-sm flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                      <div className="w-8 h-8 bg-stone-200 rounded-lg" />
                      <div className="w-14 h-14 bg-stone-200 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-4 bg-stone-200 rounded w-2/3 mb-1" />
                        <div className="h-3 bg-stone-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sampleWorkItems.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-stone-500 mb-3">Most Viewed Items</p>
                  <div className="space-y-3">
                    {sampleWorkItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors"
                      >
                        <span className="w-8 h-8 bg-stone-100 text-stone-700 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 border border-stone-200">
                          {index + 1}
                        </span>
                        <img
                          src={item.imageUrl}
                          alt={item.description}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-stone-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {item.description}
                          </p>
                          <p className="text-xs text-stone-500">{item.category || 'Uncategorized'}</p>
                        </div>
                        <div className="flex items-center text-stone-500 text-sm flex-shrink-0">
                          <Eye className="w-4 h-4 mr-1" />
                          {formatNumber(item.views)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Images className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <p className="text-stone-600">No sample work yet</p>
                  <p className="text-sm text-stone-500">Upload your first sample to get started</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200">
              <Link
                href="/tailor/sample-work"
                className="flex items-center justify-center gap-2 w-full py-3 bg-stone-700 text-white rounded-xl hover:bg-stone-800 hover:shadow-md transition-all font-medium"
              >
                <Upload className="w-4 h-4" />
                Add New Sample Work
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
            <h2 className="font-serif text-lg text-stone-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <Link
                href="/tailor/sample-work"
                className="group p-4 bg-stone-50 rounded-xl hover:shadow-md transition-all border border-stone-200"
              >
                <div className="w-12 h-12 bg-stone-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">Upload Sample Work</h3>
                <p className="text-sm text-stone-600">Showcase your skills</p>
                <ArrowRight className="w-5 h-5 text-stone-700 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/tailor/requests"
                className="group p-6 bg-rose-50 rounded-xl hover:shadow-md transition-all border border-rose-200"
              >
                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">View All Requests</h3>
                <p className="text-sm text-stone-600">Manage alterations</p>
                <ArrowRight className="w-5 h-5 text-rose-600 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/tailor/settings"
                className="group p-6 bg-amber-50 rounded-xl hover:shadow-md transition-all border border-amber-200"
              >
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">Update Profile</h3>
                <p className="text-sm text-stone-600">Edit your info</p>
                <ArrowRight className="w-5 h-5 text-amber-700 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="min-w-0 max-w-full box-border overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h2 className="font-serif text-lg text-stone-900">Recent Activity</h2>
            </div>

            <div className="p-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl animate-pulse">
                      <div className="w-10 h-10 bg-stone-200 rounded-xl" />
                      <div className="flex-1">
                        <div className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-stone-200 rounded w-full mb-1" />
                        <div className="h-3 bg-stone-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const colors = getColorClasses(activity.color);
                    return (
                      <div
                        key={activity.id}
                        className="flex gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-xl ${colors.light} flex-shrink-0`}>
                          <activity.icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 text-sm">{activity.title}</p>
                          <p className="text-xs text-stone-600 truncate">{activity.description}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <p className="text-stone-600">No recent activity</p>
                  <p className="text-sm text-stone-500">Activity will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Premium Upsell Card */}
          <div className="mt-4 bg-gradient-to-br from-stone-700 to-stone-800 rounded-xl p-5 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg mb-2">Upgrade to Premium</h3>
            <p className="text-white/90 text-sm mb-4">
              Get featured placement, priority support, and advanced analytics for your tailor business.
            </p>
            <button className="w-full py-2.5 bg-white text-stone-900 font-semibold rounded-xl hover:bg-white/90 transition-colors">
              Learn More
            </button>
          </div>

          {/* Tailor Tips */}
          <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-stone-200">
            <h3 className="font-serif text-stone-900 mb-4">💡 Tailor Tip of the Day</h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              &quot;Always measure twice and cut once. Understanding your customer's fit preferences and body measurements is crucial for perfect alterations.&quot;
            </p>
            <button className="mt-4 text-sm text-stone-700 font-medium hover:text-stone-900 transition-colors">
              More tips →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
