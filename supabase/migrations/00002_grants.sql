-- Explicitly grant permissions to authenticated and anon roles on all tables
-- This prevents table-level permission denied errors (42501) prior to RLS execution.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated, service_role;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.collections TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT ON public.reviews TO anon;

-- Grant usage on sequences so IDs can be generated/incremented
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
