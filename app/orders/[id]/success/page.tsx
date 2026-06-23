import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle2, Package, Calendar, Home } from 'lucide-react';
import { getOrderByIdAction } from '@/lib/actions/actions';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ROUTES } from '@/lib/utils/routes';
import { Button } from '@/components/ui/Button';

interface OrderSuccessProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderSuccess({ params }: OrderSuccessProps) {
  const { id } = await params;
  
  // Fetch order details
  const res = await getOrderByIdAction(id);
  if (!res.data) {
    return notFound();
  }

  const order = res.data;

  return (
    <div className="flex-1 max-w-3xl mx-auto px-4 py-16 md:py-24 flex flex-col gap-10">
      
      {/* Success Badge */}
      <div className="flex flex-col items-center text-center gap-4 bg-card border border-border p-8 rounded-xl shadow-sm">
        <CheckCircle2 className="w-16 h-16 text-primary animate-pulse" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Payment Complete</span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground mt-1">Thank You For Your Order</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Your payment has been verified. We have sent an email invoice and order confirmation to your address.
          </p>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Order Info */}
        <div className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Order Information
          </h3>
          <div className="flex flex-col gap-2.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <div className="flex justify-between">
              <span>Order ID</span>
              <span className="text-foreground font-bold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment ID</span>
              <span className="text-foreground font-bold">{order.razorpay_payment_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-primary font-bold">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Placed On</span>
              <span className="text-foreground font-bold">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" /> Shipping Destination
          </h3>
          <div className="text-xs font-medium text-muted-foreground leading-relaxed flex flex-col gap-1">
            <p className="font-bold text-foreground">{order.shipping_address.fullName}</p>
            <p>{order.shipping_address.addressLine1}</p>
            {order.shipping_address.addressLine2 && <p>{order.shipping_address.addressLine2}</p>}
            <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postalCode}</p>
            <p>{order.shipping_address.country}</p>
            <p className="mt-2 text-foreground font-bold">Phone: {order.shipping_address.phone}</p>
          </div>
        </div>

      </div>

      {/* Items Breakdown */}
      <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-muted/40 border-b border-border flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Items Ordered</h3>
        </div>
        <div className="p-6 flex flex-col gap-6">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center">
              <div className="relative w-12 h-16 bg-muted rounded overflow-hidden shrink-0 border border-border">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-foreground truncate">{item.name}</h4>
                {item.variant_name && <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{item.variant_name}</p>}
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">Qty: {item.quantity}</p>
              </div>
              <span className="text-xs font-bold text-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        
        {/* Cost breakdown */}
        <div className="px-6 py-6 border-t border-border bg-muted/20 flex flex-col gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-foreground font-bold">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-foreground font-bold">
              {order.shipping_cost === 0 ? 'Complimentary' : formatPrice(order.shipping_cost)}
            </span>
          </div>
          <div className="flex justify-between items-baseline text-sm font-bold uppercase tracking-wide pt-2 border-t border-border/60 text-foreground">
            <span>Amount Paid</span>
            <span className="text-base font-black text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex justify-center gap-4">
        <Button href={ROUTES.home} variant="outline" className="px-8 uppercase text-xs font-bold tracking-wider">
          Back To Home
        </Button>
        <Button href={ROUTES.account} className="px-8 uppercase text-xs font-bold tracking-wider">
          View Orders
        </Button>
      </div>

    </div>
  );
}
