import { create } from 'zustand';
import { CartItem, Product, ProductVariant } from '@/types';
import { 
  getCartAction, 
  addToCartAction, 
  updateCartItemAction, 
  removeFromCartAction,
  mergeGuestCartAction
} from '@/lib/actions/actions';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  sessionId: string | null;
  
  initSession: () => string;
  fetchCart: (userId?: string | null) => Promise<void>;
  addItem: (
    productId: string, 
    variantId: string | null, 
    quantity: number, 
    product: Product, 
    variant: ProductVariant | null,
    userId?: string | null
  ) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => void;
  mergeCart: (userId: string) => Promise<void>;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  sessionId: null,

  initSession: () => {
    let sid = get().sessionId;
    if (!sid && typeof window !== 'undefined') {
      sid = localStorage.getItem('guest_session_id');
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('guest_session_id', sid);
      }
      set({ sessionId: sid });
    }
    return sid || '';
  },

  fetchCart: async (userId) => {
    set({ isLoading: true });
    const sid = get().initSession();
    const result = await getCartAction(userId, sid);
    if (result.data) {
      set({ items: result.data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, variantId, quantity, product, variant, userId) => {
    const sid = get().initSession();
    
    // Optimistic Update
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(
      (item) => item.product_id === productId && item.variant_id === variantId
    );

    let tempItems = [...currentItems];
    if (existingIndex > -1) {
      tempItems[existingIndex] = {
        ...tempItems[existingIndex],
        quantity: tempItems[existingIndex].quantity + quantity,
      };
    } else {
      tempItems.push({
        id: 'temp-id-' + Math.random().toString(),
        product_id: productId,
        variant_id: variantId,
        quantity,
        user_id: userId || null,
        session_id: userId ? null : sid,
        created_at: new Date().toISOString(),
        product,
        variant: variant || undefined,
      });
    }
    set({ items: tempItems });

    // Server-side Sync
    const result = await addToCartAction(productId, variantId, quantity, userId, sid);
    if (!result.data) {
      // Revert if error
      set({ items: currentItems });
    } else {
      // Refresh cart to get proper database IDs
      get().fetchCart(userId);
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    const currentItems = get().items;
    const updatedItems = currentItems.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item
    );
    set({ items: updatedItems });

    const result = await updateCartItemAction(cartItemId, quantity);
    if (!result.data) {
      // Revert
      set({ items: currentItems });
    }
  },

  removeItem: async (cartItemId) => {
    const currentItems = get().items;
    const filteredItems = currentItems.filter((item) => item.id !== cartItemId);
    set({ items: filteredItems });

    const result = await removeFromCartAction(cartItemId);
    if (!result.data) {
      set({ items: currentItems });
    }
  },

  clearCart: () => {
    set({ items: [] });
  },

  mergeCart: async (userId) => {
    const sid = get().initSession();
    if (!sid) return;

    set({ isLoading: true });
    const result = await mergeGuestCartAction(sid, userId);
    if (result.data) {
      // Clear local session ID since user is authenticated now
      localStorage.removeItem('guest_session_id');
      set({ sessionId: null });
      // Fetch user's cart
      await get().fetchCart(userId);
    } else {
      set({ isLoading: false });
    }
  },
}));
