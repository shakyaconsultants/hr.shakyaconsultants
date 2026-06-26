export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return Number.parseFloat(cleaned);
}

export function roundCurrency(amount: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(amount * factor) / factor;
}
