import { z } from 'zod';

export const variantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Variant name is required'),
  options: z.record(z.string(), z.string()), // e.g. {"color": "Red", "size": "S"}
  price: z.coerce.number().min(0, 'Variant price must be 0 or higher').nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be 0 or higher'),
  sku: z.string().min(1, 'SKU is required'),
  imageUrl: z.string().nullable().optional(),
});

export type VariantInput = z.infer<typeof variantSchema>;

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be 0 or higher'),
  compareAtPrice: z.coerce.number().min(0, 'Compare-at price must be 0 or higher').nullable().optional(),
  images: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  collectionId: z.string().uuid().nullable().optional(),
  metaTitle: z.string().max(70, 'Meta Title should be less than 70 characters').optional().nullable(),
  metaDescription: z.string().max(160, 'Meta Description should be less than 160 characters').optional().nullable(),
  variants: z.array(variantSchema).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const collectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  body: z.string().min(1, 'Review body cannot be empty'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
