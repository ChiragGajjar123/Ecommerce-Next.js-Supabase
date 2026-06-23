import { z } from 'zod';

export const passwordStrengthRegex = {
  uppercase: /[A-Z]/,
  numeric: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(passwordStrengthRegex.uppercase, 'Password must contain at least one uppercase letter')
  .regex(passwordStrengthRegex.numeric, 'Password must contain at least one number')
  .regex(passwordStrengthRegex.special, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
