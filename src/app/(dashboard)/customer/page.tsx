'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Home,
  Users,
  Scissors,
  MessageCircle,
  Shirt,
  ShoppingBag,
  Settings,
  ChevronRight,
  Star,
  MapPin,
  Upload,
  Wand2,
  TrendingUp,
  Clock,
  Heart,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';

interface CustomerStats {
  activeChats: number;
  savedDesigners: number;
  wardrobeItems: number;
  consultations: number;
}

interface RecommendedDesigner {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string | null;
  price: string;
  image: string | null;
  isOnline: boolean;
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

// Default user data
const defaultUserData = {
  name: 'User',
  fullName: 'User',
  email: '',
  avatar: null,
  stylePreferences: [] as string[],
};

export default function CustomerDashboardPage() {
  const { user, isLoading: isLoadingUser } = useUser();
  const [userData, setUserData] = useState(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    activeChats: 0,
    savedDesigners: 0,
    wardrobeItems: 0,
    consultations: 0,
  });
  const [recommendedDesigners, setRecommendedDesigners] = useState<RecommendedDesigner[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  // Use UserContext data
  useEffect(() => {
    if (user) {
      const customerProfile = user.profile;
      setUserData({
        name: user.name?.split(' ')[0] || 'User',
        fullName: user.name || 'User',
        email: user.email || '',
        avatar: customerProfile?.profilePhoto || null,
        stylePreferences: customerProfile?.stylePreferences || [],
      });
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
      const [chatsRes, wardrobeRes, alterationsRes, designersRes, notificationsRes] = await Promise.all([
        fetch('/api/chat', { credentials: 'include' }),
        fetch('/api/chatbot/wardrobe', { credentials: 'include' }),
        fetch('/api/alterations', { credentials: 'include' }),
        fetch('/api/designers?limit=5&sortBy=rating&sortOrder=desc', { credentials: 'include' }),
        fetch('/api/notifications?limit=10', { credentials: 'include' }).catch(() => null),
      ]);

      // Process chats
      let activeChats = 0;
      let savedDesigners = 0;
      const chatActivities: Activity[] = [];
      
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        if (chatsData.success && chatsData.data && Array.isArray(chatsData.data)) {
          activeChats = chatsData.data.length;
          // Count unique designers from chats
          const designerIds = new Set(
            chatsData.data
              .map((chat: any) => chat.designer?.id)
              .filter((id: string) => id)
          );
          savedDesigners = designerIds.size;

          // Create activity from recent chats
          chatsData.data.slice(0, 2).forEach((chat: any) => {
            const designerName = chat.designer?.user?.name || 'Designer';
            const lastMessage = chat.messages?.[0];
            if (lastMessage) {
              chatActivities.push({
                id: `chat-${chat.id}`,
                type: 'chat',
                title: `New message from ${designerName}`,
                description: lastMessage.content?.substring(0, 50) + '...' || 'New message',
                time: formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true }),
                icon: MessageCircle,
                color: 'indigo',
              });
            }
          });
        }
      }

      // Process wardrobe items
      let wardrobeItems = 0;
      if (wardrobeRes.ok) {
        const wardrobeData = await wardrobeRes.json();
        if (wardrobeData.success && wardrobeData.data?.items) {
          wardrobeItems = wardrobeData.data.items.length;
        }
      }

      // Process alteration requests (consultations)
      let consultations = 0;
      const alterationActivities: Activity[] = [];
      if (alterationsRes.ok) {
        const alterationsData = await alterationsRes.json();
        if (alterationsData.success && alterationsData.data && Array.isArray(alterationsData.data)) {
          consultations = alterationsData.data.length;
          
          // Create activity from recent alterations
          alterationsData.data.slice(0, 2).forEach((alt: any) => {
            alterationActivities.push({
              id: `alt-${alt.id}`,
              type: 'alteration',
              title: `Alteration ${alt.status.toLowerCase()}`,
              description: alt.description?.substring(0, 50) + '...' || 'Alteration request',
              time: formatDistanceToNow(new Date(alt.createdAt), { addSuffix: true }),
              icon: Scissors,
              color: alt.status === 'COMPLETED' ? 'amber' : 'indigo',
            });
          });
        }
      }

      // Process recommended designers
      if (designersRes.ok) {
        const designersData = await designersRes.json();
        if (designersData.success && designersData.data && Array.isArray(designersData.data)) {
          const designers = designersData.data.map((designer: any) => {
            // Get price range from portfolio items
            const portfolioItems = designer.portfolioItems || [];
            let priceRange = 'Price on request';
            if (portfolioItems.length > 0) {
              const prices = portfolioItems
                .map((item: any) => [item.budgetMin, item.budgetMax])
                .flat()
                .filter((p: number | null) => p !== null);
              if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                priceRange = `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`;
              }
            }

            // Get specialty from design niches
            const specialty = designer.designNiches?.join(', ') || 'Various styles';

            return {
              id: designer.id,
              name: designer.user?.name || 'Designer',
              specialty,
              rating: designer.rating || 0,
              reviews: designer.reviewCount || 0,
              location: designer.location || null,
              price: priceRange,
              image: designer.profilePhoto || null,
              isOnline: false, // Would need socket connection for real-time status
            };
          });
          setRecommendedDesigners(designers);
        }
      }

