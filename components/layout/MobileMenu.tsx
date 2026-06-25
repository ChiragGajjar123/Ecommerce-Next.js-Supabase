'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/utils/routes';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onLogout: () => void;
}

export function MobileMenu({ isOpen, onClose, user, profile, onLogout }: MobileMenuProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />

      {/* Slide drawer */}
      <div 
        className="relative w-4/5 max-w-sm h-full bg-card border-r border-border flex flex-col z-10 animate-fade-in focus:outline-none overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-card z-20 border-b border-border p-6 flex justify-between items-center">
          <span className="font-black text-lg tracking-widest text-primary uppercase">Menu</span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-6 text-sm font-bold uppercase tracking-wider p-6">
          <Link 
            href={ROUTES.home} 
            onClick={onClose} 
            className={`hover:text-primary transition-colors ${pathname === ROUTES.home ? 'text-primary' : 'text-foreground'}`}
          >
            Home
          </Link>
          <Link 
            href={ROUTES.collections} 
            onClick={onClose} 
            className={`hover:text-primary transition-colors ${pathname.startsWith(ROUTES.collections) ? 'text-primary' : 'text-foreground'}`}
          >
            Collections
          </Link>
          <Link 
            href={ROUTES.products} 
            onClick={onClose} 
            className={`hover:text-primary transition-colors ${pathname.startsWith(ROUTES.products) ? 'text-primary' : 'text-foreground'}`}
          >
            Shop All
          </Link>
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-border p-6 flex flex-col gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-2">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-extrabold select-none">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-foreground leading-none">{profile?.full_name || 'Customer'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                </div>
              </div>
              
              {profile?.role === 'admin' && (
                <Button href={ROUTES.admin} variant="outline" className="w-full justify-start gap-2 h-10 text-xs" onClick={onClose}>
                  <LayoutDashboard className="w-4 h-4" /> Admin Panel
                </Button>
              )}
              
              <Button href={ROUTES.account} variant="outline" className="w-full justify-start gap-2 h-10 text-xs" onClick={onClose}>
                <User className="w-4 h-4" /> My Account
              </Button>
              
              <Button variant="destructive" className="w-full justify-start gap-2 h-10 text-xs" onClick={() => { onLogout(); onClose(); }}>
                <LogOut className="w-4 h-4" /> Log Out
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Button href={ROUTES.auth.login} className="w-full" onClick={onClose}>
                Log In
              </Button>
              <Button href={ROUTES.auth.register} variant="outline" className="w-full" onClick={onClose}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
