'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getDashboardStatsAction,
  getProductsAction,
  getCollectionsAction,
} from '@/lib/actions/actions';
import { AdminClient } from '@/components/admin/AdminClient';
import { Profile, Product, Collection, DashboardStats } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    ordersCount: 0,
    usersCount: 0,
    productsCount: 0,
    recentOrders: [],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const init = async () => {
      // 1. Verify Authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?redirect=/admin');
        return;
      }

      // 2. Verify Authorization Role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || (profile as Profile).role !== 'admin') {
        router.push('/');
        return;
      }

      // 3. Fetch data for admin views in parallel
      const [statsRes, productsRes, collectionsRes] = await Promise.all([
        getDashboardStatsAction(),
        getProductsAction({ status: null, limit: 100 }),
        getCollectionsAction(),
      ]);

      setStats(
        statsRes.data || {
          revenue: 0,
          ordersCount: 0,
          usersCount: 0,
          productsCount: 0,
          recentOrders: [],
        }
      );
      setProducts(productsRes.data?.products || []);
      setCollections(collectionsRes.data || []);
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
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminClient
      initialStats={stats}
      initialProducts={products}
      initialCollections={collections}
    />
  );
}
