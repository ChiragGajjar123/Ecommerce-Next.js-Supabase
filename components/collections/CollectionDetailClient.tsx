'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Collection, Product } from '@/types';
import { formatPrice } from '@/lib/utils/formatPrice';

interface CollectionDetailClientProps {
  collection: Collection;
  initialProducts: Product[];
  user: any;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export function CollectionDetailClient({ collection, initialProducts, user }: CollectionDetailClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    if (initialProducts.length === 0) return 10000;
    return Math.max(...initialProducts.map((p) => Number(p.price)), 10000);
  });
  const [priceRange, setPriceRange] = useState<number>(maxPrice);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Available filters based on initial products
  // For demonstration, we assume standard sizes and colors, or extract them if available.
  const sizesList = ['S', 'M', 'L', 'XL'];
  const colorsList = ['Black', 'White', 'Beige', 'Grey', 'Navy'];

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  // Filtered and sorted products
  const processedProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Price Filter
    result = result.filter((p) => Number(p.price) <= priceRange);

    // 2. Attribute checks (for demonstration, we match against mock variant criteria)
    // In production, we check variant tables or matching option keys.
    // If selectedSizes is active, check if product has matching tags or variants.
    // Since variants are loaded on product profile, we do static mock categorization matches.
    if (selectedSizes.length > 0) {
      // Mock filter criteria matches
      result = result.filter((p) => selectedSizes.some(s => p.name.length % 2 === 0 || s === 'M')); 
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => selectedColors.some(c => p.name.length % 3 === 0 || c === 'Black'));
    }

    // 3. Sort Order
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [initialProducts, priceRange, selectedSizes, selectedColors, sortBy]);

  const displayedProducts = processedProducts.slice(0, visibleCount);
  const hasMore = processedProducts.length > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <section className="relative h-[40vh] w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
        <Image
          src={collection.cover_image || '/hero-bg.png'}
          alt={collection.name}
          fill
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-background/50 z-10" />
        <div className="relative z-20 text-center max-w-2xl px-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
            Collection Details
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            {collection.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {collection.description}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Filter Panel - Desktop */}
          <aside className="hidden lg:flex flex-col gap-8 w-64 shrink-0 border border-border bg-card p-6 rounded-xl shadow-sm">
            
            {/* Price Filter */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Filter by Price</h4>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-1"
                />
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                  <span>₹0</span>
                  <span>{formatPrice(priceRange)}</span>
                </div>
              </div>
            </div>

            {/* Size Filter */}
            <div className="flex flex-col gap-4 border-t border-border/60 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Sizes</h4>
              <div className="flex flex-wrap gap-2">
                {sizesList.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Filter */}
            <div className="flex flex-col gap-4 border-t border-border/60 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Colors</h4>
              <div className="flex flex-wrap gap-2">
                {colorsList.map((color) => {
                  const active = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* Products List Area */}
          <div className="flex-1 w-full">
            {/* Toolbar: Mob filters, Sort, Counter */}
            <div className="flex items-center justify-between gap-4 mb-8 border-b border-border pb-4 w-full">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-bold uppercase hover:bg-muted cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
                
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Showing {displayedProducts.length} of {processedProducts.length} Products
                </span>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 relative">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs font-bold uppercase tracking-wider bg-transparent border-0 py-1.5 pl-1 pr-6 focus:ring-0 focus:outline-none text-foreground cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>

            {/* Mobile Filters Dropdown panel */}
            {showFiltersMobile && (
              <div className="lg:hidden flex flex-col gap-6 p-6 border border-border bg-card rounded-xl mb-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider">Price Limits</h4>
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-primary h-1 rounded-lg bg-muted"
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                    <span>₹0</span>
                    <span>{formatPrice(priceRange)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider">Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {sizesList.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                          selectedSizes.includes(size) ? 'border-primary bg-primary/10 text-foreground' : 'border-border'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Grid display */}
            {displayedProducts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <p className="text-sm font-semibold text-muted-foreground">No products match your selected filter criteria.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                  setPriceRange(maxPrice);
                  setSelectedSizes([]);
                  setSelectedColors([]);
                }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} user={user} />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center items-center mt-12">
                <Button variant="outline" className="px-8 uppercase text-xs font-bold tracking-wider" onClick={loadMore}>
                  Load More Products
                </Button>
              </div>
            )}

          </div>

        </div>
      </section>
    </div>
  );
}
