'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { toast } from '@/components/ui/Toast';
import { Product } from '@/types';
import dynamic from 'next/dynamic';

const QuickViewModal = dynamic(
  () => import('./QuickViewModal').then((mod) => mod.QuickViewModal),
  { ssr: false }
);

interface ProductCardProps {
  product: Product;
  user: any;
}

export function ProductCard({ product, user }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const discount = product.compare_at_price 
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to add items to your wishlist.');
      return;
    }
    toggleWishlist(user.id, product);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If the product has variants, open QuickView to select options
    // Let's check. Since we don't have variants info preloaded directly in the basic product object,
    // we will check if variants array might exist or default to opening QuickView modal to be safe, 
    // or fetch from server. To provide a high-end UX, let's open the QuickViewModal so they can review options and stocks!
    setIsQuickViewOpen(true);
  };

  const hasDiscount = discount > 0;
  const favorited = isInWishlist(product.id);
  const imageSrc = product.images[0] || '/placeholder.png';

  return (
    <>
      <div className="group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        
        {/* Thumbnail and Overlays */}
        <div className="relative aspect-[3/4] w-full bg-muted image-zoom-container select-none">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
            className="object-cover image-zoom-img"
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {hasDiscount && (
              <Badge variant="destructive" className="font-black text-[9px]">
                -{discount}% OFF
              </Badge>
            )}
            {product.status === 'draft' && (
              <Badge variant="outline" className="font-bold text-[9px] bg-background">
                DRAFT
              </Badge>
            )}
          </div>

          {/* Heart button */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full border border-border/10 bg-card/75 backdrop-blur-sm shadow-md transition-all duration-300 z-20 cursor-pointer",
              favorited 
                ? "text-destructive bg-destructive/10 border-destructive/20" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Add to wishlist"
          >
            <Heart className={cn("w-4.5 h-4.5", favorited && "fill-current")} />
          </button>

          {/* Dynamic Hover Action Overlay */}
          <div className="absolute inset-0 bg-background/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10">
            <button
              onClick={() => setIsQuickViewOpen(true)}
              className="p-3 bg-card border border-border rounded-full shadow-lg text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Quick View"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddToCart}
              className="p-3 bg-card border border-border rounded-full shadow-lg text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Add to Cart"
              disabled={adding}
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Info Grid */}
        <div className="p-4 flex flex-col justify-between flex-1">
          <div>
            <h3 className="font-bold text-sm tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
              <Link href={`/products/${product.slug}`}>
                {product.name}
              </Link>
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through decoration-1">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Quick View Dialog */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        userId={user?.id}
      />
    </>
  );
}
