import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  getDashboardStatsAction, 
  getProductsAction, 
  getCollectionsAction 
} from '@/lib/actions/actions';
import { AdminClient } from '@/components/admin/AdminClient';
import { Profile } from '@/types';

export const dynamic = 'force-dynamic'; // Enforce cookie validation checks dynamically

export default async function AdminPage() {
  const supabase = createClient();

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/auth/login?redirect=/admin');
  }

  // 2. Verify Authorization Role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || (profile as Profile).role !== 'admin') {
    return redirect('/');
  }

  // 3. Fetch data for admin views in parallel
  const [statsRes, productsRes, collectionsRes] = await Promise.all([
    getDashboardStatsAction(),
    getProductsAction({ status: null, limit: 100 }), // status: null fetches all statuses (draft, active, archived)
    getCollectionsAction(),
  ]);

  const stats = statsRes.data || {
    revenue: 0,
    ordersCount: 0,
    usersCount: 0,
    productsCount: 0,
    recentOrders: [],
  };
  const products = productsRes.data?.products || [];
  const collections = collectionsRes.data || [];

  return (
    <AdminClient
      initialStats={stats}
      initialProducts={products}
      initialCollections={collections}
    />
  );
}
