import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

/**
 * Service-role admin client — bypasses RLS entirely.
 * ONLY use in trusted server-side contexts (Server Actions, Route Handlers).
 * NEVER expose to the browser.
 */
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

export async function getUserRoleById(userId: string): Promise<UserRole | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.role as UserRole;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  return (await getUserRoleById(userId)) === 'admin';
}
