import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name (at least 2 characters)'),
  phone: z.string().min(10, 'Please enter a valid phone number (at least 10 digits)').regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
  addressLine1: z.string().min(5, 'Please enter your street address (at least 5 characters)'),
  addressLine2: z.string().optional().nullable().or(z.literal('')),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().min(2, 'Please enter your state/region'),
  postalCode: z.string().min(3, 'Please enter a valid postal code'),
  country: z.string().min(2, 'Please enter your country'),
  isDefault: z.boolean(),
  latitude: z.number({
    message: 'Please pinpoint your address on the map.',
  }),
  longitude: z.number({
    message: 'Please pinpoint your address on the map.',
  }),
});

export type AddressInput = z.infer<typeof addressSchema>;
