'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Package, Heart, LogOut, User, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/lib/actions/actions';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Order, WishlistItem, Profile } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface AccountClientProps {
  profile: Profile;
  orders: Order[];
  wishlist: WishlistItem[];
  user: any;
}

export function AccountClient({ profile, orders, wishlist, user }: AccountClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
    // Sign out client-side so onAuthStateChange fires and Navbar updates
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-black select-none">
            {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase text-foreground">{profile.full_name || 'Customer'}</h1>
              {profile.role === 'admin' && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
          </div>
        </div>

        <div className="flex gap-3">
          {profile.role === 'admin' && (
            <Button href="/admin" variant="outline" size="sm" className="text-xs uppercase tracking-wider font-bold">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Dashboard
            </Button>
          )}
          <Button variant="destructive" size="sm" className="text-xs uppercase tracking-wider font-bold" onClick={handleLogout} isLoading={loggingOut}>
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left Nav */}
        <nav className="w-full lg:w-64 shrink-0 flex flex-col gap-1 border border-border bg-card p-3 rounded-xl shadow-sm select-none">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-left ${
              activeTab === 'orders'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Package className="w-4.5 h-4.5" /> Order History ({orders.length})
          </button>
          
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-left ${
              activeTab === 'wishlist'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Heart className="w-4.5 h-4.5" /> My Wishlist ({wishlist.length})
          </button>
        </nav>

        {/* Right Content */}
        <div className="flex-1 w-full">
          
          {/* 1. ORDERS TABS */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Your Orders</h2>
              
              {orders.length === 0 ? (
                <div className="py-16 border border-dashed border-border rounded-xl text-center flex flex-col items-center gap-4">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">You haven't placed any orders yet.</p>
                  <Button href="/products" size="sm" className="text-xs uppercase tracking-wider font-bold">
                    Shop Products
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                      {/* Summary Panel */}
                      <div className="px-6 py-4 bg-muted/40 border-b border-border flex flex-wrap justify-between items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[10px]">Date Placed</p>
                            <p className="text-foreground font-bold mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px]">Total Paid</p>
                            <p className="text-foreground font-bold mt-0.5">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-6 flex flex-col gap-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-center">
                            <div className="relative w-10 h-14 bg-muted rounded overflow-hidden shrink-0 border border-border">
                              {item.image_url ? (
                                <Image src={item.image_url} alt={item.name} fill sizes="40px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-foreground truncate">{item.name}</h4>
                              {item.variant_name && <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">{item.variant_name}</p>}
                              <p className="text-[9px] text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                            </div>
                            <span className="text-xs font-bold text-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. WISHLIST TABS */}
          {activeTab === 'wishlist' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Saved Items</h2>

              {wishlist.length === 0 ? (
                <div className="py-16 border border-dashed border-border rounded-xl text-center flex flex-col items-center gap-4">
                  <Heart className="w-10 h-10 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Your wishlist is empty.</p>
                  <Button href="/products" size="sm" className="text-xs uppercase tracking-wider font-bold">
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((item) => (
                    item.product && (
                      <ProductCard key={item.id} product={item.product} user={user} />
                    )
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
