'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home, Building2, Wallet, FileText, Clock, CheckCircle, MapPin,
  Gavel, Scale, Users, ShieldCheck, ArrowDownToLine, Settings,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const ROLE_NAV: Record<string, NavItem[]> = {
  landlord: [
    { href: '/owner', label: 'My Properties', icon: Building2 },
    { href: '/owner/onboard', label: 'Add New Property', icon: Home },
    { href: '/owner?tab=sales', label: 'Pending Sales', icon: Clock },
    { href: '/owner?tab=earnings', label: 'Earnings', icon: Wallet },
    { href: '/owner?tab=withdraw', label: 'Withdraw (Paystack)', icon: ArrowDownToLine },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  chief: [
    { href: '/dashboard/chief', label: 'Pending Approvals', icon: Clock },
    { href: '/dashboard/chief?tab=history', label: 'Approved History', icon: CheckCircle },
    { href: '/dashboard/chief?tab=lands', label: 'Community Lands', icon: MapPin },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  barrister: [
    { href: '/dashboard/barrister', label: 'Assigned Cases', icon: Scale },
    { href: '/dashboard/barrister?tab=verify', label: 'Verify Documents', icon: ShieldCheck },
    { href: '/dashboard/barrister?tab=deed', label: 'Generate Deed', icon: FileText },
    { href: '/dashboard/barrister?tab=fees', label: 'Legal Fees', icon: Wallet },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  user: [
    { href: '/person', label: 'Profile', icon: Users },
    { href: '/verify', label: 'Verify Land', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
};

export function RoleSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = ROLE_NAV[role] || ROLE_NAV.user;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-muted/30 lg:block">
      <nav className="sticky top-16 space-y-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href.split('?')[0];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
