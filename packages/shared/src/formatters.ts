import { Currency } from './types/calculator';

/**
 * Format a number as currency using the given currency locale and symbol
 */
export function formatCurrency(amount: number, currency: Currency, compact: boolean = false): string {
  if (isNaN(amount) || !isFinite(amount)) return `${currency.symbol}0`;

  if (compact && Math.abs(amount) >= 100000 && currency.code === 'INR') {
    const lakhs = amount / 100000;
    return `${currency.symbol}${lakhs.toFixed(1).replace(/\.0$/, '')}L`;
  }

  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `${currency.symbol}${k.toFixed(1).replace(/\.0$/, '')}k`;
  }

  try {
    const formatter = new Intl.NumberFormat(currency.locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    return `${currency.symbol}${formatter.format(Math.round(amount))}`;
  } catch {
    return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Format a number as standard localized number
 */
export function formatNumber(val: number, locale: string = 'en-IN'): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }).format(val);
  } catch {
    return val.toLocaleString();
  }
}

/**
 * Format percentage
 */
export function formatPercent(val: number, decimals: number = 0): string {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${val.toFixed(decimals).replace(/\.0$/, '')}%`;
}
