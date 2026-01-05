'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  Scissors,
  MessageCircle,
  Sparkles,
  User,
  Briefcase,
  ClipboardList,
  Image,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface MobileBottomNavProps {
  role: 'customer' | 'designer' | 'tailor';
}

const customerNav: NavItem[] = [
  { href: '/customer', icon: Home, label: 'Home' },
  { href: '/customer/designers', icon: Users, label: 'Designers' },
  { href: '/customer/tailors', icon: Scissors, label: 'Tailors' },
  { href: '/customer/chats', icon: MessageCircle, label: 'Chats' },
  { href: '/customer/chatbot', icon: Sparkles, label: 'AI' },
];

const designerNav: NavItem[] = [
  { href: '/designer', icon: Home, label: 'Home' },
  { href: '/designer/portfolio', icon: Image, label: 'Portfolio' },
  { href: '/designer/chats', icon: MessageCircle, label: 'Chats' },
  { href: '/designer/requests', icon: ClipboardList, label: 'Requests' },
  { href: '/designer/settings', icon: User, label: 'Profile' },
];

const tailorNav: NavItem[] = [
  { href: '/tailor', icon: Home, label: 'Home' },
  { href: '/tailor/requests', icon: ClipboardList, label: 'Requests' },
  { href: '/tailor/sample-work', icon: Image, label: 'Work' },
  { href: '/tailor/settings', icon: User, label: 'Profile' },
];

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  
  const navItems = role === 'customer' 
    ? customerNav 
    : role === 'designer' 
    ? designerNav 
    : tailorNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== `/${role}` && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 active:text-indigo-500'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;










