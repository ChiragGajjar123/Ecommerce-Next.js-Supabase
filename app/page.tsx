import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Truck, ShieldCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getFeaturedProductsAction, getFeaturedCollectionsAction } from '@/lib/actions/actions';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/utils/routes';

export const revalidate = 60; // Cache and revalidate home page every 60s

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel prefetching for catalog sections
  const [productsRes, collectionsRes] = await Promise.all([
    getFeaturedProductsAction(8),
    getFeaturedCollectionsAction(),
  ]);

  const products = productsRes.data || [];
  const collections = collectionsRes.data || [];

  return (
    <div className="w-full flex flex-col">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[85vh] w-full flex items-center justify-start bg-zinc-950 overflow-hidden">
        <Image
          src="/hero-bg.png"
          alt="Luxury fashion background"
          fill
          priority
          quality={80}
          sizes="100vw"
          className="object-cover opacity-85 select-none"
        />
        {/* Subtle glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent z-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-20 flex flex-col items-start gap-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/15 px-3 py-1 rounded-full border border-secondary/20 select-none">
            New Autumn Arrivals
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground max-w-2xl uppercase leading-none">
            Minimalist <br />
            <span className="text-secondary">Elegance</span> redefined.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
            Crafted for the modern individual who values high-end materials, architectural silhouettes, and sustainable luxury.
          </p>
          <div className="flex gap-4 mt-2">
            <Button href={ROUTES.products}>Shop Now</Button>
            <Button href={ROUTES.collections} variant="outline">View Collections</Button>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COLLECTIONS */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-end justify-between mb-10 border-b border-border pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Curated Styles</span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground mt-1">Featured Collections</h2>
          </div>
          <Link href={ROUTES.collections} className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-wider">
            All Collections <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile touch-swipe snap scroll / Desktop 4-col */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-4 md:overflow-visible">
          {collections.slice(0, 4).map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="snap-start shrink-0 w-64 md:w-full group relative aspect-[4/5] bg-muted rounded-xl overflow-hidden border border-border"
            >
              <Image
                src={col.cover_image || '/placeholder.png'}
                alt={col.name}
                fill
                sizes="(max-width: 768px) 250px, 300px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent z-10" />
              <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
                  {col.name}
                </h3>
                <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">
                  {col.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="py-16 md:py-24 border-t border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-end justify-between mb-10 border-b border-border pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seasonal Picks</span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground mt-1">Featured Products</h2>
            </div>
            <Link href={ROUTES.products} className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-wider">
              Shop All Products <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROMO STRIP */}
      <section className="w-full bg-primary text-primary-foreground py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-secondary shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">Complimentary Express Shipping</h4>
              <p className="text-xs text-primary-foreground/80 mt-0.5">On all domestic orders over ₹5,000. Apply at checkout automatically.</p>
            </div>
          </div>
          <Button href={ROUTES.products} variant="secondary" size="sm" className="uppercase text-[10px] tracking-wider font-extrabold px-6 h-9 shrink-0">
            Shop New Arrivals
          </Button>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customer Voices</span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground mt-1">Trusted Reviews</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              author: 'Aarav Mehta',
              rating: 5,
              review: 'The quality of the material is exceptional. Extremely heavyweight knit, beautiful boxy fit. It has held up perfectly after multiple washes.',
              role: 'Verified Buyer',
            },
            {
              author: 'Priya Sharma',
              rating: 5,
              review: 'Simple, understated, and gorgeous. The color accuracy matches the listing perfectly. Highly recommend their core collection items.',
              role: 'Verified Buyer',
            },
            {
              author: 'Rohan Gupta',
              rating: 5,
              review: 'Exceptional customer service. The Razorpay checkout was seamless, and the order arrived in Mumbai in under 2 days. Solid 5/5 stars.',
              role: 'Verified Buyer',
            },
          ].map((t, idx) => (
            <div key={idx} className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <div className="flex text-amber-500 gap-0.5 select-none">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-foreground leading-relaxed italic">
                  "{t.review}"
                </p>
              </div>
              <div className="mt-6 border-t border-border/60 pt-4">
                <h5 className="font-bold text-xs text-foreground uppercase">{t.author}</h5>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
