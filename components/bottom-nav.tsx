'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, UserCircle, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: '/owner', label: 'Home', icon: Home },
    { href: '/owner?tab=neighbors', label: 'Neighbors', icon: Users },
    { href: '/owner?tab=profile', label: 'Profile', icon: UserCircle },
    { href: '/owner?tab=status', label: 'Status', icon: Activity },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.href.split('?')[0];
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
