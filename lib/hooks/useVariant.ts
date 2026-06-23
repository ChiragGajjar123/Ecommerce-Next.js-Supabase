import { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';

export const useVariant = (product: Product, variants: ProductVariant[]) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Initialize options with defaults from the first variant if available
  useEffect(() => {
    if (variants && variants.length > 0) {
      const defaultVariant = variants[0];
      setSelectedOptions({ ...defaultVariant.options });
    }
  }, [variants]);

  // Find matching variant based on currently selected options
  useEffect(() => {
    if (variants && variants.length > 0) {
      const matched = variants.find((variant) => {
        // Compare every key-value option pair
        return Object.keys(selectedOptions).every(
          (key) => variant.options[key] === selectedOptions[key]
        );
      });
      setSelectedVariant(matched || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedOptions, variants]);

  const selectOption = (key: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: value }));
  };

  const getPrice = (): number => {
    if (selectedVariant && selectedVariant.price !== null && selectedVariant.price !== undefined) {
      return Number(selectedVariant.price);
    }
    return Number(product.price);
  };

  const getCompareAtPrice = (): number | null => {
    if (selectedVariant && selectedVariant.price !== null && selectedVariant.price !== undefined) {
      // Use variant specific compare price or fallback to product's comparison price
      return product.compare_at_price ? Number(product.compare_at_price) : null;
    }
    return product.compare_at_price ? Number(product.compare_at_price) : null;
  };

  const getStock = (): number => {
    if (selectedVariant) {
      return selectedVariant.stock;
    }
    // If variants exist but none matched, treat as 0. Otherwise return 0 since we check variant stock.
    return 0;
  };

  const isOutOfStock = (): boolean => {
    return getStock() <= 0;
  };

  return {
    selectedOptions,
    selectedVariant,
    selectOption,
    price: getPrice(),
    compareAtPrice: getCompareAtPrice(),
    stock: getStock(),
    isOutOfStock: isOutOfStock(),
  };
};
