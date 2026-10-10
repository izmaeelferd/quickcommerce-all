export const hexToRgbTriplet = (hex) => {
  if (!hex) return null;
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(2);
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export const formatDate = (d, lang) => (d ? new Date(d).toLocaleString(lang || undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
export const formatDay = (d, lang) => (d ? new Date(d).toLocaleDateString(lang || undefined, { dateStyle: 'medium' }) : '');

export const money = (v, symbol = '', lang) => {
  const n = Number(v || 0);
  return `${symbol}${n.toLocaleString(lang || undefined, { maximumFractionDigits: 2 })}`;
};

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

/** Readable foreground (dark or light) for a given background hex, derived from the theme's own text/background colors. */
export const contrastOn = (hex, light, dark) => {
  const t = hexToRgbTriplet(hex);
  if (!t) return light;
  const [r, g, b] = t.split(' ').map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? dark : light;
};
