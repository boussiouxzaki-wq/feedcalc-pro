import { CurrencyConfig } from '../types';

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real (R$)' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso (Mex$)' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal (SAR)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)' },
  { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound (EGP)' },
  { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar (DZD)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
];

export function getCurrencySymbol(code?: string): string {
  if (!code) return '$';
  const found = CURRENCIES.find((c) => c.code === code);
  return found ? found.symbol : code;
}
