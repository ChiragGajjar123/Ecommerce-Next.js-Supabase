import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  getProductBySlugAction, 
  getProductReviewsAction, 
  getRelatedProductsAction,
  getProductsAction
} from '@/lib/actions/actions';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';

export const revalidate = 60; // Cache and revalidate product pages every 60s

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

import { createClient as createBrowserClient } from '@/lib/supabase/client';

// Generate static params for pre-rendering
export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('status', 'active')
    .limit(100);

  return (products || []).map((p) => ({
    slug: p.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // 1. Fetch product & variants
  const productRes = await getProductBySlugAction(slug);
  if (productRes.error || !productRes.data) {
    return notFound();
  }

  const { product, variants } = productRes.data;

  // 2. Fetch reviews & related products in parallel
  const [reviewsRes, relatedRes] = await Promise.all([
    getProductReviewsAction(product.id),
    getRelatedProductsAction(product.id, product.collection_id),
  ]);

  const reviews = reviewsRes.data || [];
  const relatedProducts = relatedRes.data || [];

  // 3. Fetch active user details
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ProductDetailClient
      product={product}
      variants={variants}
      initialReviews={reviews}
      relatedProducts={relatedProducts}
      user={user}
    />
  );
}
