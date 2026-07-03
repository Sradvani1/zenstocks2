export const MAX_HOLDINGS = 25;

const SYMBOL_REGEX = /^[A-Z][A-Z0-9.-]{0,9}$/;

export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_REGEX.test(symbol);
}
