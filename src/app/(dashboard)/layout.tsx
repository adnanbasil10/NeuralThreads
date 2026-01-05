'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Home, Users, Scissors, MessageCircle, Sparkles, 
  Shirt, ShoppingBag, Settings, LogOut,
  Palette, Bell, Search, Menu, X, CheckCircle,
  ClipboardList, User, Image
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { useUser } from '@/contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { useSecureFetch } from '@/hooks/useSecureFetch';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();
  const { user, isLoading: isLoadingUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { secureFetch } = useSecureFetch();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 80, right: 24 });
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Get user role from logged-in user, not from URL
  // Use stable default to prevent hydration mismatch
  // During SSR, user is null, so we derive role from pathname as fallback
  const userRole = useMemo(() => {
    if (user?.role) {
      return user.role === 'CUSTOMER' ? 'customer' : user.role === 'DESIGNER' ? 'designer' : 'tailor';
    }
    // Fallback: derive from pathname during SSR to ensure consistent rendering
    if (pathname.startsWith('/customer')) return 'customer';
    if (pathname.startsWith('/designer')) return 'designer';
    if (pathname.startsWith('/tailor')) return 'tailor';
    return 'customer'; // Default fallback
  }, [user?.role, pathname]);

  // Memoize menu items to prevent hydration mismatches
  // Use stable menu structure - only badges update after hydration
  const menuItems = useMemo(() => {
    // Always use null badges during SSR to ensure server/client match
    // Badges will update on client after hydration completes
    const isHydrated = typeof window !== 'undefined';
    const chatBadge = isHydrated && !isLoadingUser && user !== null && unreadChatCount > 0 ? unreadChatCount : null;

    if (userRole === 'customer') {
      return [
        { icon: Home, label: 'Dashboard', href: '/customer', badge: null },
        { icon: Users, label: 'Browse Designers', href: '/customer/designers', badge: null },
        { icon: Image, label: 'Browse Designs', href: '/customer/designs', badge: null },
        { icon: Scissors, label: 'Find Tailors', href: '/customer/tailors', badge: null },
        { icon: ClipboardList, label: 'My Alterations', href: '/customer/alterations', badge: null },
        { icon: MessageCircle, label: 'My Chats', href: '/customer/chats', badge: chatBadge },
        { icon: Sparkles, label: 'AI Stylist', href: '/customer/chatbot', badge: null },
        { icon: ShoppingBag, label: 'My Wardrobe', href: '/customer/wardrobe', badge: null },
        { icon: Settings, label: 'Settings', href: '/customer/settings', badge: null },
      ];
    } else if (userRole === 'designer') {
      return [
        { icon: Home, label: 'Dashboard', href: '/designer', badge: null },
        { icon: Palette, label: 'My Portfolio', href: '/designer/portfolio', badge: null },
        { icon: MessageCircle, label: 'Chat with Customers', href: '/designer/chats', badge: chatBadge },
        { icon: ClipboardList, label: 'Requests & Orders', href: '/designer/requests', badge: null },
        { icon: User, label: 'Profile Settings', href: '/designer/settings', badge: null },
      ];
    } else if (userRole === 'tailor') {
      return [
        { icon: Home, label: 'Dashboard', href: '/tailor', badge: null },
        { icon: Scissors, label: 'Alteration Requests', href: '/tailor/requests', badge: null },
        { icon: MessageCircle, label: 'Chat with Customers', href: '/tailor/chats', badge: chatBadge },
        { icon: Settings, label: 'Settings', href: '/tailor/settings', badge: null },
      ];
    } else {
      // Fallback for unknown role
      return [
        { icon: Home, label: 'Dashboard', href: '/tailor', badge: null },
        { icon: Scissors, label: 'Alteration Requests', href: '/tailor/requests', badge: null },
        { icon: Shirt, label: 'My Sample Work', href: '/tailor/sample-work', badge: null },
        { icon: Settings, label: 'Settings', href: '/tailor/settings', badge: null },
      ];
    }
  }, [userRole, unreadChatCount, isLoadingUser, user]);

  // Check if current page is a main dashboard page
  const isMainDashboard = pathname === '/customer' || pathname === '/designer' || pathname === '/tailor';

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10', {
        credentials: 'include',
        cache: 'no-store', // Always fetch fresh data
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error to user, just log it
    }
  }, []);

  // Fetch unread chat count function
  const fetchUnreadChatCount = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Sum up all unread counts from all chats
        const totalUnread = data.data.reduce((sum: number, chat: any) => {
          return sum + (chat.unreadCount || 0);
        }, 0);
        setUnreadChatCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread chat count:', error);
    }
  }, []);

  // Fetch notifications and unread chat counts with real-time updates
  useEffect(() => {
    if (!user) return;

    let socketCleanup: (() => void) | null = null;
    let mounted = true;

    // Initial fetch
    const initialFetch = async () => {
      await fetchNotifications();
      await fetchUnreadChatCount();
    };
    initialFetch();

    // Set up socket.io for real-time notifications
    import('@/lib/socket/client').then((socketModule) => {
      if (!mounted) return;
      
      const { getSocket, connectSocket } = socketModule;
      
      // Connect socket with user info
      if (user.id) {
        connectSocket(user.id, user.name || 'User', user.role || 'USER');
        const actualSocket = getSocket();
        
        // Listen for new notifications
        const notificationHandler = () => {
          if (mounted) {
            // Fetch fresh notifications when a new one arrives
            fetchNotifications();
          }
        };

        // Listen for notification events
        actualSocket.on('new-notification', notificationHandler);
        actualSocket.on('notification-update', notificationHandler);

        socketCleanup = () => {
          actualSocket?.off('new-notification', notificationHandler);
          actualSocket?.off('notification-update', notificationHandler);
        };
      }
    }).catch(() => {
      // Socket connection is optional - app works without it
      // Silently handle - polling will still work
    });

    // Poll for new notifications and chat counts every 15 seconds (faster polling)
    // This ensures updates even if socket fails
    const interval = setInterval(() => {
      if (mounted) {
        fetchNotifications();
        fetchUnreadChatCount();
      }
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (socketCleanup) {
        socketCleanup();
      }
    };
  }, [user, fetchNotifications, fetchUnreadChatCount]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showNotifications && notificationButtonRef.current) {
      const rect = notificationButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showNotifications]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);


  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
      setShowNotifications(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await secureFetch('/api/auth/logout', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success || response.ok) {
        // Clear any local state
        setNotifications([]);
        setUnreadCount(0);
        setUnreadChatCount(0);
        
        // Refresh router and redirect to login page
        router.refresh();
        router.push('/login');
      } else {
        console.error('Logout failed:', data.error);
        // Still redirect to login even if API call fails
        router.refresh();
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect to login even on error
      router.refresh();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 m-0 p-0 overflow-x-hidden">
      
      {/* SIDEBAR - Fixed position, slides in/out */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-white border-r border-stone-200
        transition-transform duration-300 ease-in-out z-40 shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col overflow-hidden">
          
          {/* Logo Section with Close Button */}
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-stone-900">Neural Threads</h2>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">Cognitive Couture</p>
              </div>
            </div>
            {/* Close Button in Sidebar */}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors lg:hidden"
              title="Close sidebar"
            >
              <X className="w-5 h-5 text-stone-700" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-stone-500">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // For Dashboard, only match exact path. For other items, match exact or sub-paths
              const isActive = item.href === '/customer' || item.href === '/designer' || item.href === '/tailor'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after clicking
                    // Check window exists to prevent SSR hydration mismatch
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-warm-light text-warm-taupe shadow-md border border-warm-apricot' 
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-warm-taupe' : 'text-stone-600'}`} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-warm-coral text-white' 
                        : 'bg-warm-coral text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-stone-200">
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors w-full"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* TOP HEADER - Only shown on main dashboard pages */}
      {isMainDashboard && (
      <header className={`
        fixed top-0 z-40 bg-white border-b border-stone-200
        transition-all duration-300 ease-in-out overflow-x-hidden
        ${sidebarOpen ? 'left-64 right-0 w-[calc(100%-16rem)]' : 'left-0 right-0 w-full'}
      `}>
        <div className={`flex items-center justify-between py-4 transition-all duration-300 ${
          sidebarOpen ? 'px-6' : 'px-8'
        }`}>
          {/* Left: Menu Button + Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu Button - ALWAYS VISIBLE */}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-stone-700" />
              ) : (
                <Menu className="w-6 h-6 text-stone-700" />
              )}
            </button>

            {/* Logo (visible when sidebar is closed) */}
            {!sidebarOpen && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <h2 className="font-serif text-lg font-semibold text-stone-900">Neural Threads</h2>
                </div>
              </div>
            )}
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-stone-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-6 h-6 text-stone-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-warm-coral rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-stone-900">
                {user?.name || 'User'}
              </span>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Notifications Dropdown - Rendered outside header to overlay properly */}
      {isMainDashboard && showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[100]"
            onClick={() => setShowNotifications(false)}
          />
          {/* Dropdown - Positioned using fixed positioning */}
          <div 
            ref={notificationRef}
            className="fixed w-80 bg-white rounded-xl shadow-2xl border border-stone-200 z-[101] max-h-96 overflow-hidden flex flex-col"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif font-semibold text-stone-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-warm-coral hover:text-warm-rose font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-600 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${
                        !notification.isRead ? 'bg-warm-light/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.isRead ? 'bg-warm-coral' : 'bg-transparent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-1 ${
                            !notification.isRead ? 'text-stone-900' : 'text-stone-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-stone-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-stone-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT - Adjusts margin based on sidebar state and header visibility */}
      <main className={`
        min-h-screen bg-stone-50
        transition-all duration-300 ease-in-out overflow-x-hidden
        ${sidebarOpen 
          ? `ml-64 ${isMainDashboard ? 'pt-24' : 'pt-0'} pl-6 pr-8` 
          : `ml-0 ${isMainDashboard ? 'pt-24' : 'pt-0'} pl-8 pr-8`
        }
        ${sidebarOpen ? 'w-[calc(100%-16rem)]' : 'w-full'}
      `}>
        <div className="w-full max-w-full box-border">
          {children}
        </div>
      </main>

      {/* Mobile Overlay - appears when sidebar is open on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
