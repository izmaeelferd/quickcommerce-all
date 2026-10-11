/**
 * Line icon set used across the panel (24x24 grid, stroke = currentColor).
 * Icons are inline SVG so the UI has no emoji glyphs, renders identically on every OS,
 * and inherits text color and size from Tailwind classes.
 */
const PATHS = {
  dashboard: ['M3 3h8v8H3z', 'M13 3h8v5h-8z', 'M13 10h8v11h-8z', 'M3 13h8v8H3z'],
  palette: ['M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9l-.4-1.2A1.5 1.5 0 0 1 14.5 16H17a4 4 0 0 0 4-4c0-5-4-9-9-9z', 'M7.5 11.5h.01', 'M10.5 7.5h.01', 'M15.5 8.5h.01'],
  tag: ['M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z', 'M8 8h.01'],
  layout: ['M3 4h18v16H3z', 'M3 9h18', 'M9 9v11'],
  image: ['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6', 'M15.5 9h.01'],
  flag: ['M5 21V4', 'M5 4h11l-2 4 2 4H5'],
  scale: ['M12 3v18', 'M7 21h10', 'M4 7h16', 'M4 7l-3 7a3 3 0 0 0 6 0z', 'M20 7l-3 7a3 3 0 0 0 6 0z'],
  globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18', 'M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z'],
  document: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 12h6', 'M9 16h6'],
  wrench: ['M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z'],
  receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
  userCheck: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21v-1a6 6 0 0 1 10.5-4', 'M15 18l2 2 4-4'],
  store: ['M4 9l1.5-5h13L20 9', 'M4 9h16v2a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 14a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 11z', 'M5 14v7h14v-7', 'M10 21v-4h4v4'],
  folder: ['M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z'],
  star: ['M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z'],
  truck: ['M2 6h11v10H2z', 'M13 10h4l4 4v2h-8', 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  users: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21v-1a6 6 0 0 1 12 0v1', 'M16 3.1a4 4 0 0 1 0 7.8', 'M22 21v-1a6 6 0 0 0-4-5.7'],
  card: ['M2 6h20v12H2z', 'M2 10h20', 'M6 15h4'],
  percent: ['M19 5L5 19', 'M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  chart: ['M3 3v18h18', 'M7 15l4-4 3 3 5-6'],
  bell: ['M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8', 'M10 20a2 2 0 0 0 4 0'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  sun: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M21 21l-5-5'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  download: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 21h16'],
  bank: ['M3 10l9-6 9 6', 'M4 10h16', 'M6 10v8', 'M10 10v8', 'M14 10v8', 'M18 10v8', 'M3 21h18'],
  wallet: ['M3 7a2 2 0 0 1 2-2h13v4', 'M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z', 'M16 14h.01'],
  package: ['M12 3l9 5v8l-9 5-9-5V8z', 'M3 8l9 5 9-5', 'M12 13v8'],
  pin: ['M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z', 'M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  award: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M8.5 14L7 22l5-3 5 3-1.5-8'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  utensils: ['M7 3v8', 'M4 3v5a3 3 0 0 0 6 0V3', 'M7 11v10', 'M17 21V3c-2.2 1.3-3 3.6-3 7v4h3'],
  plus: ['M12 5v14', 'M5 12h14'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  coins: ['M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3z', 'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6'],
};

export const ICON_NAMES = Object.keys(PATHS);

/**
 * @param {{ name: keyof typeof PATHS, className?: string, title?: string, filled?: boolean }} props
 * Decorative by default (aria-hidden). Pass `title` when the icon is the only label of a control.
 */
export default function Icon({ name, className = 'h-5 w-5', title, filled = false }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Read-only star rating, e.g. <Rating value={4.3} />. */
export function Rating({ value, className = '' }) {
  const v = Number(value) || 0;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon name="star" filled className="h-4 w-4 text-warning" />
      <span>{v.toFixed(1)}</span>
    </span>
  );
}

/** Small on/off status indicator with an accessible label. */
export function Dot({ on, label }) {
  return <span role="img" aria-label={label} title={label} className={`inline-block h-2.5 w-2.5 rounded-full ${on ? 'bg-success' : 'bg-content/25'}`} />;
}
