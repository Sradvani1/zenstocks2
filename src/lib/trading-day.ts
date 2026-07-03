/** Latest US equity session date (weekday rollback only; no holiday calendar). */
export function latestUsTradingDate(now: Date = new Date()): string {
  const d = new Date(now);
  const day = d.getDay();

  if (day === 0) {
    d.setDate(d.getDate() - 2);
  } else if (day === 6) {
    d.setDate(d.getDate() - 1);
  }

  return formatDate(d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
