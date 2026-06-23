'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ArrowLeft, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

export default function Cart() {
  const { items, updateQuantity, removeItem, isLoading, fetchCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchCart(session.user.id);
      } else {
        fetchCart(null);
      }
    };
    checkUser();
  }, [fetchCart]);

  const subtotal = items.reduce((acc, item) => {
    const price = item.variant?.price !== null && item.variant?.price !== undefined
      ? Number(item.variant.price)
      : Number(item.product?.price || 0);
    return acc + price * item.quantity;
  }, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;

    if (couponCode.toUpperCase() === 'WELCOME10') {
      const disc = Math.round(subtotal * 0.10);
      setDiscountAmount(disc);
      setCouponApplied(true);
      toast.success('10% Welcome Discount applied!');
    } else {
      toast.error('Invalid coupon code.');
    }
  };

  const shippingCost = subtotal > 5000 || subtotal === 0 ? 0 : 250;
  const total = subtotal - discountAmount + shippingCost;

  if (items.length === 0) {
    return (
      <div className="flex-1 max-w-2xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-60">
          <Trash2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-foreground">Your Cart is Empty</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Looks like you haven't added anything to your cart yet. Explore our latest collections.
          </p>
        </div>
        <Button href="/products" variant="outline" className="uppercase text-xs font-bold tracking-wider mt-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-black uppercase tracking-tight text-foreground mb-12 border-b border-border pb-4">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Cart list section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Desktop Table View */}
          <div className="hidden md:block w-full overflow-hidden border border-border rounded-xl bg-card shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const price = item.variant?.price !== null && item.variant?.price !== undefined
                    ? Number(item.variant.price)
                    : Number(item.product?.price || 0);

                  const image = item.variant?.image_url || item.product?.images[0] || '/placeholder.png';

                  return (
                    <tr key={item.id} className="border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-6 flex gap-4 items-center">
                        <div className="relative w-16 h-20 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                          <Image src={image} alt={item.product?.name || 'Product'} fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">
                            <Link href={`/products/${item.product?.slug}`} className="hover:text-primary transition-colors">
                              {item.product?.name}
                            </Link>
                          </h3>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.variant.name}</p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="flex items-center border border-border rounded-lg bg-background w-fit">
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
                      </td>

                      <td className="px-6 py-6 text-right font-bold text-sm text-foreground">
                        {formatPrice(price * item.quantity)}
                      </td>

                      <td className="px-6 py-6 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked View */}
          <div className="flex flex-col gap-4 md:hidden">
            {items.map((item) => {
              const price = item.variant?.price !== null && item.variant?.price !== undefined
                ? Number(item.variant.price)
                : Number(item.product?.price || 0);

              const image = item.variant?.image_url || item.product?.images[0] || '/placeholder.png';

              return (
                <div key={item.id} className="flex gap-4 p-4 border border-border bg-card rounded-xl shadow-sm">
                  <div className="relative w-20 h-24 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                    <Image src={image} alt={item.product?.name || 'Product'} fill sizes="80px" className="object-cover" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-xs text-foreground line-clamp-2">
                          <Link href={`/products/${item.product?.slug}`}>
                            {item.product?.name}
                          </Link>
                        </h3>
                        {item.variant && (
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{item.variant.name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center border border-border rounded-lg bg-background">
                        <button
                          onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs hover:bg-muted text-muted-foreground cursor-pointer"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-0.5 text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs hover:bg-muted text-muted-foreground cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Back button */}
          <Link href="/products" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 uppercase tracking-wider mt-4">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {/* Order Summary sidebar */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* Summary Box */}
          <div className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
              Order Summary
            </h3>
            
            <div className="flex flex-col gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground font-bold">{formatPrice(subtotal)}</span>
              </div>
              
              {couponApplied && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-border/60 pb-3">
                <span>Shipping</span>
                <span className="text-foreground font-bold">
                  {shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)}
                </span>
              </div>
              
              <div className="flex justify-between items-baseline text-sm font-bold uppercase tracking-wide pt-1 text-foreground">
                <span>Total</span>
                <span className="text-base font-black text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Button href="/checkout" className="w-full uppercase text-xs font-bold tracking-wider py-4 h-12">
              Proceed to Checkout
            </Button>

            {/* Info Badge */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider justify-center bg-muted/40 p-3 rounded-lg border border-border">
              <ShieldCheck className="w-4.5 h-4.5 text-primary shrink-0" />
              Secure payments via Razorpay
            </div>
          </div>

          {/* Coupon Code Input */}
          <form onSubmit={handleApplyCoupon} className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-primary" /> Promo Code
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied}
                className="flex-1 h-10 px-3.5 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground uppercase focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button type="submit" size="sm" variant="outline" className="h-10 text-xs tracking-wider" disabled={couponApplied}>
                Apply
              </Button>
            </div>
            {couponApplied && (
              <p className="text-[10px] text-primary font-bold uppercase">Promo code active.</p>
            )}
          </form>

        </div>

      </div>
    </div>
  );
}
