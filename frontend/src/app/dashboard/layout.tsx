'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import NotificationBell from '@/components/dashboard/NotificationBell';
import PushNotificationSetup from '@/components/dashboard/PushNotificationSetup';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      router.push('/admin');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-primary border-b border-white/10">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-1.5">
            <Image src="/images/logo-white.png" alt="AncerLarins" width={32} height={32} className="h-8 w-auto" />
            <span className="text-lg font-bold text-accent">Ancer</span>
            <span className="text-lg font-bold text-white">Larins</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm">
              View Site
            </Link>
            <ThemeToggle />
            <NotificationBell />
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                  {user.first_name.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm text-white font-medium leading-tight">{user.full_name}</p>
                <p className="text-xs text-white/40 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-white/40 hover:text-white text-sm ml-2"
              aria-label="Log out"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container-app py-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-6">
              <DashboardSidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40" aria-label="Dashboard navigation">
        <div className="flex items-center justify-around h-16">
          {[
            { href: '/dashboard', label: 'Home', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, exact: true },
            { href: '/dashboard/listings', label: 'Listings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
            { href: '/dashboard/leads', label: 'Leads', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
            { href: '/dashboard/saved-searches', label: 'Saved', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg> },
            { href: '/dashboard/profile', label: 'Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          ].map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-0 transition-colors ${
                  isActive ? 'text-accent-dark' : 'text-text-muted'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon}
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <PushNotificationSetup />
    </div>
  );
}
