import { Currency, CurrencyCode } from './types/calculator';

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee (INR)',
    locale: 'en-IN',
    step: 500,
    defaultRent: 20000,
    defaultUtilities: 4000,
    defaultIncome: 50000,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar (USD)',
    locale: 'en-US',
    step: 50,
    defaultRent: 1600,
    defaultUtilities: 250,
    defaultIncome: 4500,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (EUR)',
    locale: 'de-DE',
    step: 50,
    defaultRent: 1200,
    defaultUtilities: 200,
    defaultIncome: 3600,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (GBP)',
    locale: 'en-GB',
    step: 50,
    defaultRent: 1100,
    defaultUtilities: 180,
    defaultIncome: 3200,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar (CAD)',
    locale: 'en-CA',
    step: 50,
    defaultRent: 1800,
    defaultUtilities: 220,
    defaultIncome: 4800,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar (AUD)',
    locale: 'en-AU',
    step: 50,
    defaultRent: 2000,
    defaultUtilities: 250,
    defaultIncome: 5200,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar (SGD)',
    locale: 'en-SG',
    step: 50,
    defaultRent: 2400,
    defaultUtilities: 220,
    defaultIncome: 6000,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham (AED)',
    locale: 'en-AE',
    step: 100,
    defaultRent: 5000,
    defaultUtilities: 600,
    defaultIncome: 14000,
  }
};

export const DEFAULT_CURRENCY = CURRENCIES.INR;

export function isCurrencyCode(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}

/**
 * Look up a currency from an untrusted string (a stored scenario code, an API
 * response), falling back to the default rather than returning undefined.
 */
export function getCurrency(code: string | null | undefined): Currency {
  return code && isCurrencyCode(code) ? CURRENCIES[code] : DEFAULT_CURRENCY;
}
