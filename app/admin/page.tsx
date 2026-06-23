import { redirect } from 'next/navigation';
import {
  getDashboardStatsAction,
  getProductsAction,
  getCollectionsAction,
} from '@/lib/actions/actions';
import { AdminClient } from '@/components/admin/AdminClient';
import { createClient } from '@/lib/supabase/server';
import { buildLoginRedirectPath, ROUTES } from '@/lib/utils/routes';
import type { DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

const emptyStats: DashboardStats = {
  revenue: 0,
  ordersCount: 0,
  usersCount: 0,
  productsCount: 0,
  recentOrders: [],
};

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirectPath(ROUTES.admin));
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect(ROUTES.home);
  }

  const [statsRes, productsRes, collectionsRes] = await Promise.all([
    getDashboardStatsAction(),
    getProductsAction({ status: null, limit: 100 }),
    getCollectionsAction(),
  ]);

  return (
    <AdminClient
      initialStats={statsRes.data || emptyStats}
      initialProducts={productsRes.data?.products || []}
      initialCollections={collectionsRes.data || []}
    />
  );
}
