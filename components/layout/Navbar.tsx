'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { createClient } from '@/lib/supabase/client';
import { logoutAction } from '@/lib/actions/actions';
import { SideCartDrawer } from './SideCartDrawer';
import { MobileMenu } from './MobileMenu';
import { Button } from '@/components/ui/Button';
import { Logo } from './Logo';
import { buildProductsSearchPath, ROUTES } from '@/lib/utils/routes';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { items, fetchCart, clearCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    // Also sign out client-side so onAuthStateChange fires
    // and immediately clears user state in the Navbar
    await supabase.auth.signOut();
    router.replace(ROUTES.home);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(buildProductsSearchPath(searchQuery));
    }
  };

  const cartQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left Section: Mobile Menu & Logo */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Icon */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href={ROUTES.home} className="flex items-center">
              <Logo className="h-8" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 lg:gap-8 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            <Link 
              href={ROUTES.home} 
              className={`whitespace-nowrap hover:text-primary transition-colors ${pathname === ROUTES.home ? 'text-primary' : 'text-foreground'}`}
            >
              Home
            </Link>
            <Link 
              href={ROUTES.collections} 
              className={`whitespace-nowrap hover:text-primary transition-colors ${pathname.startsWith(ROUTES.collections) ? 'text-primary' : 'text-foreground'}`}
            >
              Collections
            </Link>
            <Link 
              href={ROUTES.products} 
              className={`whitespace-nowrap hover:text-primary transition-colors ${pathname.startsWith(ROUTES.products) ? 'text-primary' : 'text-foreground'}`}
            >
              Shop All
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs w-full">
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
            
            {/* Search Toggle Mobile/Tablet */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer" 
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account Management Desktop (Full text on xl and above) */}
            <div className="hidden xl:block">
              {user ? (
                <div className="flex items-center gap-3">
                  {profile?.role === 'admin' && (
                    <Button href={ROUTES.admin} variant="ghost" size="sm" className="h-9 px-3 gap-2">
                      <LayoutDashboard className="w-4 h-4 text-primary" /> Admin
                    </Button>
                  )}
                  <Button href={ROUTES.account} variant="ghost" size="sm" className="h-9 px-3 gap-2">
                    <User className="w-4 h-4" /> Account
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="h-9 px-3 gap-2 text-destructive hover:bg-destructive/10">
                    <LogOut className="w-4 h-4" /> Log Out
                  </Button>
                </div>
              ) : (
                <Button href={ROUTES.auth.login} variant="outline" size="sm" className="h-9">
                  Login
                </Button>
              )}
            </div>

            {/* Account Management Tablet (Icon only on lg to xl) */}
            <div className="hidden lg:block xl:hidden">
              {user ? (
                <div className="flex items-center gap-1">
                  {profile?.role === 'admin' && (
                    <Button href={ROUTES.admin} variant="ghost" size="icon" className="h-9 w-9" title="Admin Dashboard">
                      <LayoutDashboard className="w-4.5 h-4.5 text-primary" />
                    </Button>
                  )}
                  <Button href={ROUTES.account} variant="ghost" size="icon" className="h-9 w-9" title="Account">
                    <User className="w-4.5 h-4.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-destructive hover:bg-destructive/10" title="Log Out">
                    <LogOut className="w-4.5 h-4.5" />
                  </Button>
                </div>
              ) : (
                <Button href={ROUTES.auth.login} variant="outline" size="icon" className="h-9 w-9" title="Login">
                  <User className="w-4.5 h-4.5" />
                </Button>
              )}
            </div>

            {/* Account Icon Mobile/Tablet */}
            <Link 
              href={user ? ROUTES.account : ROUTES.auth.login} 
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Log Out Icon Mobile/Tablet */}
            {user && (
              <button 
                onClick={handleLogout}
                className="lg:hidden p-2 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer animate-fade-in"
                aria-label="Log Out"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

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

      {/* Mobile/Tablet Search Bar Expansion (visible on viewports < lg when active) */}
      {isSearchOpen && (
        <div className="lg:hidden border-b border-border bg-card px-4 py-3 animate-fade-in select-none">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              autoFocus
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          </form>
        </div>
      )}

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
