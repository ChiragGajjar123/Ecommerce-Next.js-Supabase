'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, ShieldAlert, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { checkoutSchema, CheckoutInput } from '@/lib/validations/checkout.schema';
import { createClient } from '@/lib/supabase/client';
import { createRazorpayOrderAction, verifyAndCreateOrderAction } from '@/lib/actions/actions';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

export default function Checkout() {
  const router = useRouter();
  const { items, fetchCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchCart(session.user.id);
        
        // Pre-populate form email
        setValue('email', session.user.email || '');
      } else {
        router.push('/auth/login?redirect=/checkout');
      }
    };
    getSession();
  }, [supabase, router, fetchCart]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingMethod: 'standard' as const,
    },
  });

  const subtotal = items.reduce((acc, item) => {
    const price = item.variant?.price !== null && item.variant?.price !== undefined
      ? Number(item.variant.price)
      : Number(item.product?.price || 0);
    return acc + price * item.quantity;
  }, 0);

  const shippingCost = subtotal > 5000 ? 0 : shippingMethod === 'express' ? 350 : 150;
  const total = subtotal + shippingCost;

  const onSubmit = async (data: CheckoutInput) => {
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay order on server
      const orderRes = await createRazorpayOrderAction(items, shippingCost);
      if (orderRes.error || !orderRes.data) {
        throw new Error(orderRes.error || 'Failed to instantiate order.');
      }

      const { orderId, amount, keyId } = orderRes.data;

      // 2. Open Razorpay payment gateway options on client
      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'ECOMMERCE INC.',
        description: 'Premium Apparel Purchase',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);
            
            // 3. Verify payment signature on server and create DB order
            const verificationRes = await verifyAndCreateOrderAction(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              items,
              {
                fullName: data.fullName,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country,
                phone: data.phone,
              },
              subtotal,
              shippingCost,
              total,
              user?.id
            );

            if (verificationRes.error || !verificationRes.data) {
              toast.error(verificationRes.error || 'Verification failed. Please contact support.');
              setLoading(false);
            } else {
              toast.success('Order placed successfully!');
              // Redirect to success screen
              router.push(`/orders/${verificationRes.data.id}/success`);
            }
          } catch (err: any) {
            toast.error(err.message || 'Verification failed.');
            setLoading(false);
          }
        },
        prefill: {
          name: data.fullName,
          email: data.email,
          contact: data.phone,
        },
        theme: {
          color: '#0f5132', // Deep emerald luxury styling color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        toast.error(`Payment Failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Payment checkout initialization failed.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center gap-4">
        <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-50" />
        <p className="font-semibold text-foreground">Your cart is empty. Add items to checkout.</p>
        <Button onClick={() => router.push('/')} variant="outline" className="mt-2">
          Shop Products
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Load Razorpay script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground mb-12 border-b border-border pb-4">
          Checkout
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-start">
          
          {/* Left Panel: Delivery Information */}
          <div className="flex flex-col gap-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
              Delivery Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <Input
              label="Recipient Full Name"
              type="text"
              placeholder="John Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Street Address Line 1"
                type="text"
                placeholder="Flat / House No. / Building"
                error={errors.addressLine1?.message}
                {...register('addressLine1')}
              />
              <Input
                label="Street Address Line 2 (Optional)"
                type="text"
                placeholder="Apartment / Locality / Landmark"
                error={errors.addressLine2?.message}
                {...register('addressLine2')}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Input
                label="City"
                type="text"
                placeholder="Mumbai"
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="State / Region"
                type="text"
                placeholder="Maharashtra"
                error={errors.state?.message}
                {...register('state')}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Postal / Zip Code"
                type="text"
                placeholder="400001"
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
              <Input
                label="Country"
                type="text"
                placeholder="India"
                error={errors.country?.message}
                {...register('country')}
              />
            </div>

            {/* Courier Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Shipping Carrier Speed
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'standard', label: 'Standard Delivery', time: '3-5 Business Days', price: 150 },
                  { id: 'express', label: 'Express Carrier', time: '1-2 Business Days', price: 350 },
                ].map((carrier) => {
                  const isActive = shippingMethod === carrier.id;
                  const finalCarrierCost = subtotal > 5000 ? 0 : carrier.price;
                  return (
                    <button
                      key={carrier.id}
                      type="button"
                      onClick={() => {
                        setShippingMethod(carrier.id as any);
                        setValue('shippingMethod', carrier.id as any);
                      }}
                      className={`p-4 border rounded-xl flex flex-col items-start gap-1 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground">{carrier.label}</span>
                      <span className="text-[10px] text-muted-foreground">{carrier.time}</span>
                      <span className="text-xs font-bold text-foreground mt-2">
                        {subtotal > 5000 ? 'Complimentary' : formatPrice(carrier.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Panel: Order Summary (Sticky) */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
              Order Breakdown
            </h3>

            {/* Cart Row Items */}
            <div className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-5 max-h-[350px] overflow-y-auto">
              {items.map((item) => {
                const price = item.variant?.price !== null && item.variant?.price !== undefined
                  ? Number(item.variant.price)
                  : Number(item.product?.price || 0);

                const image = item.variant?.image_url || item.product?.images[0] || '/placeholder.png';

                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative w-12 h-16 bg-muted rounded overflow-hidden shrink-0 border border-border">
                      <Image src={image} alt={item.product?.name || 'Product'} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-foreground truncate">{item.product?.name}</h4>
                      {item.variant && <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">{item.variant.name}</p>}
                      <p className="text-[9px] text-muted-foreground font-semibold mt-1">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-foreground shrink-0">{formatPrice(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>

            {/* Calculations Box */}
            <div className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-5">
              <div className="flex flex-col gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="text-foreground font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-3">
                  <span>Shipping Cost</span>
                  <span className="text-foreground font-bold">
                    {subtotal > 5000 ? 'Complimentary' : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-bold uppercase tracking-wide pt-1 text-foreground">
                  <span>Amount Payable</span>
                  <span className="text-base font-black text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit Payment CTA */}
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full uppercase text-xs font-bold tracking-wider py-4 h-12 gap-2"
              >
                <CreditCard className="w-4 h-4" /> Pay with Razorpay
              </Button>

              {/* Security info */}
              <div className="flex gap-2 items-start text-[10px] text-muted-foreground font-bold uppercase tracking-wider bg-muted/40 p-3 rounded-lg border border-border">
                <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  By placing this order you consent to our terms. Verification token matching happens securely via HMAC SHA256.
                </span>
              </div>
            </div>

          </div>

        </form>
      </div>
    </>
  );
}
