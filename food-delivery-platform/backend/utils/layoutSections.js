const { ApiError } = require('./helpers');
const { isObjectIdHex } = require('./idList');

/**
 * Validation and normalization for `homeLayout` sections saved from the Admin Panel.
 *
 * Every section is rebuilt from an allow-list of fields (unknown keys are dropped), numeric
 * values are clamped, colors and links are checked, and admin-authored HTML is sanitized, so
 * the customer app only ever receives well-formed, bounded data.
 */

const SECTION_TYPES = [
  'banner', 'categories', 'search', 'restaurants', 'offers', 'cuisines', 'featured', 'topRated', 'nearby', 'reorder', 'custom',
  // Custom content sections
  'promo', 'pickedRestaurants', 'pickedDishes', 'text', 'spacer',
];
const LAYOUTS = ['grid', 'list', 'carousel'];
const LINK_TYPES = ['none', 'restaurant', 'category', 'cuisine', 'url', 'coupon', 'offers'];
const TEXT_ALIGN = ['start', 'center', 'end'];
const MAX_PICKED = 50;
const MAX_HTML = 20000;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i; // no alpha: CSS and Flutter disagree on 8-digit order

const sectionError = (index, field) => new ApiError(422, 'config.invalidSection', [{ field: `homeLayout[${index}].${field}`, message: 'config.invalidSection' }]);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const clampInt = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

function color(v, index, field) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string' || !HEX.test(v.trim())) throw sectionError(index, field);
  const hex = v.trim().toUpperCase();
  // Expand #RGB to #RRGGBB so every client parses the same format.
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

/** Accepts absolute http(s) URLs and server-relative upload paths. */
function imageUrl(v, index, field) {
  const s = str(v, 1000);
  if (!s) return '';
  if (s.startsWith('/uploads/')) return s;
  let u;
  try {
    u = new URL(s);
  } catch {
    throw sectionError(index, field);
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw sectionError(index, field);
  return u.toString();
}

function objectIds(v, index, field) {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > MAX_PICKED) throw sectionError(index, field);
  const out = [];
  for (const id of v) {
    if (typeof id !== 'string' || !isObjectIdHex(id)) throw sectionError(index, field);
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Minimal allow-list HTML sanitizer for admin-authored rich text. Keeps formatting tags only,
 * drops every attribute except a safe `href` on links, and removes executable content.
 */
const ALLOWED_TAGS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'span', 'blockquote', 'hr']);
function sanitizeHtml(input) {
  let html = String(input || '').slice(0, MAX_HTML);
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<(script|style|iframe|object|embed|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '');
  return html.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (tag, name, attrs) => {
    const lower = name.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return '';
    if (tag.startsWith('</')) return `</${lower}>`;
    if (lower === 'a') {
      const m = /\shref\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
      const href = m ? (m[2] ?? m[3] ?? '').trim() : '';
      return /^(https?:|mailto:|tel:)/i.test(href) ? `<a href="${href.replace(/"/g, '&quot;')}">` : '<a>';
    }
    return `<${lower}>`;
  });
}

