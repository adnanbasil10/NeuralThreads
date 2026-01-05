'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Home,
  Images,
  MessageCircle,
  ShoppingBag,
  User,
  Settings,
  ChevronRight,
  Star,
  MapPin,
  Upload,
  Wand2,
  Camera,
  TrendingUp,
  Clock,
  Heart,
  ArrowRight,
  Eye,
  Loader2,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';

interface DesignerStats {
  portfolioItems: number;
  activeChats: number;
  pendingRequests: number;
  profileViews: number;
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

interface PortfolioItem {
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

export default function DesignerDashboard() {
  const { user, isLoading: isLoadingUser } = useUser();
  const [designerName, setDesignerName] = useState('Designer');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [designNiches, setDesignNiches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DesignerStats>({
    portfolioItems: 0,
    activeChats: 0,
    pendingRequests: 0,
    profileViews: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (user) {
      setDesignerName(user.name);
      if (user.profile?.profilePhoto) {
        setProfilePhoto(user.profile.profilePhoto);
      }
      if (user.profile?.designNiches) {
        setDesignNiches(user.profile.designNiches);
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
      const [chatsRes, portfolioRes] = await Promise.all([
        fetch('/api/chat', { credentials: 'include' }),
        fetch('/api/designers/portfolio', { credentials: 'include' }),
      ]);

      const chatsData = await chatsRes.json();
      const portfolioData = await portfolioRes.json();

      // Process chats
      const chats = chatsData.success ? chatsData.data || [] : [];
      const activeChats = chats.length;
      const pendingRequests = chats.length; // All chats are considered requests

      // Process portfolio
      const portfolio = portfolioData.success ? portfolioData.data || [] : [];
      const portfolioItemsCount = portfolio.length;
      
      // Get most viewed portfolio items (top 3)
      const sortedPortfolio = [...portfolio]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)
        .map((item: any) => ({
          id: item.id,
          imageUrl: item.imageUrl || '/placeholder-image.jpg',
          description: item.description || 'Portfolio Item',
          views: item.views || 0,
          category: item.category,
        }));

      // Process recent inquiries from chats
      const inquiries = chats
        .slice(0, 4)
        .map((chat: any) => {
          const lastMessage = chat.messages?.[0];
          const customer = chat.customer;
          const customerName = customer?.user?.name || 'Customer';
          const message = lastMessage?.content || 'New inquiry';
          const createdAt = lastMessage?.createdAt || chat.createdAt;
          const isUnread = chat.unreadCount > 0;

          return {
            id: chat.id,
            customerName,
            customerPhoto: customer?.profilePhoto,
            message,
            time: formatDistanceToNow(new Date(createdAt), { addSuffix: true }),
            isUnread,
            isOnline: false, // Would need socket connection for real-time status
          };
        });

      // Fetch designer profile to get profile views
      let profileViews = 0;
      try {
        const profileRes = await fetch('/api/auth/me', { credentials: 'include' });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data?.designer?.profileViews !== undefined) {
          profileViews = profileData.data.designer.profileViews || 0;
        }
      } catch (error) {
        console.error('Error fetching profile views:', error);
      }

      // Calculate stats
      setStats({
        portfolioItems: portfolioItemsCount,
        activeChats,
        pendingRequests,
        profileViews,
      });

      setRecentInquiries(inquiries);
      setPortfolioItems(sortedPortfolio);

      // Generate recent activity from chats and portfolio
      const activities: Activity[] = [];
      
      // Add chat activities
      chats.slice(0, 2).forEach((chat: any) => {
        const customerName = chat.customer?.user?.name || 'Customer';
        const lastMessage = chat.messages?.[0];
        if (lastMessage) {
          activities.push({
            id: `chat-${chat.id}`,
            type: 'chat',
            title: `New message from ${customerName}`,
            description: lastMessage.content?.substring(0, 50) + '...' || 'New message',
            time: formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true }),
            icon: MessageCircle,
            color: 'indigo',
          });
        }
      });

      // Add portfolio activities
      if (sortedPortfolio.length > 0) {
        activities.push({
          id: 'portfolio-view',
          type: 'portfolio',
          title: 'Portfolio item viewed',
          description: `${sortedPortfolio[0].description} got ${sortedPortfolio[0].views} views`,
          time: 'Recently',
          icon: Eye,
          color: 'purple',
        });
      }

      setRecentActivity(activities.slice(0, 4));
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

  if (isLoadingUser) {
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
            Welcome back, {designerName}! 👋
          </h1>
          <p className="text-white/90 mb-6 max-w-xl">
            Here's what's happening with your portfolio and customer inquiries.
          </p>
          <div className="flex flex-wrap gap-2">
            {designNiches.length > 0 ? (
              designNiches.map((niche) => (
                <span
                  key={niche}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium"
                >
                  {niche}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                Designer
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/designer/portfolio"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-white font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload New Design
            </Link>
            <Link
              href="/designer/chats"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-white font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              View Messages
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards - Desktop 4 columns by default, adapts down */}
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
              <div className="p-3 rounded-xl bg-stone-50">
                <Images className="w-6 h-6 text-stone-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.portfolioItems)}</p>
            <p className="text-sm text-stone-600">Portfolio Items</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-rose-50">
                <MessageCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.activeChats)}</p>
            <p className="text-sm text-stone-600">Active Chats</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-stone-50">
                <ShoppingBag className="w-6 h-6 text-stone-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.pendingRequests)}</p>
            <p className="text-sm text-stone-600">Pending Requests</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <Eye className="w-6 h-6 text-amber-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-stone-900 mb-1">{formatNumber(stats.profileViews)}</p>
            <p className="text-sm text-stone-600">Profile Views</p>
          </div>
        </div>
      )}

      {/* Two Column Layout - Main content + Recent Activity */}
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 max-xl:grid-cols-1 w-full max-w-full box-border">
        {/* Left Column - Recent Customer Inquiries & Portfolio Performance */}
        <div className="min-w-0 max-w-full box-border overflow-hidden space-y-6">
          {/* Recent Customer Inquiries */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-lg text-stone-900">Recent Customer Inquiries</h2>
                <p className="text-sm text-stone-600">Latest messages from potential clients</p>
              </div>
              <Link
                href="/designer/chats"
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
                          href={`/designer/chats/${inquiry.id}`}
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

          {/* Portfolio Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-lg text-stone-900">Portfolio Performance</h2>
                <p className="text-sm text-stone-600">Your most viewed designs</p>
              </div>
              <Link
                href="/designer/portfolio"
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
              ) : portfolioItems.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-stone-500 mb-3">Most Viewed Items</p>
                  <div className="space-y-3">
                    {portfolioItems.map((item, index) => (
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
                  <p className="text-stone-600">No portfolio items yet</p>
                  <p className="text-sm text-stone-500">Upload your first design to get started</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200">
              <Link
                href="/designer/portfolio"
                className="flex items-center justify-center gap-2 w-full py-3 bg-stone-700 text-white rounded-xl hover:bg-stone-800 hover:shadow-md transition-all font-medium"
              >
                <Upload className="w-4 h-4" />
                Add New Portfolio Item
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
            <h2 className="font-serif text-lg text-stone-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <Link
                href="/designer/portfolio"
                className="group p-4 bg-stone-50 rounded-xl hover:shadow-md transition-all border border-stone-200"
              >
                <div className="w-12 h-12 bg-stone-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">Upload New Design</h3>
                <p className="text-sm text-stone-600">Add to your portfolio</p>
                <ArrowRight className="w-5 h-5 text-stone-700 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/designer/chats"
                className="group p-6 bg-rose-50 rounded-xl hover:shadow-md transition-all border border-rose-200"
              >
                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">View All Chats</h3>
                <p className="text-sm text-stone-600">Reply to customers</p>
                <ArrowRight className="w-5 h-5 text-rose-600 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/designer/settings"
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
              <Link
                href="/designer/activity"
                className="text-stone-700 hover:text-stone-900 font-medium text-sm transition-colors"
              >
                View all
              </Link>
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
              Get featured placement, priority support, and advanced analytics for your portfolio.
            </p>
            <button className="w-full py-2.5 bg-white text-stone-900 font-semibold rounded-xl hover:bg-white/90 transition-colors">
              Learn More
            </button>
          </div>

          {/* Design Tips */}
          <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-stone-200">
            <h3 className="font-serif text-stone-900 mb-4">💡 Design Tip of the Day</h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              &quot;Understanding your client's body shape and personal style is key to creating designs they'll love. Always start with a consultation to gather insights.&quot;
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
