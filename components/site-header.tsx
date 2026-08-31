'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogOut, LayoutDashboard, Menu, X, Settings, Globe2, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLogo } from '@/lib/logo-context';
import { Language, useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';

export function SiteHeader() {
  const { profile, signOut } = useAuth();
  const { logoUrl } = useLogo();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const labels = {
    en: { home: 'Home', land: 'Verify Land', person: 'Verify Person', pricing: 'Documenting', dashboard: 'Dashboard', settings: 'Settings', signOut: 'Sign Out', signIn: 'Sign In', getStarted: 'Get Started' },
    ha: { home: 'Gida', land: 'Tabbatar da Fili', person: 'Tabbatar da Mutum', pricing: 'Takaddun', dashboard: 'Allon aiki', settings: 'Saituna', signOut: 'Fita', signIn: 'Shiga', getStarted: 'Fara' },
    yo: { home: 'Ìbẹ̀rẹ̀', land: 'Ṣàyẹ̀wò Ilẹ̀', person: 'Ṣàyẹ̀wò Ènìyàn', pricing: 'Ìwé', dashboard: 'Pẹpẹ iṣẹ́', settings: 'Ètò', signOut: 'Jáde', signIn: 'Wọlé', getStarted: 'Bẹ̀rẹ̀' },
  }[language];

  const navLinks = [
    { href: '/', label: labels.home },
    { href: '/verify', label: labels.land },
    { href: '/person', label: labels.person },
    { href: '/pricing', label: labels.pricing },
  ];

  function LanguageToggle() {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-1" aria-label="Choose language">
        <Globe2 size={15} className="ml-1 text-muted-foreground" />
        {(['en', 'ha', 'yo'] as Language[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            className={cn('rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors', language === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
            aria-pressed={language === option}
          >
            {option === 'ha' ? 'Hausa' : option === 'yo' ? 'Yorùbá' : 'EN'}
          </button>
        ))}
      </div>
    );
  }

  function ThemeToggle() {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-1.5 transition-colors hover:bg-muted"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={16} className="text-muted-foreground" /> : <Sun size={16} className="text-amber-500" />}
      </button>
    );
  }

  const dashboardLink = profile?.role === 'admin' ? '/dashboard/admin'
    : profile?.role === 'bank' ? '/dashboard/bank'
    : profile?.role === 'agent' ? '/dashboard/agent'
    : profile?.role === 'state' ? '/dashboard/state'
    : profile?.role === 'chief' ? '/dashboard/chief'
    : profile?.role === 'barrister' ? '/dashboard/barrister'
    : profile?.role === 'landlord' ? '/dashboard/landlord'
    : profile?.role === 'developer' ? '/dashboard/developer'
    : profile?.role === 'user' ? '/person'
    : '/owner';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {logoUrl ? (
            <img src={logoUrl} alt="DeedChainify" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck size={20} />
            </div>
          )}
          <span className="font-jakarta">DeedChainify</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageToggle />
          {profile ? (
            <>
              <Link href={dashboardLink}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard size={16} className="mr-1.5" />
                  {labels.dashboard}
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings size={16} className="mr-1.5" />
                  {labels.settings}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut size={16} className="mr-1.5" />
                {labels.signOut}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">{labels.signIn}</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">{labels.getStarted}</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link href={dashboardLink} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <LayoutDashboard size={16} className="mr-1.5" />
                    {labels.dashboard}
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Settings size={16} className="mr-1.5" />
                    {labels.settings}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut} className="w-full justify-start">
                  <LogOut size={16} className="mr-1.5" />
                  {labels.signOut}
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">{labels.signIn}</Button>
                </Link>
                <Link href="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">{labels.getStarted}</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
