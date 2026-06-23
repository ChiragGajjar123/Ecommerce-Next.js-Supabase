'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  return (
    <footer className="w-full bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <span className="font-black text-xl tracking-wider text-primary uppercase select-none">
              Ecommerce
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Crafting premium items and custom-tailored merchandise with luxury materials and minimalist design ethics.
            </p>
          </div>

          {/* Shop Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Shop</h4>
            <ul className="flex flex-col gap-2.5 text-xs font-medium text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/collections" className="hover:text-primary transition-colors">Collections</Link></li>
              <li><Link href="/collections/sale" className="hover:text-primary transition-colors">Featured Sales</Link></li>
            </ul>
          </div>

          {/* Support Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Support</h4>
            <ul className="flex flex-col gap-2.5 text-xs font-medium text-muted-foreground">
              <li><Link href="/account" className="hover:text-primary transition-colors">My Account</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition-colors">Shopping Cart</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Newsletter</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Subscribe to unlock early access, seasonal sales, and custom updates.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 px-3.5 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
              <Button type="submit" size="sm" className="h-10 text-xs uppercase tracking-wider font-bold" isLoading={loading}>
                Subscribe
              </Button>
            </form>
          </div>

        </div>

        <div className="border-t border-border/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
            &copy; {new Date().getFullYear()} ECOMMERCE INC. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
