const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const percentFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

export function formatPercent(value: number): string {
  return percentFmt.format(value);
}

export function formatAsOfDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return monthDay.format(new Date(Date.UTC(year, month - 1, day)));
}
