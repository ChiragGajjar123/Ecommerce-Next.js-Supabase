import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/supabase/admin';
import {
  buildLoginErrorPath,
  ROUTES,
  sanitizeInternalPath,
} from '@/lib/utils/routes';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeInternalPath(searchParams.get('next'));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next.startsWith(ROUTES.admin)) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !(await isUserAdmin(user.id))) {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}${buildLoginErrorPath(
              'Admin access is restricted to authorized staff accounts.',
              ROUTES.admin
            )}`
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to error page or root if exchange fails
  return NextResponse.redirect(
    `${origin}${buildLoginErrorPath('Could not verify credentials')}`
  );
}
