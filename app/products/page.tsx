import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getProductsAction } from '@/lib/actions/actions';
import { ProductCard } from '@/components/product/ProductCard';
import { ArrowUpDown } from 'lucide-react';

interface ShopPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export const dynamic = 'force-dynamic'; // Run dynamic queries based on search query parameters

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { search } = await searchParams;

  // Fetch products based on search term
  const res = await getProductsAction({
    search: search || null,
    status: 'active',
    limit: 48,
  });

  const products = res.data?.products || [];

  // Get active user
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16 border-b border-border pb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Catalog Inventory</span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground mt-1">
          {search ? `Search Results for "${search}"` : 'Shop All Products'}
        </h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          Explore our range of architecturally cut apparel, curated accessories, and seasonal releases.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl">
          <p className="text-sm font-semibold text-muted-foreground">
            No products matching your request could be found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
