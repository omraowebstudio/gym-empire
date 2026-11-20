const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** Compact number formatting for big idle-game numbers: 1.23K, 45.6M ... */
export function formatNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0';
  const neg = value < 0;
  let v = Math.abs(value);
  if (v < 1000) {
    const s = v < 10 && v % 1 !== 0 ? v.toFixed(1) : Math.floor(v).toString();
    return (neg ? '-' : '') + s;
  }
  let i = 0;
  while (v >= 1000 && i < SUFFIXES.length - 1) {
    v /= 1000;
    i++;
  }
  const fixed = v >= 100 ? v.toFixed(0) : v.toFixed(decimals);
  return (neg ? '-' : '') + fixed.replace(/\.0+$/, '') + SUFFIXES[i];
}

export function formatCash(value: number): string {
  return '$' + formatNumber(Math.abs(value) < 1000 ? Math.floor(value) : value);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
