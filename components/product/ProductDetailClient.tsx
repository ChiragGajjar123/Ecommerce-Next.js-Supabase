'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingBag, AlertTriangle, MessageSquare, ChevronRight, Share2 } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useVariant } from '@/lib/hooks/useVariant';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { formatPrice } from '@/lib/utils/formatPrice';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import { Product, ProductVariant, Review } from '@/types';
import { createReviewAction } from '@/lib/actions/actions';

interface ProductDetailClientProps {
  product: Product;
  variants: ProductVariant[];
  initialReviews: Review[];
  relatedProducts: Product[];
  user: any;
}

export function ProductDetailClient({
  product,
  variants,
  initialReviews,
  relatedProducts,
  user,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [activeImage, setActiveImage] = useState(product.images[0] || '/placeholder.png');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shipping'>('desc');
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const variantHelper = useVariant(product, variants);

  const isFavorited = isInWishlist(product.id);

  // Sync active image with variant image if it swaps
  useEffect(() => {
    if (variantHelper.selectedVariant?.image_url) {
      setActiveImage(variantHelper.selectedVariant.image_url);
    }
  }, [variantHelper.selectedVariant]);

  // Image Magnifier State
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '250%',
    });
  };
  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleAddToCart = async () => {
    setAdding(true);
    const selectedVariantId = variantHelper.selectedVariant?.id || null;
    await addItem(
      product.id,
      selectedVariantId,
      quantity,
      product,
      variantHelper.selectedVariant,
      user
    );
    toast.success('Successfully added to cart!');
    setAdding(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to submit a review.');
      return;
    }
    if (!reviewBody.trim()) {
      toast.error('Review text cannot be empty.');
      return;
    }

    setSubmittingReview(true);
    const res = await createReviewAction(product.id, rating, reviewBody);
    setSubmittingReview(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success('Review submitted successfully!');
      setReviews([res.data, ...reviews]);
      setReviewBody('');
      setRating(5);
    }
  };

  const handleWishlistToggle = () => {
    if (!user) {
      toast.info('Please log in to add items to your wishlist.');
      return;
    }
    toggleWishlist(user.id, product);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const maxStock = variantHelper.selectedVariant ? variantHelper.selectedVariant.stock : 99;
  const isOutOfStock = variants.length > 0 && variantHelper.isOutOfStock;

  return (
    <div className="w-full py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
      
      {/* Breadcrumbs */}
      <nav className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 select-none">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground truncate">{product.name}</span>
      </nav>

      {/* Main product card panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
        
        {/* Left: Image Gallery */}
        <div className="flex flex-col gap-4">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative aspect-[3/4] w-full bg-muted rounded-xl overflow-hidden border border-border cursor-zoom-in"
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
              priority
            />
            {/* Zoom element overlay */}
            <div
              style={zoomStyle}
              className="absolute inset-0 pointer-events-none bg-no-repeat rounded-xl"
            />
          </div>

          {/* Filmstrip film */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar select-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} gallery image ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Configs */}
        <div className="flex flex-col">
          <div className="border-b border-border pb-6">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">{product.name}</h1>
            
            {/* Review anchor metric */}
            <div className="flex items-center gap-4 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {averageRating && (
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-500 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <span className="text-foreground font-bold">{averageRating}</span>
                </div>
              )}
              <button 
                onClick={() => reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-primary transition-colors underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> {reviews.length} Reviews
              </button>
            </div>

            {/* Price Tags */}
            <div className="flex items-center gap-4 mt-6">
              <span className="text-xl font-bold text-foreground">
                {formatPrice(variantHelper.price)}
              </span>
              {variantHelper.compareAtPrice && variantHelper.compareAtPrice > variantHelper.price && (
                <>
                  <span className="text-sm text-muted-foreground line-through decoration-1">
                    {formatPrice(variantHelper.compareAtPrice)}
                  </span>
                  <Badge variant="destructive" className="font-black text-[9px]">
                    -{Math.round(((variantHelper.compareAtPrice - variantHelper.price) / variantHelper.compareAtPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-muted-foreground leading-relaxed py-6 border-b border-border">
            {product.description || 'No description provided.'}
          </p>

          {/* Swatch & Pill Selection */}
          {variants.length > 0 && (
            <div className="py-6 border-b border-border flex flex-col gap-6 select-none">
              {Array.from(new Set(variants.flatMap(v => Object.keys(v.options)))).map((key) => {
                const values = Array.from(new Set(variants.map(v => v.options[key])));
                const isColor = key.toLowerCase() === 'color' || key.toLowerCase() === 'colour';

                return (
                  <div key={key} className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select {key}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = variantHelper.selectedOptions[key] === val;
                        
                        // Check if this option value leads to an out-of-stock variant configuration
                        // We check: if we temporarily select this option, is the matching variant out-of-stock?
                        const tempOptions = { ...variantHelper.selectedOptions, [key]: val };
                        const matchedVariant = variants.find((variant) =>
                          Object.keys(tempOptions).every((k) => variant.options[k] === tempOptions[k])
                        );
                        const isValOutOfStock = matchedVariant && matchedVariant.stock <= 0;

                        if (isColor) {
                          return (
                            <button
                              key={val}
                              onClick={() => variantHelper.selectOption(key, val)}
                              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-primary ring-2 ring-primary/20 scale-105' 
                                  : 'border-border hover:border-muted-foreground'
                              } ${isValOutOfStock ? 'opacity-30 line-through' : ''}`}
                              title={val}
                            >
                              <span 
                                className="w-7 h-7 rounded-full border border-border" 
                                style={{ backgroundColor: val.toLowerCase() }} 
                              />
                            </button>
                          );
                        }

                        return (
                          <button
                            key={val}
                            onClick={() => variantHelper.selectOption(key, val)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                                : 'border-border hover:border-muted-foreground'
                            } ${isValOutOfStock ? 'line-through text-muted-foreground opacity-40 border-dashed' : ''}`}
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

          {/* Stock Notification */}
          <div className="py-4">
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertTriangle className="w-4 h-4" /> OUT OF STOCK
              </div>
            ) : variants.length > 0 && maxStock <= 5 ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                <AlertTriangle className="w-4 h-4" /> ONLY {maxStock} LEFT IN STOCK - ORDER SOON
              </div>
            ) : null}
          </div>

          {/* Quantity & Checkout Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {!isOutOfStock && (
              <div className="flex items-center border border-border rounded-lg bg-background w-fit">
                <button
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="px-4 py-3 text-sm font-semibold hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-l-lg transition-colors cursor-pointer"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-5 py-3 text-xs font-bold text-foreground select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => quantity < maxStock && setQuantity(quantity + 1)}
                  className="px-4 py-3 text-sm font-semibold hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-r-lg transition-colors cursor-pointer"
                  disabled={quantity >= maxStock}
                >
                  +
                </button>
              </div>
            )}

            <div className="flex-1 flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                isLoading={adding}
                className="flex-1 uppercase text-xs font-bold tracking-wider gap-2 h-12"
              >
                <ShoppingBag className="w-4.5 h-4.5" /> Add to Cart
              </Button>
              
              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                className={`uppercase text-xs font-bold tracking-wider h-12 gap-2 border px-5 ${
                  isFavorited ? 'text-destructive border-destructive/20 bg-destructive/10' : ''
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorited ? 'fill-current text-destructive' : ''}`} />
                Wishlist
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs description constraints */}
      <div className="border-t border-border pt-12 flex flex-col gap-6">
        <div className="flex border-b border-border select-none">
          {[
            { id: 'desc', label: 'Description' },
            { id: 'specs', label: 'Specifications' },
            { id: 'shipping', label: 'Shipping & Delivery' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer -mb-0.5 ${
                activeTab === tab.id 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-4 text-xs text-muted-foreground leading-relaxed">
          {activeTab === 'desc' && (
            <div className="flex flex-col gap-4">
              <p>{product.description || 'No description available.'}</p>
            </div>
          )}
          {activeTab === 'specs' && (
            <table className="max-w-md w-full border border-border text-left">
              <tbody>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 bg-muted/40 font-bold uppercase">SKU</th>
                  <td className="px-4 py-2 text-foreground font-semibold">
                    {variantHelper.selectedVariant?.sku || 'N/A'}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 bg-muted/40 font-bold uppercase">Base Price</th>
                  <td className="px-4 py-2 text-foreground font-semibold">{formatPrice(product.price)}</td>
                </tr>
                <tr>
                  <th className="px-4 py-2 bg-muted/40 font-bold uppercase">Availability</th>
                  <td className="px-4 py-2 text-foreground font-semibold">
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          {activeTab === 'shipping' && (
            <div className="flex flex-col gap-3">
              <p>Complimentary express shipping on all domestic orders within India above ₹5,000.</p>
              <p>Orders are typically processed in 24 hours and delivered in 2-4 business days.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Form & Listings */}
      <div ref={reviewsSectionRef} className="border-t border-border pt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Aggregates & Form */}
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Customer Reviews</h3>
            {averageRating ? (
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-4xl font-black text-foreground">{averageRating}</span>
                <span className="text-xs text-muted-foreground font-bold uppercase">out of 5.0</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No reviews yet. Be the first to share your experience!</p>
            )}
          </div>

          {/* Secure Review Form */}
          {user ? (
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 border border-border bg-card p-6 rounded-xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Submit Your Review</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rating</label>
                <div className="flex gap-1.5 select-none">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-amber-500 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comments</label>
                <textarea
                  required
                  rows={4}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <Button type="submit" size="sm" className="uppercase text-[10px] tracking-wider font-extrabold h-10" isLoading={submittingReview}>
                Submit Review
              </Button>
            </form>
          ) : (
            <div className="p-6 border border-border rounded-xl bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground leading-normal">
                Please log in to submit a rating and write a review.
              </p>
              <Button href="/auth/login" size="sm" variant="outline" className="mt-4 text-xs font-bold uppercase tracking-wider">
                Login
              </Button>
            </div>
          )}
        </div>

        {/* Reviews comments lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Reviews Feed ({reviews.length})</h3>
          
          {reviews.length === 0 ? (
            <div className="py-12 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
              No written reviews posted for this item.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 border border-border bg-card rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-xs text-foreground uppercase">
                        {rev.profile?.full_name || 'Customer'}
                      </h5>
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex text-amber-500 gap-0.5 select-none">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rev.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-border pt-12">
          <div className="mb-8 border-b border-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customers Also Liked</span>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground mt-1">Related Products</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} user={user} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
