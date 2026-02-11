/**
 * Central currency formatting utilities.
 * Symbol is passed as a parameter so components can use the configurable setting.
 */

/** Full format: "PKR 1,234,567" */
export function formatCurrency(value: number, symbol: string): string {
  return `${symbol} ${value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** With 2 decimals: "PKR 1,234.50" */
export function formatCurrencyDecimal(value: number, symbol: string): string {
  return `${symbol} ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Dashboard compact: "PKR 1.50M" / "PKR 23.4K" */
export function formatCurrencyCompact(value: number, symbol: string): string {
  if (value >= 1_000_000) {
    return `${symbol} ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${symbol} ${(value / 1_000).toFixed(1)}K`;
  }
  return `${symbol} ${value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Chart axes — no symbol: "1.5M" */
export function formatChartValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}
