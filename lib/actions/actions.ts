'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth.schema';
import { productSchema, collectionSchema, reviewSchema } from '@/lib/validations/product.schema';
import { checkoutSchema } from '@/lib/validations/checkout.schema';
import { 
  ActionResult, 
  Profile, 
  Product, 
  Collection, 
  CartItem, 
  Order, 
  WishlistItem, 
  Review, 
  DashboardStats,
  OrderStatus,
  ProductStatus,
  OrderItem,
  ShippingAddress
} from '@/types';

// ==========================================
// 1. AUTH ACTIONS
// ==========================================

export async function loginAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult<{ user: any; profile: Profile }>> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'true';

  const validation = loginSchema.safeParse({ email, password, rememberMe });
  if (!validation.success) {
    return { data: null, error: validation.error.issues[0].message };
  }

  const isEnvAdmin =
    process.env.ADMIN_EMAIL &&
    email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  // Handle environment-configured admin
  if (isEnvAdmin) {
    if (process.env.ADMIN_PASSWORD && password !== process.env.ADMIN_PASSWORD) {
      return { data: null, error: 'Invalid admin credentials.' };
    }

    const adminClient = createAdminClient();

    // Check if the user already exists in auth
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const existingUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!existingUser) {
      // Auto-create confirmed admin user in auth
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Admin User' },
      });

      if (createError) {
        return { data: null, error: `Failed to auto-create admin user: ${createError.message}` };
      }

      if (newUserData.user) {
        // Upsert their profile with 'admin' role
        await adminClient.from('profiles').upsert({
          id: newUserData.user.id,
          email,
          full_name: 'Admin User',
          role: 'admin',
        });
      }
    } else {
      // Ensure existing user's profile is updated to admin role
      await adminClient.from('profiles').upsert({
        id: existingUser.id,
        email,
        full_name: existingUser.user_metadata?.full_name || 'Admin User',
        role: 'admin',
      });
    }
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return { data: null, error: 'Failed to fetch user profile.' };
  }

  return { data: { user: data.user, profile: profile as Profile }, error: null };
}

export async function registerAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult<{ user: any; email: string }>> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const fullName = formData.get('fullName') as string;

  const validation = registerSchema.safeParse({ email, password, confirmPassword, fullName });
  if (!validation.success) {
    return { data: null, error: validation.error.issues[0].message };
  }

  const isEnvAdmin =
    process.env.ADMIN_EMAIL &&
    email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  // Enforce password match if registering the configured admin email
  if (isEnvAdmin && process.env.ADMIN_PASSWORD && password !== process.env.ADMIN_PASSWORD) {
    return { data: null, error: 'Password does not match the configured admin password.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data.user) {
    return { data: null, error: 'Registration failed. Please try again.' };
  }

  const role = isEnvAdmin ? 'admin' : 'customer';

  // Manually upsert the profile row as a safety fallback in case
  // the DB trigger (on_auth_user_created) hasn't executed yet.
  const adminClient = createAdminClient();
  await adminClient.from('profiles').upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  return { data: { user: data.user, email }, error: null };
}


export async function logoutAction(): Promise<ActionResult<boolean>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: true, error: null };
}

export async function forgotPasswordAction(
  email: string
): Promise<ActionResult<boolean>> {
  const validation = forgotPasswordSchema.safeParse({ email });
  if (!validation.success) {
    return { data: null, error: validation.error.issues[0].message };
  }

  // Use the admin (service-role) client to bypass RLS so we can
  // check email existence even when the caller is unauthenticated.
  const adminClient = createAdminClient();

  // Step 1: Check if the email exists in auth.users via the admin API
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error('Admin listUsers error:', listError);
    return { data: null, error: 'Something went wrong. Please try again.' };
  }

  const userExists = usersData.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!userExists) {
    return {
      data: null,
      error: 'No account found with this email address. Please check and try again.',
    };
  }

  // Step 2: Email confirmed — send the password reset link
  const supabase = createClient();
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (resetError) {
    console.error('Forgot password error:', resetError);
    return { data: null, error: resetError.message };
  }

  return { data: true, error: null };
}

export async function resetPasswordAction(
  code: string,
  passwordForm: any
): Promise<ActionResult<boolean>> {
  const validation = resetPasswordSchema.safeParse(passwordForm);
  if (!validation.success) {
    return { data: null, error: validation.error.issues[0].message };
  }

  const supabase = createClient();

  // Exchange recovery code for session first
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError) {
    return { data: null, error: 'Password reset link is invalid or has expired.' };
  }

  // Update password in the session
  const { error: updateError } = await supabase.auth.updateUser({
    password: passwordForm.password,
  });

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: true, error: null };
}

