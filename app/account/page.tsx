import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrdersAction, getWishlistAction } from '@/lib/actions/actions';
import { AccountClient } from '@/components/account/AccountClient';
import { Profile } from '@/types';

export const dynamic = 'force-dynamic'; // Enforce dynamic cookies parsing

export default async function AccountPage() {
  const supabase = createClient();
  
  // Get active session user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/auth/login?redirect=/account');
  }

  // Fetch profiles, orders, and wishlist details in parallel
  const [profileRes, ordersRes, wishlistRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getOrdersAction(user.id),
    getWishlistAction(user.id),
  ]);

  if (profileRes.error || !profileRes.data) {
    // If profiles row not loaded, fallback to default profile structure
    console.error('Account page profile fetch error:', profileRes.error);
    return redirect('/');
  }

  const profile = profileRes.data as Profile;
  const orders = ordersRes.data || [];
  const wishlist = wishlistRes.data || [];

  return (
    <AccountClient
      profile={profile}
      orders={orders}
      wishlist={wishlist}
      user={user}
    />
  );
}
