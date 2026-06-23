'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Button } from '@/components/ui/Button';

interface SideCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideCartDrawer({ isOpen, onClose }: SideCartDrawerProps) {
  const { items, updateQuantity, removeItem, isLoading } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const subtotal = items.reduce((acc, item) => {
    const itemPrice = item.variant?.price !== null && item.variant?.price !== undefined
      ? Number(item.variant.price)
      : Number(item.product?.price || 0);
    return acc + itemPrice * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col z-10 animate-slide-in-right focus:outline-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-base font-bold tracking-tight uppercase flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-50" />
              <div>
                <p className="font-semibold text-foreground">Your cart is empty</p>
                <p className="text-xs text-muted-foreground mt-1">Add items to get started.</p>
              </div>
              <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const itemPrice = item.variant?.price !== null && item.variant?.price !== undefined
                ? Number(item.variant.price)
                : Number(item.product?.price || 0);

              const imageSrc = item.variant?.image_url || item.product?.images[0] || '/placeholder.png';

              return (
                <div key={item.id} className="flex gap-4 pb-6 border-b border-border/50 last:border-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                    <Image
                      src={imageSrc}
                      alt={item.product?.name || 'Product item'}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        <Link href={`/products/${item.product?.slug}`} onClick={onClose}>
                          {item.product?.name}
                        </Link>
                      </h4>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.variant.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-border rounded-lg bg-background">
                        <button
                          onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-sm font-semibold hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-l-lg transition-colors cursor-pointer"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-foreground select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-sm font-semibold hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-r-lg transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Price and Delete */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">
                          {formatPrice(itemPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-muted/30">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</span>
              <span className="text-lg font-bold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex flex-col gap-3">
              <Button href="/checkout" className="w-full" onClick={onClose}>
                Proceed to Checkout
              </Button>
              <Button href="/cart" variant="outline" className="w-full" onClick={onClose}>
                View Shopping Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