export async function resendVerificationAction(
  email: string
): Promise<ActionResult<boolean>> {
  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/login`,
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}


// ==========================================
// 2. PRODUCT ACTIONS
// ==========================================

export async function getProductsAction(filters: {
  collectionId?: string | null;
  status?: ProductStatus | null;
  search?: string | null;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ products: Product[]; totalCount: number }>> {
  try {
    const supabase = createClient();
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (filters.collectionId) {
      query = query.eq('collection_id', filters.collectionId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'active'); // Default to active products for public view
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: {
        products: (data || []) as Product[],
        totalCount: count || 0,
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getProductBySlugAction(
  slug: string
): Promise<ActionResult<{ product: Product; variants: any[] }>> {
  try {
    const supabase = createClient();
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (productError || !product) {
      return { data: null, error: 'Product not found.' };
    }

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id);

    if (variantsError) throw variantsError;

    return {
      data: {
        product: product as Product,
        variants: variants || [],
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getFeaturedProductsAction(
  limit: number = 8
): Promise<ActionResult<Product[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as Product[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getRelatedProductsAction(
  productId: string,
  collectionId: string | null
): Promise<ActionResult<Product[]>> {
  try {
    if (!collectionId) return { data: [], error: null };
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('status', 'active')
      .neq('id', productId)
      .limit(4);

    if (error) throw error;

    return { data: data as Product[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createProductAction(
  data: any
): Promise<ActionResult<Product>> {
  try {
    const validation = productSchema.safeParse(data);
    if (!validation.success) {
      return { data: null, error: validation.error.issues[0].message };
    }

    const supabase = createClient();
    const { variants, ...productData } = validation.data;

    // Insert Product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        ...productData,
        images: productData.images as any[],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (productError || !product) throw productError;

    // Insert Variants if they exist
    if (variants && variants.length > 0) {
      const variantsWithProductId = variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        options: v.options,
        price: v.price || null,
        stock: v.stock,
        sku: v.sku,
        image_url: v.imageUrl || null,
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantsWithProductId);

      if (variantError) throw variantError;
    }

    revalidatePath('/products');
    return { data: product as Product, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateProductAction(
  id: string,
  data: any
): Promise<ActionResult<Product>> {
  try {
    const validation = productSchema.safeParse(data);
    if (!validation.success) {
      return { data: null, error: validation.error.issues[0].message };
    }

    const supabase = createClient();
    const { variants, ...productData } = validation.data;

    // Update Product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        ...productData,
        images: productData.images as any[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (productError || !product) throw productError;

    // Update Variants: Drop all and recreate for safety/simplicity in monolithic flow
    const { error: deleteError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    if (deleteError) throw deleteError;

    if (variants && variants.length > 0) {
      const variantsWithProductId = variants.map((v) => ({
        product_id: id,
        name: v.name,
        options: v.options,
        price: v.price || null,
        stock: v.stock,
        sku: v.sku,
        image_url: v.imageUrl || null,
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantsWithProductId);

      if (variantError) throw variantError;
    }

    revalidatePath('/products');
    revalidatePath(`/products/${product.slug}`);
    return { data: product as Product, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/products');
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateProductStatusAction(
  id: string,
  status: ProductStatus
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/products');
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}


// ==========================================
// 3. COLLECTION ACTIONS
// ==========================================

export async function getCollectionsAction(): Promise<ActionResult<Collection[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return { data: data as Collection[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getCollectionBySlugAction(
  slug: string
): Promise<ActionResult<Collection>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return { data: null, error: 'Collection not found.' };

    return { data: data as Collection, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getFeaturedCollectionsAction(): Promise<ActionResult<Collection[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return { data: data as Collection[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createCollectionAction(
  data: any
): Promise<ActionResult<Collection>> {
  try {
    const validation = collectionSchema.safeParse(data);
    if (!validation.success) {
      return { data: null, error: validation.error.issues[0].message };
    }

    const supabase = createClient();
    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        ...validation.data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/collections');
    return { data: collection as Collection, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateCollectionAction(
  id: string,
  data: any
): Promise<ActionResult<Collection>> {
  try {
    const validation = collectionSchema.safeParse(data);
    if (!validation.success) {
      return { data: null, error: validation.error.issues[0].message };
    }

    const supabase = createClient();
    const { data: collection, error } = await supabase
      .from('collections')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/collections');
    revalidatePath(`/collections/${collection.slug}`);
    return { data: collection as Collection, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteCollectionAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/collections');
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}


// ==========================================
// 4. CART ACTIONS
// ==========================================

export async function getCartAction(
  userId?: string | null,
  sessionId?: string | null
): Promise<ActionResult<CartItem[]>> {
  try {
    const supabase = createClient();
    let query = supabase.from('cart_items').select('*, product:products(*), variant:product_variants(*)');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId).is('user_id', null);
    } else {
      return { data: [], error: null };
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: data as CartItem[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addToCartAction(
  productId: string,
  variantId: string | null,
  quantity: number,
  userId?: string | null,
  sessionId?: string | null
): Promise<ActionResult<CartItem>> {
  try {
    const supabase = createClient();

    // Check existing item
    let query = supabase.from('cart_items').select('*').eq('product_id', productId);
    if (variantId) query = query.eq('variant_id', variantId);
    else query = query.is('variant_id', null);

    if (userId) query = query.eq('user_id', userId);
    else if (sessionId) query = query.eq('session_id', sessionId).is('user_id', null);
    else throw new Error('User context or Session ID is required to add to cart.');

    const { data: existing, error: existingError } = await query.maybeSingle();
    if (existingError) throw existingError;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          product_id: productId,
          variant_id: variantId,
          quantity,
          user_id: userId || null,
          session_id: userId ? null : sessionId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    revalidatePath('/cart');
    return { data: result as CartItem, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateCartItemAction(
  cartItemId: string,
  quantity: number
): Promise<ActionResult<CartItem>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/cart');
    return { data: data as CartItem, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function removeFromCartAction(
  cartItemId: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (error) throw error;

    revalidatePath('/cart');
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function mergeGuestCartAction(
  sessionId: string,
  userId: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();

    // Fetch guest cart items
    const { data: guestItems, error: guestError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .is('user_id', null);

    if (guestError) throw guestError;

    if (guestItems && guestItems.length > 0) {
      for (const item of guestItems) {
        // Query to see if user already has this item in their cart
        let userCartQuery = supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', item.product_id);

        if (item.variant_id) {
          userCartQuery = userCartQuery.eq('variant_id', item.variant_id);
        } else {
          userCartQuery = userCartQuery.is('variant_id', null);
        }

        const { data: userItem, error: userItemError } = await userCartQuery.maybeSingle();
        if (userItemError) throw userItemError;

        if (userItem) {
          // Update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: userItem.quantity + item.quantity })
            .eq('id', userItem.id);
        } else {
          // Re-assign user ID and clear session ID
          await supabase
            .from('cart_items')
            .update({ user_id: userId, session_id: null })
            .eq('id', item.id);
        }
      }

      // Delete remaining guest cart items for this session
      await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId)
        .is('user_id', null);
    }

    revalidatePath('/cart');
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}


// ==========================================
// 5. ORDER & PAYMENT ACTIONS (RAZORPAY)
// ==========================================

export async function createRazorpayOrderAction(
  cartItems: CartItem[],
  shippingCost: number
): Promise<ActionResult<{ orderId: string; amount: number; keyId: string }>> {
  try {
    const supabase = createClient();

    // Verify stock checks
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.variant_id) {
        const { data: variant, error: varError } = await supabase
          .from('product_variants')
          .select('stock, price')
          .eq('id', item.variant_id)
          .single();

        if (varError || !variant) throw new Error('Variant not found.');
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for item variant: ${item.variant?.name || 'Selected variant'}`);
        }
        const itemPrice = variant.price !== null ? Number(variant.price) : Number(item.product?.price || 0);
        subtotal += itemPrice * item.quantity;
      } else {
        const { data: product, error: prodError } = await supabase
          .from('products')
          .select('price')
          .eq('id', item.product_id)
          .single();

        if (prodError || !product) throw new Error('Product not found.');
        subtotal += Number(product.price) * item.quantity;
      }
    }

    const total = subtotal + shippingCost;

    // Lazy load Razorpay SDK to keep bundle small
    const RazorpayClass = (await import('razorpay')).default;
    const razorpay = new RazorpayClass({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // in paise
      currency: 'INR',
      receipt: `receipt_cart_${Date.now()}`,
    });

    return {
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount as number,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function verifyAndCreateOrderAction(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  cartItems: CartItem[],
  shippingAddress: ShippingAddress,
  subtotal: number,
  shippingCost: number,
  total: number,
  userId?: string | null
): Promise<ActionResult<Order>> {
  try {
    const supabase = createClient();

    // Verify HMAC-SHA256 Signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return { data: null, error: 'Payment signature verification failed. Fraudulent activity suspected.' };
    }

    // Capture dynamic snapshots of ordered items
    const snapshotItems: OrderItem[] = cartItems.map((item) => {
      const itemPrice = item.variant?.price !== null && item.variant?.price !== undefined
        ? Number(item.variant.price) 
        : Number(item.product?.price || 0);

      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.product?.name || 'Unknown Product',
        variant_name: item.variant?.name || null,
        price: itemPrice,
        quantity: item.quantity,
        image_url: item.variant?.image_url || item.product?.images[0] || null,
      };
    });

    // Stock adjustments: Decrement stocks
    for (const item of cartItems) {
      if (item.variant_id) {
        const { data: variant, error: varError } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('id', item.variant_id)
          .single();

        if (varError || !variant) throw new Error('Variant not found during inventory adjustment.');
        const newStock = Math.max(0, variant.stock - item.quantity);
        await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('id', item.variant_id);
      }
    }

    // Create Order Row
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        status: 'paid', // Mark as paid immediately since signature validated
        subtotal,
        shipping_cost: shippingCost,
        total,
        items: snapshotItems as any,
        shipping_address: shippingAddress as any,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !order) throw orderError;

    // Clear cart
    if (userId) {
      await supabase.from('cart_items').delete().eq('user_id', userId);
    } else if (cartItems.length > 0 && cartItems[0].session_id) {
      await supabase.from('cart_items').delete().eq('session_id', cartItems[0].session_id);
    }

    revalidatePath('/cart');
    revalidatePath('/account');
    return { data: order as unknown as Order, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getOrdersAction(
  userId: string
): Promise<ActionResult<Order[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as unknown as Order[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getOrderByIdAction(
  orderId: string
): Promise<ActionResult<Order>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !data) return { data: null, error: 'Order not found.' };

    return { data: data as unknown as Order, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getAllOrdersAction(filters?: {
  status?: OrderStatus;
}): Promise<ActionResult<Order[]>> {
  try {
    const supabase = createClient();
    let query = supabase.from('orders').select('*');

    if (filters?.status && filters.status !== 'All' as any) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return { data: data as unknown as Order[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;

    revalidatePath('/admin');
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}


// ==========================================
// 6. WISHLIST & REVIEWS ACTIONS
// ==========================================

export async function getWishlistAction(
  userId: string
): Promise<ActionResult<WishlistItem[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, product:products(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return { data: data as WishlistItem[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function toggleWishlistAction(
  userId: string,
  productId: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = createClient();

    // Check if exists
    const { data: existing, error: getError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (getError) throw getError;

    if (existing) {
      const { error: delError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', existing.id);
      if (delError) throw delError;
      return { data: false, error: null }; // Removed
    } else {
      const { error: insError } = await supabase
        .from('wishlist')
        .insert({ user_id: userId, product_id: productId, created_at: new Date().toISOString() });
      if (insError) throw insError;
      return { data: true, error: null }; // Added
    }
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getProductReviewsAction(
  productId: string
): Promise<ActionResult<Review[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profile:profiles(*)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as Review[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createReviewAction(
  productId: string,
  rating: number,
  body: string
): Promise<ActionResult<Review>> {
  try {
    const validation = reviewSchema.safeParse({ rating, body });
    if (!validation.success) {
      return { data: null, error: validation.error.issues[0].message };
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'You must be logged in to leave a review.' };
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating: validation.data.rating,
        body: validation.data.body,
        created_at: new Date().toISOString(),
      })
      .select('*, profile:profiles(*)')
      .single();

    if (error) throw error;

    // Revalidate product page
    const { data: product } = await supabase.from('products').select('slug').eq('id', productId).single();
    if (product) {
      revalidatePath(`/products/${product.slug}`);
    }

    return { data: data as Review, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}


// ==========================================
// 7. ADMIN DASHBOARD ACTIONS
// ==========================================

export async function getDashboardStatsAction(): Promise<ActionResult<DashboardStats>> {
  try {
    const supabase = createClient();

    // 1. Get total paid/delivered orders revenue
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) throw ordersError;

    let revenue = 0;
    let ordersCount = ordersData?.length || 0;
    const typedOrders = (ordersData || []) as unknown as Order[];

    for (const order of typedOrders) {
      if (order.status !== 'cancelled' && order.status !== 'pending') {
        revenue += Number(order.total);
      }
    }

    // 2. Total users
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // 3. Total active/draft products
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) throw productsError;

    // 4. Ten most recent orders
    const { data: recentOrdersData, error: recentError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    return {
      data: {
        revenue,
        ordersCount,
        usersCount: usersCount || 0,
        productsCount: productsCount || 0,
        recentOrders: (recentOrdersData || []) as unknown as Order[],
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
