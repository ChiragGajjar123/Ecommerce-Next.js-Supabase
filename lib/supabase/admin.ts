import { createClient } from '@supabase/supabase-js';

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
