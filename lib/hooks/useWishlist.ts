import { create } from 'zustand';
import { WishlistItem, Product } from '@/types';
import { getWishlistAction, toggleWishlistAction } from '@/lib/actions/actions';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  
  fetchWishlist: (userId: string) => Promise<void>;
  toggleWishlist: (userId: string, product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async (userId) => {
    set({ isLoading: true });
    const result = await getWishlistAction(userId);
    if (result.data) {
      set({ items: result.data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (userId, product) => {
    const currentItems = get().items;
    const isAlreadyIn = get().isInWishlist(product.id);

    // Optimistic Update
    let tempItems = [...currentItems];
    if (isAlreadyIn) {
      tempItems = tempItems.filter((item) => item.product_id !== product.id);
    } else {
      tempItems.push({
        id: 'temp-wishlist-id-' + Math.random().toString(),
        user_id: userId,
        product_id: product.id,
        created_at: new Date().toISOString(),
        product,
      });
    }
    set({ items: tempItems });

    // Sync with server
    const result = await toggleWishlistAction(userId, product.id);
    if (result.error !== null) {
      // Revert if error
      set({ items: currentItems });
    } else {
      // Fetch fresh items to ensure proper IDs
      get().fetchWishlist(userId);
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.product_id === productId);
  },

  clearWishlist: () => {
    set({ items: [] });
  },
}));
