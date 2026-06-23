export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return '';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // In India, whole rupees are common for e-commerce, but we can set 2 if needed
  }).format(numericPrice);
}
