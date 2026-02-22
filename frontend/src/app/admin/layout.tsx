'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-white/10">
        <div className="container-app flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5">
              <Image src="/images/logo-white.png" alt="AncerLarins" width={32} height={32} className="h-8 w-auto" />
              <span className="text-lg font-bold text-accent">Ancer</span>
              <span className="text-lg font-bold text-white">Larins</span>
            </Link>
            <span className="text-xs bg-error/20 text-error px-2 py-0.5 rounded font-medium">ADMIN</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm">View Site</Link>
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                {user.first_name.charAt(0)}
              </div>
              <span className="text-sm text-white font-medium hidden sm:inline">{user.full_name}</span>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-white text-sm" aria-label="Log out">Logout</button>
          </div>
        </div>
      </header>

      <div className="container-app py-6">
        <div className="flex gap-8">
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-6">
              <AdminSidebar />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
