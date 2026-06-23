'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { createClient } from '@/lib/supabase/client';
import { logoutAction } from '@/lib/actions/actions';
import { SideCartDrawer } from './SideCartDrawer';
import { MobileMenu } from './MobileMenu';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const router = useRouter();
  const { items, fetchCart, clearCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Fetch profile
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(p);
        fetchCart(session.user.id);
      } else {
        fetchCart(null);
      }
    };
    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(p);
        fetchCart(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        clearCart();
        fetchCart(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchCart, clearCart]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Icon */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="font-black text-xl tracking-wider text-primary uppercase select-none">
            Ecommerce
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            <Link href="/" className="hover:text-primary transition-colors text-foreground">Home</Link>
            <Link href="/collections" className="hover:text-primary transition-colors text-foreground">Collections</Link>
            <Link href="/products" className="hover:text-primary transition-colors text-foreground">Shop All</Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full border border-input bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            
            {/* Search Toggle Mobile */}
            <button className="sm:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>

            {/* Account Management Desktop */}
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  {profile?.role === 'admin' && (
                    <Button href="/admin" variant="ghost" size="sm" className="h-9 px-3 gap-2">
                      <LayoutDashboard className="w-4 h-4 text-primary" /> Admin
                    </Button>
                  )}
                  <Button href="/account" variant="ghost" size="sm" className="h-9 px-3 gap-2">
                    <User className="w-4 h-4" /> Account
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="h-9 px-3 gap-2 text-destructive hover:bg-destructive/10">
                    <LogOut className="w-4 h-4" /> Log Out
                  </Button>
                </div>
              ) : (
                <Button href="/auth/login" variant="outline" size="sm" className="h-9">
                  Login
                </Button>
              )}
            </div>

            {/* Account Icon Mobile */}
            <Link 
              href={user ? "/account" : "/auth/login"} 
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted relative cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5 text-foreground" />
              {cartQuantity > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-black text-primary-foreground flex items-center justify-center select-none animate-pulse">
                  {cartQuantity}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Side Cart Drawer */}
      <SideCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile Menu Slide */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        profile={profile}
        onLogout={handleLogout}
      />
    </>
  );
}
