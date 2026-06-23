import { z } from 'zod';

export const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number (at least 10 digits)').regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
  fullName: z.string().min(2, 'Please enter your full name (at least 2 characters)'),
  addressLine1: z.string().min(5, 'Please enter your street address (at least 5 characters)'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().min(2, 'Please enter your state/region'),
  postalCode: z.string().min(3, 'Please enter a valid postal code'),
  country: z.string().min(2, 'Please enter your country'),
  shippingMethod: z.enum(['standard', 'express']),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
