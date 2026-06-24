'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/hooks/useCart';
import { useVariant } from '@/lib/hooks/useVariant';
import { formatPrice } from '@/lib/utils/formatPrice';
import { toast } from '@/components/ui/Toast';
import { Product, ProductVariant } from '@/types';
import { getProductBySlugAction } from '@/lib/actions/actions';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export function QuickViewModal({ product, isOpen, onClose, userId }: QuickViewModalProps) {
  const { addItem } = useCart();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [activeImage, setActiveImage] = useState<string>(
    product?.images?.[0] || '/placeholder.png'
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Fetch full variants details when modal opens
  useEffect(() => {
    if (isOpen && product) {
      setLoadingVariants(true);
      setActiveImage(product.images[0] || '/placeholder.png');
      setQuantity(1);
      
      const fetchDetails = async () => {
        const res = await getProductBySlugAction(product.slug);
        if (res.data) {
          setVariants(res.data.variants);
        }
        setLoadingVariants(false);
      };
      
      fetchDetails();
    }
  }, [isOpen, product]);

  const variantHelper = useVariant(product || ({} as Product), variants);

  // Sync active image with variant image if it swaps
  useEffect(() => {
    if (variantHelper.selectedVariant?.image_url) {
      setActiveImage(variantHelper.selectedVariant.image_url);
    }
  }, [variantHelper.selectedVariant]);

  if (!isOpen || !product) return null;

  const handleAddToCart = async () => {
    setAdding(true);
    const selectedVariantId = variantHelper.selectedVariant?.id || null;
    
    await addItem(
      product.id,
      selectedVariantId,
      quantity,
      product,
      variantHelper.selectedVariant,
      userId
    );

    toast.success(`${product.name} added to cart!`);

    // Closes the element following a 1.5s delay
    setTimeout(() => {
      setAdding(false);
      onClose();
    }, 1500);
  };

  const maxStock = variantHelper.selectedVariant ? variantHelper.selectedVariant.stock : 99;
  const isOutOfStock = variants.length > 0 && variantHelper.isOutOfStock;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick View" className="max-w-3xl">
      {loadingVariants ? (
        <div className="h-96 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 px-1 grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
          {/* Images Section */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full bg-muted rounded-xl overflow-hidden border border-border">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                priority
              />
            </div>
            
            {/* Filmstrip selector */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 border transition-all cursor-pointer ${
                      activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col h-full justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">{product.name}</h2>
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(variantHelper.price)}
                </span>
                {variantHelper.compareAtPrice && variantHelper.compareAtPrice > variantHelper.price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through decoration-1">
                      {formatPrice(variantHelper.compareAtPrice)}
                    </span>
                    <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                      -{Math.round(((variantHelper.compareAtPrice - variantHelper.price) / variantHelper.compareAtPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed line-clamp-3">
                {product.description || 'No description available.'}
              </p>

              {/* Variants Selector */}
              {variants.length > 0 && (
                <div className="flex flex-col gap-4 mt-6">
                  {/* Extract unique option keys */}
                  {Array.from(new Set(variants.flatMap(v => Object.keys(v.options)))).map((key) => {
                    // Extract unique values for this key
                    const values = Array.from(new Set(variants.map(v => v.options[key])));
                    
                    return (
                      <div key={key} className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Select {key}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {values.map((val) => {
                            const isSelected = variantHelper.selectedOptions[key] === val;
                            return (
                              <button
                                key={val}
                                onClick={() => variantHelper.selectOption(key, val)}
                                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stock Warning Component */}
              <div className="mt-6">
                {isOutOfStock ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    OUT OF STOCK
                  </div>
                ) : variants.length > 0 && maxStock <= 5 ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    ONLY {maxStock} LEFT IN STOCK - ORDER SOON
                  </div>
                ) : null}
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="mt-8 border-t border-border pt-6 flex flex-col gap-4">
              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</span>
                  <div className="flex items-center border border-border rounded-lg bg-background">
                    <button
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      className="px-3.5 py-2 text-sm font-semibold hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-l-lg transition-colors cursor-pointer"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-5 py-2 text-xs font-bold text-foreground select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => quantity < maxStock && setQuantity(quantity + 1)}
                      className="px-3.5 py-2 text-sm font-semibold hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-r-lg transition-colors cursor-pointer"
                      disabled={quantity >= maxStock}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || adding}
                  isLoading={adding}
                  className="flex-1 uppercase text-xs font-bold tracking-wider gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </Button>
                
                <Button
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  variant="outline"
                  className="uppercase text-xs font-bold tracking-wider"
                >
                  Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </Modal>
  );
}
