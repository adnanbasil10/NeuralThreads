'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  Scissors,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  Shirt,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Image,
  ClipboardList,
  User,
} from 'lucide-react';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface ResponsiveSidebarProps {
  role: 'customer' | 'designer' | 'tailor';
  userName?: string;
  onLogout?: () => void;
}

const customerNav: NavItem[] = [
  { href: '/customer', icon: Home, label: 'Dashboard' },
  { href: '/customer/designers', icon: Users, label: 'Browse Designers' },
  { href: '/customer/tailors', icon: Scissors, label: 'Find Tailors' },
  { href: '/customer/chats', icon: MessageCircle, label: 'My Chats' },
  { href: '/customer/chatbot', icon: Sparkles, label: 'AI Stylist' },
  { href: '/customer/wardrobe', icon: ShoppingBag, label: 'My Wardrobe' },
  { href: '/customer/settings', icon: Settings, label: 'Settings' },
];

const designerNav: NavItem[] = [
  { href: '/designer', icon: Home, label: 'Dashboard' },
  { href: '/designer/portfolio', icon: Image, label: 'My Portfolio' },
  { href: '/designer/chats', icon: MessageCircle, label: 'Chat with Customers' },
  { href: '/designer/requests', icon: ClipboardList, label: 'Requests & Orders' },
  { href: '/designer/settings', icon: User, label: 'Profile Settings' },
];

const tailorNav: NavItem[] = [
  { href: '/tailor', icon: Home, label: 'Dashboard' },
  { href: '/tailor/requests', icon: ClipboardList, label: 'Alteration Requests' },
  { href: '/tailor/sample-work', icon: Image, label: 'My Sample Work' },
  { href: '/tailor/settings', icon: User, label: 'Profile Settings' },
];

export function ResponsiveSidebar({ role, userName, onLogout }: ResponsiveSidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = role === 'customer' 
    ? customerNav 
    : role === 'designer' 
    ? designerNav 
    : tailorNav;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // Auto-collapse on tablet
  useEffect(() => {
    if (isTablet) {
      setIsCollapsed(true);
    } else if (!isMobile) {
      setIsCollapsed(false);
    }
  }, [isTablet, isMobile]);

  // Mobile: hidden by default, show with hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">Neural Threads</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* User info */}
            {userName && (
              <div className="p-4 border-b">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="font-semibold text-gray-900">{userName}</p>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== `/${role}` && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors min-h-[48px]"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop/Tablet sidebar
  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b h-16`}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Neural Threads</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-transform ${
            isCollapsed ? 'rotate-180 mt-4' : ''
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* User info */}
      {userName && !isCollapsed && (
        <div className="p-4 border-b">
          <p className="text-xs text-gray-500">Welcome back,</p>
          <p className="font-semibold text-gray-900 truncate">{userName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== `/${role}` && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default ResponsiveSidebar;