function link(content, index) {
  const linkType = LINK_TYPES.includes(content.linkType) ? content.linkType : 'none';
  let linkValue = str(content.linkValue, 300);
  if (linkType === 'url' && linkValue) {
    let u;
    try {
      u = new URL(linkValue);
    } catch {
      throw sectionError(index, 'content.linkValue');
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw sectionError(index, 'content.linkValue');
    linkValue = u.toString();
  }
  if (linkType === 'restaurant' && linkValue && !isObjectIdHex(linkValue)) throw sectionError(index, 'content.linkValue');
  return { linkType, linkValue: linkType === 'none' || linkType === 'offers' ? '' : linkValue };
}

function normalizeContent(type, raw, index) {
  const c = isPlainObject(raw) ? raw : {};
  switch (type) {
    case 'promo':
      return { imageUrl: imageUrl(c.imageUrl, index, 'content.imageUrl'), ctaText: str(c.ctaText, 40), ...link(c, index) };
    case 'pickedRestaurants':
      return { restaurantIds: objectIds(c.restaurantIds, index, 'content.restaurantIds') };
    case 'pickedDishes':
      return { itemIds: objectIds(c.itemIds, index, 'content.itemIds') };
    case 'text':
      return { html: sanitizeHtml(c.html) };
    default:
      return {};
  }
}

function normalizeStyle(raw, index) {
  const s = isPlainObject(raw) ? raw : {};
  const out = {};
  const bg = color(s.backgroundColor, index, 'style.backgroundColor');
  const fg = color(s.textColor, index, 'style.textColor');
  if (bg) out.backgroundColor = bg;
  if (fg) out.textColor = fg;
  if (s.height !== undefined && s.height !== '') out.height = clampInt(s.height, 40, 480, 160);
  if (s.autoplaySeconds !== undefined && s.autoplaySeconds !== '') out.autoplaySeconds = clampInt(s.autoplaySeconds, 0, 30, 4);
  if (s.paddingVertical !== undefined && s.paddingVertical !== '') out.paddingVertical = clampInt(s.paddingVertical, 0, 64, 8);
  if (s.textAlign !== undefined) out.textAlign = TEXT_ALIGN.includes(s.textAlign) ? s.textAlign : 'start';
  return out;
}

/** Restaurant-list filters: only known keys with bounded values. */
function normalizeFilter(raw) {
  const f = isPlainObject(raw) ? raw : {};
  const out = {};
  if (typeof f.cuisine === 'string' && f.cuisine.trim()) out.cuisine = f.cuisine.trim().slice(0, 60);
  if (typeof f.category === 'string' && isObjectIdHex(f.category)) out.category = f.category;
  if (typeof f.sort === 'string' && /^[a-zA-Z]{0,20}$/.test(f.sort)) out.sort = f.sort;
  if (f.minRating !== undefined && f.minRating !== null && f.minRating !== '') out.minRating = Math.min(5, Math.max(0, Number(f.minRating) || 0));
  if (f.veg === true) out.veg = true;
  if (f.featured === true) out.featured = true;
  if (typeof f.placement === 'string' && ['home', 'offers', 'restaurant', 'cart'].includes(f.placement)) out.placement = f.placement;
  return out;
}

/**
 * @param {unknown} sections raw request payload
 * @returns {object[]} normalized sections, ordered by `order`
 * @throws {ApiError} 422 on any invalid section
 */
function normalizeLayout(sections) {
  if (!Array.isArray(sections)) throw new ApiError(400, 'config.layoutMustBeArray');
  if (sections.length > 60) throw new ApiError(422, 'config.tooManySections');
  const seen = new Set();
  return sections.map((raw, i) => {
    if (!isPlainObject(raw)) throw sectionError(i, 'section');
    if (!SECTION_TYPES.includes(raw.type)) throw sectionError(i, 'type');
    let id = str(raw.id, 80) || `sec_${raw.type}_${Date.now()}_${i}`;
    if (!/^[A-Za-z0-9_-]+$/.test(id) || seen.has(id)) id = `sec_${raw.type}_${Date.now()}_${i}`;
    seen.add(id);
    return {
      id,
      type: raw.type,
      enabled: raw.enabled !== false,
      order: clampInt(raw.order, 0, 1000, i + 1),
      title: str(raw.title, 120),
      titleKey: /^[A-Za-z0-9_.-]{0,80}$/.test(raw.titleKey || '') ? raw.titleKey || '' : '',
      subtitle: str(raw.subtitle, 200),
      layout: LAYOUTS.includes(raw.layout) ? raw.layout : 'list',
      columns: clampInt(raw.columns, 1, 4, 2),
      limit: clampInt(raw.limit, 1, MAX_PICKED, 10),
      filter: normalizeFilter(raw.filter),
      style: normalizeStyle(raw.style, i),
      content: normalizeContent(raw.type, raw.content, i),
    };
  });
}

module.exports = { SECTION_TYPES, LAYOUTS, LINK_TYPES, MAX_PICKED, normalizeLayout, sanitizeHtml };
