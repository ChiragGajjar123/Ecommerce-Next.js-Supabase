-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COLLECTIONS TABLE
CREATE TABLE public.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    cover_image text,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. PRODUCTS TABLE
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    price numeric NOT NULL CHECK (price >= 0),
    compare_at_price numeric CHECK (compare_at_price >= 0),
    images jsonb[] DEFAULT '{}',
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
    meta_title text,
    meta_description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. PRODUCT_VARIANTS TABLE
CREATE TABLE public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g., "Red / S"
    options jsonb NOT NULL DEFAULT '{}', -- e.g., {"color": "Red", "size": "S"}
    price numeric CHECK (price >= 0), -- Override base product price if set
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku text UNIQUE,
    image_url text,
    created_at timestamptz DEFAULT now()
);

-- 4. PROFILES TABLE (linked to auth.users)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at timestamptz DEFAULT now()
);

-- Foreign key constraints linking profiles to auth.users
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_auth_users FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. CART_ITEMS TABLE
CREATE TABLE public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NULL,
    session_id uuid NULL, -- For guest carts
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamptz DEFAULT now()
);

-- 6. ORDERS TABLE
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    total numeric NOT NULL CHECK (total >= 0),
    subtotal numeric NOT NULL CHECK (subtotal >= 0),
    shipping_cost numeric NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    items jsonb NOT NULL DEFAULT '[]', -- Snapshot of ordered items
    shipping_address jsonb NOT NULL DEFAULT '{}',
    razorpay_order_id text UNIQUE,
    razorpay_payment_id text UNIQUE,
    razorpay_signature text,
    created_at timestamptz DEFAULT now()
);

-- 7. WISHLIST TABLE
CREATE TABLE public.wishlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- 8. REVIEWS TABLE
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    body text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Admin bypass validation helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ROW-LEVEL SECURITY POLICIES

-- Collections Policies
CREATE POLICY "Public read collections" ON public.collections FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD collections" ON public.collections FOR ALL TO authenticated USING (public.is_admin());

-- Products Policies
CREATE POLICY "Public read active products" ON public.products FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Admin CRUD products" ON public.products FOR ALL TO authenticated USING (public.is_admin());

-- Product Variants Policies
CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_admin());

-- Profiles Policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin CRUD profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Cart Items Policies
CREATE POLICY "Users access own cart items" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Public access guest cart items" ON public.cart_items FOR ALL TO public USING (user_id IS NULL AND session_id IS NOT NULL);

-- Orders Policies
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Public insert guest orders" ON public.orders FOR INSERT TO public WITH CHECK (user_id IS NULL);
CREATE POLICY "Admin CRUD orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin());

-- Wishlist Policies
CREATE POLICY "Users access own wishlist" ON public.wishlist FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Reviews Policies
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users write own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin CRUD reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin());

-- 10. AUTH TRIGGER TO CREATE PROFILE AUTOMATICALLY
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
