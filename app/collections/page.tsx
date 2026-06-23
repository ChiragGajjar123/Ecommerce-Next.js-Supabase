import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCollectionsAction } from '@/lib/actions/actions';

export const revalidate = 60; // Cache and revalidate collections every 60s

export default async function Collections() {
  const res = await getCollectionsAction();
  const collections = res.data || [];

  return (
    <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 border-b border-border pb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Our Catalog</span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground mt-1">Collections</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          Explore our range of premium, minimalist apparel designed for everyday luxury and timeless aesthetics.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No collections found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group relative aspect-[4/5] bg-muted rounded-xl overflow-hidden border border-border flex flex-col justify-end"
            >
              <Image
                src={col.cover_image || '/placeholder.png'}
                alt={col.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent z-10" />
              
              <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-base uppercase tracking-wider text-foreground">
                  {col.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
                  {col.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
