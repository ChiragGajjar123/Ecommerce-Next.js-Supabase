You are a principal full-stack engineer and enterprise software architect specializing in advanced Next.js, Vercel cloud infrastructure, and Git-driven database orchestration. Build a production-grade, ultra-high-performance, fully-responsive e-commerce web application using the following exact stack, architecture, and dual-pipeline automation configurations. Do not skip any section. Cover every small detail.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Framework: Next.js 16.2.9 (App Router, utilizing React 19 native capabilities, Async Server Components, and Server Actions)
- Language: TypeScript (Strict mode, explicit return types everywhere, no "any" or "implicit any")
- Styling: Tailwind CSS v3/v4 stable (custom theme tokens, hardware-accelerated utility primitives, strict layout shift defenses)
- Backend/Database: Supabase (Postgres Engine + Auth + Storage + Real-Time Row-Level Security) with Direct GitHub Auto-Migrations
- State Management: Zustand (Persistent client state for cart/wishlist with optimized hydration syncing)
- Server State: TanStack React Query v5+ (For client-side caching, infinite scroll prefetching, and state synchronization)
- Forms & Validation: React Hook Form + Zod (Strict client-side schemas coupled with matching server-side Action validators)
- Payment Gateway: Razorpay (Native SDK + secure Server Action order instantiation + webhook verification signature flows)
- Images: next/image utilizing optimized Supabase CDN delivery with explicit layouts and explicit aspect ratios
- Deployment Target: Vercel (Optimized for Serverless Functions, Incremental Static Regeneration, and Native Marketplace Linkage)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERCEL-SUPABASE MARKETPLACE INTEGRATION METHOD
━━━━━━━━━━━━━━━━━━━━━━━━━━━
To completely eliminate manual copy-pasting of environment variables and eliminate configuration errors, the application setup must strictly follow this Vercel Marketplace automation flow:
1. Navigate to the Vercel Dashboard -> Integrations -> Marketplace.
2. Search for the official "Supabase" integration platform card.
3. Click "Add Integration", select your Vercel account scope, and link it directly to the exact target e-commerce repository.
4. During the authentication pop-up wizard, choose your existing Supabase organization, link it to the designated database instance, and click connect.
5. Verification: This action automatically injects and encrypts the required production keys directly into your Vercel project's settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Application Code Defense: The code architecture must directly consume these dynamically provisioned system variables without requiring a manual `.env.local` synchronization configuration step on the cloud deployment environment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZERO-MANUAL-CONFIG CI/CD PIPELINE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Single-Repo Dual Automation: The application must be backed by a single GitHub repository connected concurrently to both Vercel and Supabase.
2. Git-Driven Database Migrations: Do not write raw SQL changes directly in the Supabase production dashboard. Leverage the native Supabase GitHub integration. All structural database changes must be saved as incremental SQL files inside a top-level `/supabase/migrations/` directory. Pushing to your production branch must signal Supabase to execute and apply these migrations instantly.
3. Automated Environment Provisioning: Manual injection of environment variables inside the Vercel settings panel is strictly prohibited. Rely entirely on the native keys mapped by the marketplace connection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERCEL DEPLOYMENT & COMPILATION OPTIMIZATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Strict Build-Time Environment Safety: Use a dedicated validation schema (via Zod) to parse all required `.env` variables during the `next build` execution phase. If a required integration key or `RAZORPAY_KEY_SECRET` is absent on Vercel, fail the build immediately with an explicit error message instead of allowing a broken runtime deployment.
2. Route Segment Configurations: Explicitly declare Route Segment configs at the top of dynamic pages and layouts to tell Vercel's compiler exactly how to handle them (e.g., `export const dynamic = 'force-dynamic'` for `/checkout`, `/cart`, and `/admin`, and `export const revalidate = 60` for `/products/[slug]`).
3. Monolithic Server Action Optimization: Because all server-side operations are housed within a single monolithic `/lib/actions/actions.ts` file, ensure all heavy external dependencies (such as the Razorpay Node SDK) are lazily initialized or explicitly tree-shaken so they do not bloat the Vercel Serverless Function bundle size across unrelated actions.
4. Optimized Edge Middleware: Refine `middleware.ts` with a strict `matcher` configuration array. Prevent the middleware from executing on static assets, images (`_next/image`), and code chunks (`_next/static`) to eliminate unnecessary Vercel Edge Function invocation overhead and keep latency near zero.
5. Content-Type & Streaming Defense: Leverage Next.js 16 `<Suspense>` boundaries to allow Vercel to instantly stream the initial HTML shell to the browser via HTTP Chunked Transfer Encoding. Ensure no blocking async operations delay the primary layout shell paint.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIGH-SPEED CODING STYLE & ARCHITECTURE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Maximize Server Components: Keep client components strictly at the visual leaves. Interactivity boundaries must be isolated to individual buttons, inputs, or toggle forms to minimize hydration bundle sizes.
2. Code Splitting & Dynamic Imports: Lazy-load heavy user-interaction overlays (e.g., QuickViewModal, SideCartDrawer, MobileMenu) using Next.js `dynamic()` with a light, non-shifting placeholder skeleton.
3. Content Visibility & Layering: Utilize `content-visibility: auto` on off-screen long elements like review lists or related grids. Use CSS transform `will-change` macros strictly for performance-heavy transitions.
4. Layout Shift Protection: All custom interactive items (e.g., Image Galleries, Swatches) must have explicit, hardcoded or aspect-ratio bounded layouts to maintain a 0.00 CLS rating.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE & FOLDER STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implement this exact structure without alterations:
/app
  /admin          → Protected admin layout & dashboard views
  /auth
    /login
    /register
    /forgot-password
    /verify-email
    /reset-password
  /products
    /[slug]
  /collections
    /[slug]
  /cart
  /checkout
  /account
  /api            → Webhooks (e.g., razorpay-webhook) & absolute minimal endpoints; prefer Server Actions
