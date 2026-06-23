export const ROUTES = {
  home: '/',
  admin: '/admin',
  account: '/account',
  cart: '/cart',
  checkout: '/checkout',
  products: '/products',
  collections: '/collections',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    callback: '/auth/callback',
  },
} as const;

export function sanitizeInternalPath(value: string | null | undefined): string {
  const path = value?.trim() || ROUTES.home;
  return path.startsWith('/') && !path.startsWith('//') ? path : ROUTES.home;
}

export function buildLoginRedirectPath(redirectTo: string): string {
  const params = new URLSearchParams({
    redirect: sanitizeInternalPath(redirectTo),
  });

  return `${ROUTES.auth.login}?${params.toString()}`;
}

export function buildLoginErrorPath(errorMessage: string, redirectTo?: string): string {
  const params = new URLSearchParams({
    error: errorMessage,
  });

  if (redirectTo) {
    params.set('redirect', sanitizeInternalPath(redirectTo));
  }

  return `${ROUTES.auth.login}?${params.toString()}`;
}

export function buildVerifyEmailPath(email: string): string {
  const params = new URLSearchParams({ email });
  return `${ROUTES.auth.verifyEmail}?${params.toString()}`;
}

export function buildProductsSearchPath(searchQuery: string): string {
  const params = new URLSearchParams({ search: searchQuery.trim() });
  return `${ROUTES.products}?${params.toString()}`;
}

export function buildOrderSuccessPath(orderId: string): string {
  return `/orders/${orderId}/success`;
}

export function buildOAuthCallbackPath(nextPath: string): string {
  const params = new URLSearchParams({
    next: sanitizeInternalPath(nextPath),
  });

  return `${ROUTES.auth.callback}?${params.toString()}`;
}