      // Process notifications for activity
      const notificationActivities: Activity[] = [];
      if (notificationsRes && notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        if (notificationsData.success && notificationsData.data && Array.isArray(notificationsData.data)) {
          notificationsData.data.slice(0, 2).forEach((notif: any) => {
            notificationActivities.push({
              id: `notif-${notif.id}`,
              type: 'notification',
              title: notif.title || 'New notification',
              description: notif.message?.substring(0, 50) + '...' || 'Notification',
              time: formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }),
              icon: Sparkles,
              color: 'purple',
            });
          });
        }
      }

      // Combine all activities and sort by time
      const allActivities = [...chatActivities, ...alterationActivities, ...notificationActivities]
        .sort((a, b) => {
          // Simple sort - in real app, would parse time strings
          return 0;
        })
        .slice(0, 4);
      setRecentActivity(allActivities);

      // Update stats
      setStats({
        activeChats,
        savedDesigners,
        wardrobeItems,
        consultations,
      });
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

  const statsCards = [
    { label: 'Active Chats', value: stats.activeChats.toString(), icon: MessageCircle, color: 'indigo', trend: `${stats.activeChats > 0 ? 'Active' : 'No chats yet'}` },
    { label: 'Saved Designers', value: stats.savedDesigners.toString(), icon: Heart, color: 'pink', trend: `${stats.savedDesigners > 0 ? 'Connected' : 'None yet'}` },
    { label: 'Wardrobe Items', value: stats.wardrobeItems.toString(), icon: ShoppingBag, color: 'purple', trend: `${stats.wardrobeItems > 0 ? 'Items' : 'Empty'}` },
    { label: 'Consultations', value: stats.consultations.toString(), icon: Users, color: 'amber', trend: `${stats.consultations > 0 ? 'Requests' : 'None yet'}` },
  ];

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
                Welcome back, {userData.name}! 👋
              </h1>
              <p className="text-white/90 mb-6 max-w-xl">
                Ready to explore new styles? Your personalized fashion journey continues here.
              </p>
              <div className="flex flex-wrap gap-2">
                {userData.stylePreferences.map((style) => (
                  <span
                    key={style}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards - Desktop 4 columns by default, adapts down */}
          <div className="grid grid-cols-4 gap-4 mb-6 max-xl:grid-cols-2 max-sm:grid-cols-1 w-full max-w-full box-border">
            {statsCards.map((stat) => {
              const colors = getColorClasses(stat.color);
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-stone-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.light}`}>
                      <stat.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <span className="flex items-center gap-1 text-xs text-stone-600 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-stone-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-stone-600">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Two Column Layout - Main content + Recent Activity */}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 max-xl:grid-cols-1 w-full max-w-full box-border">
            {/* Left Column - Recommended Designers */}
            <div className="min-w-0 max-w-full box-border overflow-hidden">
              <div className="bg-white rounded-xl shadow-sm border border-stone-200">
                <div className="flex items-center justify-between p-4 border-b border-stone-200">
                  <div>
                    <h2 className="font-serif text-lg text-stone-900">Recommended Designers</h2>
                    <p className="text-sm text-stone-600">Based on your style preferences & budget</p>
                  </div>
                  <Link
                    href="/customer/designers"
                    className="text-stone-700 hover:text-stone-900 font-medium text-sm flex items-center gap-1 transition-colors"
                  >
                    View all
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-4">
                  {recommendedDesigners.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 w-full max-w-full box-border">
                      {recommendedDesigners.map((designer) => (
                        <div
                          key={designer.id}
                          className="bg-stone-50 rounded-xl p-4 hover:bg-stone-100 transition-colors border border-stone-200"
                        >
                          {/* Designer Avatar */}
                          <div className="relative mb-4">
                            {designer.image ? (
                              <img
                                src={designer.image}
                                alt={designer.name}
                                className="w-16 h-16 mx-auto rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 mx-auto bg-stone-700 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                                {getInitials(designer.name)}
                              </div>
                            )}
                            {designer.isOnline && (
                              <div className="absolute bottom-0 right-1/2 translate-x-8 w-4 h-4 bg-amber-500 border-2 border-white rounded-full" />
                            )}
                          </div>

                          {/* Designer Info */}
                          <div className="text-center mb-4">
                            <h3 className="font-semibold text-stone-900">{designer.name}</h3>
                            <p className="text-sm text-stone-700">{designer.specialty}</p>
                            
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium text-stone-800">{designer.rating.toFixed(1)}</span>
                              <span className="text-xs text-stone-500">({designer.reviews})</span>
                            </div>

                            {designer.location && (
                              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-stone-600">
                                <MapPin className="w-3 h-3" />
                                {designer.location}
                              </div>
                            )}

                            <p className="mt-2 text-xs text-stone-700">{designer.price}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Link
                              href={`/customer/designers/${designer.id}`}
                              className="flex-1 py-2 text-center text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                            >
                              View Profile
                            </Link>
                            <Link
                              href={`/customer/chats/new?designer=${designer.id}`}
                              className="flex-1 py-2 text-center text-sm font-medium text-white bg-stone-700 hover:bg-stone-800 hover:shadow-md rounded-lg transition-all"
                            >
                              Chat Now
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-600">
                      <p>No designers available at the moment.</p>
                      <Link
                        href="/customer/designers"
                        className="text-stone-700 hover:text-stone-900 font-medium text-sm mt-2 inline-block"
                      >
                        Browse all designers →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-white rounded-xl shadow-sm p-5 border border-stone-200">
                <h2 className="font-serif text-lg text-stone-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                  <Link
                    href="/customer/wardrobe"
                    className="group p-4 bg-stone-50 rounded-xl hover:shadow-md transition-all border border-stone-200"
                  >
                    <div className="w-12 h-12 bg-stone-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-1">Upload to Wardrobe</h3>
                    <p className="text-sm text-stone-600">Add clothes to get outfit suggestions</p>
                    <ArrowRight className="w-5 h-5 text-stone-700 mt-3 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/customer/chatbot"
                    className="group p-6 bg-rose-50 rounded-xl hover:shadow-md transition-all border border-rose-200"
                  >
                    <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-1">Get Style Advice</h3>
                    <p className="text-sm text-stone-600">Chat with our AI fashion assistant</p>
                    <ArrowRight className="w-5 h-5 text-rose-600 mt-3 group-hover:translate-x-1 transition-transform" />
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
                    href="/customer/activity"
                    className="text-stone-700 hover:text-stone-900 font-medium text-sm transition-colors"
                  >
                    View all
                  </Link>
                </div>

                <div className="p-3">
                  {recentActivity.length > 0 ? (
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
                    <div className="text-center py-8 text-stone-600">
                      <p className="text-sm">No recent activity</p>
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
                  Get unlimited AI consultations, priority chat, and exclusive designer access.
                </p>
                <button className="w-full py-2.5 bg-white text-stone-900 font-semibold rounded-xl hover:bg-white/90 transition-colors">
                  Learn More
                </button>
              </div>

              {/* Style Tips */}
              <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-stone-200">
                <h3 className="font-serif text-stone-900 mb-4">💡 Style Tip of the Day</h3>
                <p className="text-sm text-stone-700 leading-relaxed">
                  &quot;Mixing textures is a great way to add depth to minimalist outfits. Try pairing a silk blouse with cotton pants for an effortlessly chic look.&quot;
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
