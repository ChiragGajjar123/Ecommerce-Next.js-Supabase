-- =========================================================================
-- 1. SEED SAMPLE COLLECTIONS
-- =========================================================================

INSERT INTO public.collections (id, slug, name, description, cover_image, is_featured, sort_order)
VALUES 
(
    'c1111111-1111-1111-1111-111111111111',
    'essential-wear',
    'Essential Wear',
    'Premium everyday basics engineered from high-grade organic cotton.',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    true,
    1
),
(
    'c2222222-2222-2222-2222-222222222222',
    'outerwear',
    'Minimalist Outerwear',
    'Windproof and water-resistant layers with tailored clean-cut fits.',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    true,
    2
),
(
    'c3333333-3333-3333-3333-333333333333',
    'accessories',
    'Curated Accessories',
    'Finely crafted leather goods and accessories designed for modern utility.',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    false,
    3
)
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- 2. SEED SAMPLE PRODUCTS
-- =========================================================================

-- Product 1: Classic Tee (Essential Wear)
INSERT INTO public.products (id, slug, name, description, price, compare_at_price, images, status, collection_id, meta_title, meta_description)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'minimalist-cotton-tee',
    'Minimalist Organic Cotton Tee',
    'A premium heavy-weight t-shirt crafted from 100% organic cotton. Features a relaxed tailored fit, robust ribbed crewneck, and double-needle clean stitching. Breathable, durable, and exceptionally soft for everyday high-end comfort.',
    1499.00,
    1999.00,
    ARRAY['"https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"']::jsonb[],
    'active',
    'c1111111-1111-1111-1111-111111111111',
    'Minimalist Organic Cotton Tee | Luxury Curated Apparel',
    'Shop our heavy-weight organic cotton tee. Tailored premium fit and sustainable comfort.'
)
ON CONFLICT (id) DO NOTHING;

-- Variants for Product 1
INSERT INTO public.product_variants (id, product_id, name, options, price, stock, sku, image_url)
VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Black / S', '{"color": "Black", "size": "S"}', 1499.00, 15, 'TEE-BLK-S', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'),
('b1111112-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Black / M', '{"color": "Black", "size": "M"}', 1499.00, 30, 'TEE-BLK-M', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'),
('b1111113-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Black / L', '{"color": "Black", "size": "L"}', 1599.00, 20, 'TEE-BLK-L', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;


-- Product 2: Bomber Jacket (Outerwear)
INSERT INTO public.products (id, slug, name, description, price, compare_at_price, images, status, collection_id, meta_title, meta_description)
VALUES
(
    'a2222222-2222-2222-2222-222222222222',
    'tailored-bomber-jacket',
    'Tailored Technical Bomber Jacket',
    'An ultra-clean minimalist bomber jacket featuring water-repellent matte technical fabric, premium YKK custom metallic zippers, and comfortable ribbed cuffs. Fully lined with lightweight thermal insulation. A sleek profile built to endure transitional seasons.',
    4999.00,
    6499.00,
    ARRAY['"https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"']::jsonb[],
    'active',
    'c2222222-2222-2222-2222-222222222222',
    'Tailored Technical Bomber Jacket | Luxury Curated Apparel',
    'Discover our water-repellent matte technical bomber jacket. Luxury tailoring for cold climates.'
)
ON CONFLICT (id) DO NOTHING;

-- Variants for Product 2
INSERT INTO public.product_variants (id, product_id, name, options, price, stock, sku, image_url)
VALUES
('b2222221-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Olive / M', '{"color": "Olive", "size": "M"}', 4999.00, 10, 'BOM-OLV-M', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'),
('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Olive / L', '{"color": "Olive", "size": "L"}', 4999.00, 12, 'BOM-OLV-L', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;


-- Product 3: Leather Backpack (Accessories)
INSERT INTO public.products (id, slug, name, description, price, compare_at_price, images, status, collection_id, meta_title, meta_description)
VALUES
(
    'a3333333-3333-3333-3333-333333333333',
    'classic-leather-backpack',
    'Full-Grain Classic Leather Backpack',
    'Handcrafted from high-end full-grain veg-tanned leather, this backpack offers a dedicated padded 16-inch laptop compartment, solid brass hardware, and heavy-duty adjustable shoulder straps. Gets a beautiful, rich natural patina over time.',
    7999.00,
    9999.00,
    ARRAY['"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"']::jsonb[],
    'active',
    'c3333333-3333-3333-3333-333333333333',
    'Full-Grain Classic Leather Backpack | Luxury Curated Apparel',
    'Premium handcrafted leather backpack with a dedicated laptop compartment.'
)
ON CONFLICT (id) DO NOTHING;

-- Variants for Product 3
INSERT INTO public.product_variants (id, product_id, name, options, price, stock, sku, image_url)
VALUES
('b3333331-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Tan / O.S.', '{"color": "Tan", "size": "O.S."}', 7999.00, 8, 'BPK-TAN-OS', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;
