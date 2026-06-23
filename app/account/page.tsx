'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getOrdersAction, getWishlistAction } from '@/lib/actions/actions';
import { AccountClient } from '@/components/account/AccountClient';
import { Profile, Order, WishlistItem } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      // 1. Get active session user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth/login?redirect=/account');
        return;
      }
      setUser(currentUser);

      // 2. Fetch profile, orders, and wishlist in parallel
      const [profileRes, ordersRes, wishlistRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
        getOrdersAction(currentUser.id),
        getWishlistAction(currentUser.id),
      ]);

      if (profileRes.error || !profileRes.data) {
        console.error('Account page profile fetch error:', profileRes.error);
        router.push('/');
        return;
      }

      setProfile(profileRes.data as Profile);
      setOrders(ordersRes.data || []);
      setWishlist(wishlistRes.data || []);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Loading your account…
          </p>
        </div>
      </div>
    );
  }

  if (!profile || !user) return null;

  return (
    <AccountClient
      profile={profile}
      orders={orders}
      wishlist={wishlist}
      user={user}
    />
  );
}