/components
  /ui             → Atom design system (Button, Input, Badge, Skeleton, Modal, Toast)
  /layout         → Navbar, Footer, SideCart, MobileMenu
  /product        → ProductCard, ProductGrid, QuickViewModal, VariantSelector, ImageGallery
  /cart           → CartItem, CartSummary, SideCartDrawer
  /checkout       → CheckoutForm, OrderSummary, PaymentSection
  /admin          → AdminSidebar, DataTable, ProductForm, CollectionForm
  /home           → HeroSection, FeaturedProducts, CategoryGrid, Banner
/lib
  /supabase       → client.ts, server.ts, middleware.ts, types.ts
  /actions        → actions.ts  ← SINGLE MONOLITHIC FILE FOR ALL SERVER ACTIONS
  /hooks          → useCart.ts, useWishlist.ts, useVariant.ts
  /utils          → formatPrice.ts, slugify.ts, cn.ts
  /validations    → auth.schema.ts, product.schema.ts, checkout.schema.ts
/supabase
  /migrations     → SQL migration files for Git-driven Supabase deployment
/types
  → index.ts (All shared TypeScript interfaces, mirroring DB types cleanly)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE SCHEMA (SQL MIGRATIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write full Postgres SQL migrations to be placed in `/supabase/migrations/` with exact data types, foreign keys, triggers, and Row-Level Security (RLS) policies.

Tables to build:
- profiles 
  (id uuid references auth.users primary key, email text, full_name text, avatar_url text, role text check (role in ('customer', 'admin')) default 'customer', created_at timestamptz default now())
- products 
  (id uuid primary key default gen_random_uuid(), slug text unique, name text, description text, price numeric, compare_at_price numeric, images jsonb[], status text check (status in ('draft', 'active', 'archived')) default 'draft', collection_id uuid references collections, meta_title text, meta_description text, created_at timestamptz, updated_at timestamptz)
- product_variants 
  (id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade, name text, options jsonb, price numeric, stock integer, sku text unique, image_url text)
- collections 
  (id uuid primary key default gen_random_uuid(), slug text unique, name text, description text, cover_image text, is_featured boolean default false, sort_order integer default 0)
- cart_items 
  (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade null, session_id uuid null, product_id uuid references products, variant_id uuid references product_variants, quantity integer check (quantity > 0), created_at timestamptz)
- orders 
  (id uuid primary key default gen_random_uuid(), user_id uuid references profiles null, status text check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')) default 'pending', total numeric, subtotal numeric, shipping_cost numeric, items jsonb, shipping_address jsonb, razorpay_order_id text unique, razorpay_payment_id text unique, razorpay_signature text, created_at timestamptz default now())
- wishlist 
  (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, product_id uuid references products on delete cascade, created_at timestamptz)
- reviews 
  (id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade, user_id uuid references profiles, rating integer check (rating >= 1 and rating <= 5), body text, created_at timestamptz default now())

RLS Requirements:
- Enable RLS on all tables.
- Public read access for active products and collections.
- Authenticated user CRUD on own cart_items, wishlist, profiles, and orders.
- Global wildcard access granted to users holding role === 'admin'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH SYSTEM (SUPABASE AUTH & MIDDLEWARE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Registration: Email + password signup with Zod checking. Set a Postgres database trigger to automatically map and populate a new `profiles` row upon an `auth.users` insert.
2. Email Verification: Handle redirects gracefully via `/auth/verify-email`. The UI must include a 60-second reactive state countdown. Disable the resend UI mechanism until the countdown reaches 0 ("Resend in 47s").
3. Login: Email/password authentication paired with Google OAuth provider mapping. Implement a "Remember Me" configuration to control persistent session survival.
4. Forgot Password: User email target submission. Provide absolute mitigation against enumeration attacks by showing a generic success message even if the user profile does not exist. Throttle subsequent form requests using a 30-second client block.
5. Reset Password: Catch the verification token directly from the NextJS App routing params. Render a password formulation view guarded by a structural password validation schema (minimum 8 characters, 1 uppercase, 1 numeric character, 1 special character) backed by a responsive visual complexity meter (Weak/Fair/Strong/Very Strong).
6. Protected Routes: `middleware.ts` interceptor parsing active JWTs. Automatically intercept and route unauthenticated traffic heading to `/account` or `/checkout` directly toward `/auth/login`, attaching a query parameter target `?redirect=`. Restore the explicit route destination upon successful login.
7. Admin Guard: Verify profile roles via Server Actions or metadata verification. Instantly redirect unprivileged users attempt to reach `/admin` back to the root landscape `/`.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
SINGLE ACTIONS.TS FILE — 100% SERVER-SIDE EXECUTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exclusively expose functional backend data endpoints via a single source of truth file: `/lib/actions/actions.ts`. Direct access to Supabase via client wrappers inside functional client components is strictly forbidden. Every single action must utilize `createServerClient` from the official `@supabase/ssr` library, enforce structural Zod schemas, execute clean try/catch handling, return a typed union structure `{ data: T | null; error: string | null }`, and trigger precise target layout caching invalidations using `revalidatePath` or `revalidateTag`.

Implement these specific actions:
// Auth Actions
- loginAction(email, password)
- registerAction(email, password, fullName)
- logoutAction()
- forgotPasswordAction(email)
- resetPasswordAction(token, newPassword)
- resendVerificationAction(email)

// Product Actions
- getProductsAction(filters: {collectionId?, status?, search?, page?, limit?})
- getProductBySlugAction(slug)
- getFeaturedProductsAction(limit?)
- getRelatedProductsAction(productId, collectionId)
- createProductAction(data)
- updateProductAction(id, data)
- deleteProductAction(id)
- updateProductStatusAction(id, status)

// Collection Actions
- getCollectionsAction()
- getCollectionBySlugAction(slug)
- getFeaturedCollectionsAction()
- createCollectionAction(data)
- updateCollectionAction(id, data)
- deleteCollectionAction(id)

// Cart Actions (Server-side syncing with Zustand state)
- getCartAction(userId?, sessionId?)
- addToCartAction(productId, variantId, quantity, userId?, sessionId?)
- updateCartItemAction(cartItemId, quantity)
- removeFromCartAction(cartItemId)
- mergeGuestCartAction(sessionId, userId)

// Order & Payment Actions (Razorpay Engine Setup)
- createRazorpayOrderAction(cartId, shippingCost) → Interacts with Razorpay Node SDK to create an official order entity, return order IDs and configuration structures.
- verifyAndCreateOrderAction(razorpayOrderId, razorpayPaymentId, razorpaySignature, cartId, shippingAddress, subtotal, total) → Server-side HMAC SHA256 crypto validation matching signature against order token; if correct, maps data array layout into orders table and flushes corresponding user cart rows.
- getOrdersAction(userId)
- getOrderByIdAction(orderId)
- getAllOrdersAction(filters?)
- updateOrderStatusAction(orderId, status)

// Wishlist & Reviews Actions
- getWishlistAction(userId)
- toggleWishlistAction(userId, productId)
- getProductReviewsAction(productId)
- createReviewAction(productId, rating, body)

// Admin Dashboard Action
- getDashboardStatsAction() → Return aggregates of revenue, overall orders, total users, and product catalog counts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL PAGES — EXPECTED DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- HOMEPAGE (app/page.tsx) ---
1. Hero: Full viewport size background next/image priority loader. Title text, secondary descriptive block, and dual CTA target buttons ("Shop Now" → `/collections`, "View Sale" → `/collections/sale`).
2. Featured Collections: Horizontal touch-swipe scroll grid for mobile view, scaling elegantly into a structured 4-column layout block on desktop viewports.
3. Featured Products: 2-column layout (mobile) scaling to 4-columns (desktop). Product card must seamlessly handle: responsive image layouts, absolute item titles, exact price tags, old price striking, dynamic relative discount badges, instant overlay quick-view trigger button on pointer hover, add-to-cart call, and an instant reactive wishlist heart selector.
4. Promo Strip: Full-bleed solid background strip communicating real-time promotional info + inline CTA.
5. Testimonials & Newsletter: 3-column structural static feedback grid with relative star symbols. Bottom layout provides a secure newsletter email form firing explicit success/error messaging notifications via an atomic Toast system.

*QuickViewModal Feature:*
Opens as a clean, accessible centered structural dialog element. Contains a dedicated asset thumbnail view selector layout, short descriptions, a variant options matrix selector (automatically adjusting product price metrics and updating instant operational stock warning components), a quantity stepping button component matching absolute physical stock ceilings, an immediate Add-To-Cart option that closes the element following a 1.5s delay, and a direct hyperlink leading to the deep `/products/[slug]` routing page. Focus trap, ESC closure, and correct aria-modal attributes must be built-in.

--- COLLECTIONS & DETAIL (app/collections/ & app/collections/[slug]/) ---
- Base view renders a responsive grid displaying all parent collections, displaying high-resolution cover layouts and skeleton-loader replacements.
- Detail page renders an expressive hero banner section conveying names and description content. Includes a comprehensive sidebar filtering mechanism processing real-time sort options (Featured, Price Low-High, Price High-Low, Newest Arrivals) combined with smooth price sliders and active variant criteria checkboxes. Implement performance-tuned infinite scroll or a 'Load More' pattern with highly responsive optimistic counters.

--- PRODUCT PROFILE (app/products/[slug]/) ---
Fully pre-rendered via `generateStaticParams` coupled with a Next.js dynamic Vercel-optimized cache interval (`export const revalidate = 60`).
- Left Panel: ImageGallery providing high-resolution asset displays, multi-thumbnail selector filmstrips, localized cursor hover magnification engines, and mobile touch-swipe integrations.
- Right Panel: Breadcrumbs navigation hierarchy, structural H1 title, interactive review metrics triggering instant anchor scrolling to user comment cards, dynamic comparative pricing matrices with calculated percentage discount badges, short copy summaries, and an intuitive VariantSelector.
- Variant Selection Engine: Swatch controls for color matching; clean pills representing size choices (striking out items falling into a zero-stock layout state). Changing variant choices must reactively swap out matching prices, SKU numbers, remaining stock indicators, and display images.
- Bottom Layout: Tab-swappable container displaying raw database-driven descriptions, an absolute size specification table, global delivery constraints, a comprehensive multi-tier 5-star aggregate consumer rating calculation section, a secure user comment form, and a horizontal scrollable Related Products carousel.

--- CART & DRAWER (app/cart/ & SideCartDrawer Component) ---
- Cart route presents standard table structures across desktop views, shifting to stacked component layout models on mobile breakpoints. Handles real-time quantitative adjusting mechanisms calculating subtotal changes optimistically before server validation returns. Includes promotional coupon interface hooks.
- SideCartDrawer slides inward smoothly from the right frame whenever items are added. Displays high-resolution row items, calculated totals, and direct action buttons guiding users toward `/cart` or `/checkout`. Implements body scroll-locks on open states and dismisses instantly upon backdrop overlay selections.

--- NATIVE RAZORPAY CHECKOUT (app/checkout/) ---
Pre-checkout validation checks physical stock parameters before loading the UI. Enforces a strict two-column dashboard configuration (Inputs on Left, Order Summary Sticky Matrix on Right). Renders as forced dynamic (`export const dynamic = 'force-dynamic'`).
1. Information Intake: React Hook Form capturing User Contact, Delivery Address info, and Courier Priority levels using strict inline Zod warnings.
2. Razorpay Interface Trigger: The checkout payment button injects the official Razorpay script header (`https://checkout.razorpay.com/v1/checkout.js`) smoothly via `next/script`. Clicking the primary trigger executes the custom `createRazorpayOrderAction` action to mint a verified remote Razorpay Order entity.
3. Payment Execution: Mount the native Razorpay payment handler window on the client side using the generated transaction metadata tokens, personal details, and customized theme tokens matching the branding colors.
4. Success Pipeline: Upon successful payment authorization, capture the payment responses (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) and send them directly to `verifyAndCreateOrderAction`. On verified success, immediately redirect users to the dynamic success confirmation screen `/orders/[id]/success`.

--- ADMIN SUITE (/admin Pages & Layout) ---
Enforce a comprehensive administration layout wrapped completely inside strict server checks verifying authorization roles (`profile.role === 'admin'`).
- Dashboard: High-level metric visualization blocks processing Total Revenue, Transaction Volume, Global Customer Counts, and Active Stock items. Renders tabular data tracking the 10 most recent transactions.
- Product Inventory Table: Searchable, sortable pagination engine presenting data controls for Editing, Archiving, and Deleting (backed by strict visual verification modals), alongside bulk processing selectors.
- Product Form Engine: Advanced administration form processing fields for text titles, real-time title-to-slug serialization, description data, price rules, and dynamic image handling (multi-file drag-and-drop uploads pushing items to public Supabase Storage buckets, reorder arrays, dynamic cover assignments). It must generate variant combination grids automatically from added attributes (e.g. adding sizes S, M and colors Red, Blue generates a 4-row matrix with individual price, SKU, and stock input fields).
- Orders Management: Displays dynamic structural tabs for status categorizations (`All`, `Pending`, `Paid`, `Shipped`, `Delivered`). Includes modal overview detail views to parse delivery vectors and adjust fulfillment states via quick select inputs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCESSIBILITY & QUALITY ASSURANCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Accessibility (a11y): Ensure strict WCAG 2.1 AA compliance. Interactive element dimensions must match or exceed 44x44px touch grids. Include valid image alt tags, structural aria-labels on icon-only interactive controls, clear focus indicators, and native keyboard tab navigation support.
- TypeScript Accuracy: Zero uses of `any`. Explicitly type every async function return structure. Map full Supabase structural definitions explicitly into the `/types/index.ts` file. 
- Error Handling: Never swallow errors silently. Catch backend, database, and payment anomalies cleanly, surfacing them directly to users via clear, understandable UI notifications and error boundaries with localized retry mechanisms.