# 04 - Design system (Pillar 3: high-performance UI/UX)

> **Status: blueprint.** This document specifies a design system to be built. Nothing here exists or has been tested yet. Decisions are marked **Decision**; numbers marked *example* are configuration defaults, not code constants. Where this document and `00-CONTRACT.md` disagree, the contract wins.

Related documents: `00-CONTRACT.md` (stack and names), `01-ARCHITECTURE.md` (apps, bootstrap call, realtime), `03-CONFIG-FLAGS-TAX.md` (settings, feature flags, per-country configuration). Machine-readable tokens live in `design-tokens/tokens.json`; the build pipeline is in `design-tokens/README.md`; the contrast gate is `design-tokens/check_contrast.py`.

Applies to: Flutter app `apps/mobile` (flavors `customer`, `store`, `rider`), React apps `apps/admin-web` and `apps/store-web`, shared web components in `packages/ui-web`, tokens in `packages/design-tokens`.

---

## Contents

1. Principles and measurable targets
2. Token architecture
3. Tenant branding: what can be overridden and how the rest is derived
4. Token specification (color, typography, spacing, radius, elevation, motion, z-index, breakpoints, icons, opacity)
5. Discount and badge system
6. Loading: skeleton vs spinner vs optimistic UI
7. Micro-animations and haptics
8. Component library
9. Accessibility
10. Responsive rules
11. Internationalization and RTL
12. Theming implementation (Flutter and web, with code)
13. UI performance budgets
14. Design QA checklist
Appendix A. Contrast verification result

---

## 1. Principles and measurable targets

Quick commerce is a repeat-purchase habit. Retention depends on the app feeling instant, the price being obvious, and the next action always being under the thumb. Every principle below has a target that QA can measure.

| # | Principle | What it means in the UI | Target (measured on the reference device, see 13.1) |
|---|---|---|---|
| P1 | Speed perception first | Paint a stable layout immediately (skeletons from cached layout), update optimistically, never block on the network for a local action | Cold start to interactive home with cached data <= 2.0 s P75; warm start <= 1.0 s P75; first meaningful paint (skeleton or content above the fold) <= 1.0 s after splash; real content above the fold <= 1.5 s P75 on 4G |
| P2 | One tap to cart | Every product surface (grid, list, carousel, search result, reorder) has an inline Add control that becomes a stepper | Add from any listing = 1 tap; visual feedback <= 100 ms (optimistic); server reconciliation <= 800 ms P95 |
| P3 | One-thumb reach | Primary actions live in the bottom 40% of a phone screen: cart bar, checkout, bottom nav, stepper on cards | 100% of primary CTAs in the bottom thumb zone at 360x640 dp; no primary action in the top 20% except search and address |
| P4 | Price clarity | Selling price is the most prominent number on a card; MRP/list price struck through next to it; unit size and per-unit price always visible; taxes shown as configured per country (`03-CONFIG-FLAGS-TAX.md`) | Price uses `typography.priceMd` or larger, contrast >= 4.5:1; 0 product cards without unit size; total payable visible on cart and checkout without scrolling |
| P5 | Minimal chrome | Content gets the screen. App bar collapses on scroll, bottom nav hides on scroll-down in listings, cart bar replaces nothing | App bar + bottom nav + cart bar <= 25% of viewport height at 360x640 dp |
| P6 | Touchable | Big, separated targets; no hover-only affordances on mobile | Hit area >= 48x48 dp (mobile), >= 40x40 px with 8 px spacing (admin web, pointer only); spacing between adjacent targets >= 8 dp |
| P7 | Readable | High contrast, generous line height, scripts treated natively | Text >= 4.5:1 (we apply this to large text too); non-text UI >= 3:1; body text >= 14 sp; works at 200% text scale |
| P8 | Calm motion | Motion explains state changes and never delays input | All UI motion <= 300 ms except success confirmation (500 ms) and map interpolation; input never blocked by an animation; reduced-motion honoured |
| P9 | Honest stock | Out-of-stock and low-stock are visible before the tap, with a substitute path | 0 add attempts on out-of-stock items reaching the server from the UI; substitute hint shown on every OOS card where `product_substitutes` exist |
| P10 | Tenant identity without breaking quality | Tenants change brand colors, logo, font, radius; the system guarantees contrast and layout | 100% of derived tenant themes pass `check_contrast.py`; brand change requires no app release |

---

## 2. Token architecture

### 2.1 Three tiers

| Tier | Purpose | Examples | Who may reference it |
|---|---|---|---|
| 1. Primitive (reference) | Raw values with no meaning: color ramps, font sizes, durations, easing curves | `primitive.color.neutral.900`, `primitive.color.brand.600`, `primitive.duration.250` | Only tier 2 |
| 2. Semantic (system) | Role-based, theme-aware (light and dark) | `color.text.primary`, `color.commerce.discount.fill`, `space.4`, `radius.md`, `shadow.2`, `motion.duration.short`, `typography.bodyMd` | Tier 3 and application code |
| 3. Component | Decisions for one component, aliasing semantic tokens | `component.stepper.background`, `component.cartBar.height` | That component's implementation only |

**Decision:** application code (Dart widgets, React components) may use tier 2 and tier 3 tokens only. A lint rule rejects hex literals and primitive references outside `packages/design-tokens` and the generated theme files (Dart: `custom_lint` rule `no_raw_colors`; web: ESLint `no-restricted-syntax` on `#[0-9a-fA-F]{3,8}` in `.tsx` and on Tailwind arbitrary color values like `bg-[#...]`).

### 2.2 Modes

Semantic colors and shadows are mode-aware. In `tokens.json` the light value is `$value` and the dark value is `$extensions["com.quickcart.modes"].dark`. This keeps a single token path (so component tokens can alias `{color.brand.primary}` once) and lets the build emit one file per mode (`design-tokens/README.md`).

### 2.3 Naming convention

```
{tier?}.{category}.{role}.{variant?}.{state?}
```

| Rule | Example |
|---|---|
| Primitive tokens are prefixed `primitive.` and named by scale step | `primitive.color.blue.600`, `primitive.font.size.14` |
| Semantic tokens start with the category, no prefix | `color.feedback.danger.onContainer`, `space.gutter` |
| `on*` names the content color placed on a fill of the same name | `brand.primary` / `brand.onPrimary` |
| `fill` = solid background, `container` = tinted background, `fg` = text or icon on a surface | `feedback.success.fill`, `.container`, `.fg` |
| States are suffixes in camelCase | `brand.primaryHover`, `brand.primaryPressed` |
| Component tokens are `component.{componentName}.{property}` | `component.productCard.radius` |
| Output names: CSS `--color-brand-on-primary` (kebab); Dart `brandOnPrimary` (camel); both generated | |

---

## 3. Tenant branding: what can be overridden and how the rest is derived

### 3.1 Overridable subset

**Decision:** a tenant controls exactly these inputs. Everything else is derived or fixed by the platform so that accessibility and layout cannot be broken by configuration.

| Input (tenant branding config) | Type | Affects | Constraints |
|---|---|---|---|
| `brand.primary` | sRGB hex | `primitive.color.brand.*` and all `color.brand.primary*`, focus ring, links, map route | Derived tones must pass the contrast gate (3.4) |
| `brand.secondary` | sRGB hex | `primitive.color.brandSecondary.*`, `color.brand.secondary`, `onSecondary` | Same |
| `brand.accent` | sRGB hex | `primitive.color.brandAccent.*`, `color.brand.accent`, `onAccent`, map rider marker | Same; accent is never used for body text |
| `logo` | SVG (preferred) or PNG 3x; variants `light`, `dark`, `mark` (square) | App bar, splash, receipts, admin header | SVG sanitized server-side (no scripts, no external refs); PNG max 512 KB; served from `tenants/{tenantId}/branding/` |
| `font.family` | Family name from the platform font allowlist, or uploaded WOFF2/TTF with license attestation | `primitive.font.family.brand` (Latin only) | Must cover Latin; Arabic and Devanagari always use the platform script fonts unless the uploaded font declares those scripts and passes the glyph coverage check |
| `radius.scale` | One of `0`, `0.5`, `1`, `1.5` | Multiplies `radius.xs..xl` (not `full`) | Fixed steps so layouts stay predictable |

Not overridable: semantic feedback colors (success, warning, danger, info), discount, offer, dietary markers, typography scale, spacing, motion, z-index, breakpoints. Dietary marker *visibility* is configurable per country/tenant (`03-CONFIG-FLAGS-TAX.md`), marker colors are not.

### 3.2 Where derivation runs

**Decision:** derivation runs on the server, in `packages/design-tokens` (TypeScript), when a tenant admin saves branding in `admin-web`. The result (full tonal palettes plus resolved light/dark role values) is stored with the tenant's branding settings and shipped in the bootstrap config. Clients only apply resolved values; they never compute palettes. This guarantees identical colors on Flutter and web and lets the save be rejected before anyone sees a failing theme.

### 3.3 Derivation algorithm

1. **Parse and normalize** the input hex to sRGB, convert to OKLCH.
2. **Generate a tonal palette** of 11 steps (50 to 950) at fixed OKLCH lightness targets, keeping the input hue and scaling chroma down at the extremes; gamut-map each tone back to sRGB by chroma clamping.

   | Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
   |---|---|---|---|---|---|---|---|---|---|---|---|
   | OKLCH L | 0.97 | 0.93 | 0.86 | 0.76 | 0.67 | 0.58 | 0.50 | 0.43 | 0.36 | 0.28 | 0.21 |
   | Chroma factor | 0.30 | 0.45 | 0.70 | 0.90 | 1.00 | 1.00 | 1.00 | 0.95 | 0.85 | 0.70 | 0.55 |

3. **Pick role tones** with contrast checks (WCAG 2.x relative luminance):
   - Light `brand.primary`: if the exact input color reaches >= 4.5:1 against `surface.base`, `background.canvas` and `surface.sunken` (light), and white `onPrimary` reaches >= 4.5:1 on it, use the exact input (brand fidelity). Otherwise take the palette step closest in lightness to the input that passes.
   - Light `primaryHover` / `primaryPressed`: the next one and two darker steps.
   - Dark `brand.primary`: the step closest to L 0.76 that reaches >= 4.5:1 against every dark surface (`neutral.1000`, `.950`, `.900`, `.800`) with `onPrimary` = palette 950 reaching >= 4.5:1 on it.
   - Containers: light `primaryContainer` = 50, `onPrimaryContainer` = 800; dark = 900 and 100. Verified, not assumed.
   - Secondary and accent use the same procedure.
4. **Compute on-colors**: try white (light mode) or the palette 950/900 tone (dark mode); if it fails, try `neutral.950`; choose the higher ratio; it must be >= 4.5:1.
5. **Reject and fall back**: if no step satisfies a role, the role falls back to the platform placeholder palette (the values in `tokens.json`) and the save returns warning `branding.contrast_fallback` listing the roles. The raw brand color is still allowed for decorative, non-text uses (illustrations, splash background behind the logo, map accents) where it is not the only carrier of meaning.
6. **Report fidelity**: if the chosen light primary differs from the input by OKLab distance > 0.08, the admin UI shows a side-by-side "adjusted for readability" notice with both swatches.
7. **Run the full pair gate** (`check_contrast.py` pair list, ported to TypeScript in the same package) on the merged theme in both modes. Any failure blocks the save with error `branding.contrast_failed`.

```ts
// packages/design-tokens/src/derive.ts (blueprint)
import { clampChroma, converter, differenceEuclidean, formatHex, parse, wcagContrast } from 'culori';

const toOklch = converter('oklch');
const distance = differenceEuclidean('oklab');

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Step = (typeof STEPS)[number];
export type Palette = Record<Step, string>;

const LIGHTNESS: Record<Step, number> = {
  50: 0.97, 100: 0.93, 200: 0.86, 300: 0.76, 400: 0.67, 500: 0.58,
  600: 0.5, 700: 0.43, 800: 0.36, 900: 0.28, 950: 0.21,
};
const CHROMA_FACTOR: Record<Step, number> = {
  50: 0.3, 100: 0.45, 200: 0.7, 300: 0.9, 400: 1, 500: 1,
  600: 1, 700: 0.95, 800: 0.85, 900: 0.7, 950: 0.55,
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function tonalPalette(hex: string): Palette {
  if (!HEX.test(hex)) throw new Error('branding.invalid_color');
  const base = toOklch(parse(hex));
  if (!base) throw new Error('branding.invalid_color');
  const hue = base.h ?? 0;
  const chroma = base.c ?? 0;
  const out = {} as Palette;
  for (const step of STEPS) {
    const tone = clampChroma(
      { mode: 'oklch', l: LIGHTNESS[step], c: chroma * CHROMA_FACTOR[step], h: hue },
      'oklch',
    );
    out[step] = formatHex(tone).toUpperCase();
  }
  return out;
}

const passesAll = (fg: string, bgs: readonly string[], min: number) =>
  bgs.every((bg) => wcagContrast(fg, bg) >= min);

export interface RolePick {
  value: string;
  on: string;
  exactInput: boolean;
  adjusted: boolean; // OKLab distance from the input > 0.08
}

/** Picks the light-mode fill for a brand role. Returns null when nothing passes (caller falls back). */
export function pickLightRole(input: string, palette: Palette, lightSurfaces: readonly string[]): RolePick | null {
  const onCandidates = ['#FFFFFF', '#121518'];
  const tryColor = (c: string) => {
    if (!passesAll(c, lightSurfaces, 4.5)) return null;
    const on = onCandidates
      .map((o) => ({ o, r: wcagContrast(o, c) }))
      .sort((a, b) => b.r - a.r)[0];
    return on.r >= 4.5 ? on.o : null;
  };
  const exactOn = tryColor(input.toUpperCase());
  if (exactOn) return { value: input.toUpperCase(), on: exactOn, exactInput: true, adjusted: false };

  const inputL = toOklch(parse(input))?.l ?? 0.5;
  const ordered = [...STEPS].sort((a, b) => Math.abs(LIGHTNESS[a] - inputL) - Math.abs(LIGHTNESS[b] - inputL));
  for (const step of ordered) {
    const on = tryColor(palette[step]);
    if (on) {
      return { value: palette[step], on, exactInput: false, adjusted: distance(input, palette[step]) > 0.08 };
    }
  }
  return null;
}

/** Picks the dark-mode fill: closest to L 0.76 that passes on every dark surface with palette 950/900 as on-color. */
export function pickDarkRole(input: string, palette: Palette, darkSurfaces: readonly string[]): RolePick | null {
  const ordered = [...STEPS].sort((a, b) => Math.abs(LIGHTNESS[a] - 0.76) - Math.abs(LIGHTNESS[b] - 0.76));
  for (const step of ordered) {
    const fill = palette[step];
    if (!passesAll(fill, darkSurfaces, 4.5)) continue;
    const on = [palette[950], palette[900], '#121518']
      .map((o) => ({ o, r: wcagContrast(o, fill) }))
      .sort((a, b) => b.r - a.r)[0];
    if (on.r >= 4.5) return { value: fill, on: on.o, exactInput: false, adjusted: distance(input, fill) > 0.08 };
  }
  return null;
}
```

### 3.4 Shape of the derived theme in bootstrap config

The bootstrap response is defined in `01-ARCHITECTURE.md`; settings storage in `03-CONFIG-FLAGS-TAX.md`. The design-system part is:

```json
{
  "branding": {
    "displayName": "QuickCart",
    "logo": {
      "light": "https://cdn.example.com/tenants/7f1c.../branding/logo-light.svg",
      "dark": "https://cdn.example.com/tenants/7f1c.../branding/logo-dark.svg",
      "mark": "https://cdn.example.com/tenants/7f1c.../branding/mark.svg"
    },
    "font": { "family": "Inter", "files": [] },
    "radiusScale": 1,
    "theme": {
      "version": "2026-10-01T09:30:00Z",
      "palettes": {
        "brand": { "50": "#E8F4F8", "100": "#C9E5EE", "200": "#97CBDD", "300": "#5FAECB", "400": "#2F92B5", "500": "#12789C", "600": "#0B6283", "700": "#0A4F6A", "800": "#093D52", "900": "#072C3B", "950": "#041C26" }
      },
      "light": {
        "brand.primary": "#0B6283", "brand.primaryHover": "#0A4F6A", "brand.primaryPressed": "#093D52",
        "brand.onPrimary": "#FFFFFF", "brand.primaryContainer": "#E8F4F8", "brand.onPrimaryContainer": "#093D52",
        "brand.secondary": "#3A4578", "brand.onSecondary": "#FFFFFF", "brand.accent": "#A6401D", "brand.onAccent": "#FFFFFF"
      },
      "dark": {
        "brand.primary": "#5FAECB", "brand.primaryHover": "#97CBDD", "brand.primaryPressed": "#C9E5EE",
        "brand.onPrimary": "#041C26", "brand.primaryContainer": "#072C3B", "brand.onPrimaryContainer": "#C9E5EE",
        "brand.secondary": "#AEB8DC", "brand.onSecondary": "#161B2F", "brand.accent": "#F28A66", "brand.onAccent": "#40190C"
      },
      "warnings": []
    }
  }
}
```

Dependent roles (`text.link`, `border.focus`, `map.route`, `map.riderMarker`, `commerce.badge.newFill`, `commerce.badge.onNewFill`) are resolved by the clients from the brand roles using the fixed alias table in `design-tokens/README.md` (section 5), so the bootstrap carries only brand roles. The server-side contrast gate checks the dependent roles too, because they are part of the merged theme it validates. Clients cache the last theme by `version` and apply it before the first frame on the next launch (no flash of default branding).

---

## 4. Token specification

All values below are the brand-neutral placeholder set in `design-tokens/tokens.json`. Brand rows change per tenant; every other row is fixed by the platform.

### 4.1 Color primitives

| Ramp | 0 / 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| neutral | `#FFFFFF` / `#F5F6F7` | `#ECEEF0` | `#DADDE1` | `#C2C7CD` | `#9AA1A9` | `#737B84` | `#59616A` | `#434A52` | `#2C3238` | `#1C2025` | `#121518` | `#0B0D0F` |
| brand (placeholder) | `#E8F4F8` | `#C9E5EE` | `#97CBDD` | `#5FAECB` | `#2F92B5` | `#12789C` | `#0B6283` | `#0A4F6A` | `#093D52` | `#072C3B` | `#041C26` | |
| brandSecondary (placeholder) | `#EEF0F8` | `#D6DBEE` | `#AEB8DC` | `#8592C6` | `#6371AF` | `#4A5794` | `#3A4578` | `#2D365E` | `#212845` | `#161B2F` | | |
| brandAccent (placeholder) | `#FEF0EB` | `#FCD9CC` | `#F8B39A` | `#F28A66` | `#E8693F` | `#CC5126` | `#A6401D` | `#813217` | `#5E2411` | `#40190C` | | |
| green | `#E9F7EE` | `#C9EDD6` | `#95DAAE` | `#5CC283` | `#2FA75F` | `#1A8C4A` | `#12733C` | `#0F5C31` | `#0C4626` | `#08321B` | | |
| red | `#FDECEC` | `#FAD1D1` | `#F4A3A3` | `#EC7272` | `#E14848` | `#C92A2A` | `#A82020` | `#861A1A` | `#651414` | `#470E0E` | | |
| amber | `#FFF7E6` | `#FEEBC0` | `#FCD788` | `#F8BD4A` | `#F0A01F` | `#D4840B` | `#A96706` | `#7F4D06` | `#5C3806` | `#3F2705` | | |
| blue | `#EAF2FE` | `#CFE0FC` | `#A0C2F8` | `#6CA0F2` | `#3F7FE8` | `#2563D4` | `#1B4DAE` | `#173D88` | `#132E66` | `#0E2149` | | |
| violet | `#F3EEFD` | `#E3D7FA` | `#C7AFF4` | `#A784EC` | `#8A5DE1` | `#7040CC` | `#5A31A8` | `#472783` | `#351D61` | `#251444` | | |

Alpha primitives: scrim light `#0B0D0F8F` (56%), scrim dark `#000000A3` (64%), press overlay light `#1C202514` (8%), dark `#F5F6F71F` (12%), shadow colors in 4.5.

### 4.2 Semantic colors (light and dark)

"AA" marks pairs verified by `check_contrast.py` (Appendix A). "Exempt" marks inactive UI under WCAG 1.4.3.

| Token | Light | Dark | Use and contrast rule |
|---|---|---|---|
| `background.canvas` | neutral.50 `#F5F6F7` | neutral.1000 `#0B0D0F` | Screen background |
| `surface.base` | neutral.0 `#FFFFFF` | neutral.950 `#121518` | Cards, lists, app bar |
| `surface.raised` | neutral.0 `#FFFFFF` | neutral.900 `#1C2025` | Elevated cards (dark mode shows elevation by lighter tone) |
| `surface.overlay` | neutral.0 `#FFFFFF` | neutral.800 `#2C3238` | Bottom sheets, dialogs, menus |
| `surface.sunken` | neutral.100 `#ECEEF0` | neutral.1000 `#0B0D0F` | Input fills, grouped backgrounds |
| `surface.inverse` | neutral.900 `#1C2025` | neutral.50 `#F5F6F7` | Snackbar, tooltip |
| `text.primary` | neutral.900 `#1C2025` | neutral.50 `#F5F6F7` | AA on all surfaces |
| `text.secondary` | neutral.700 `#434A52` | neutral.300 `#C2C7CD` | AA on all surfaces |
| `text.tertiary` | neutral.600 `#59616A` | neutral.400 `#9AA1A9` | Helper, placeholder, unit size; AA on all surfaces |
| `text.disabled` | neutral.400 `#9AA1A9` | neutral.600 `#59616A` | Exempt; never the only carrier of information |
| `text.inverse` | neutral.0 `#FFFFFF` | neutral.950 `#121518` | AA on `surface.inverse` |
| `text.link` | brand.600 `#0B6283` | brand.200 `#97CBDD` | AA on all surfaces; underlined in body copy |
| `border.subtle` | neutral.200 `#DADDE1` | neutral.800 `#2C3238` | Decorative dividers only |
| `border.default` | neutral.300 `#C2C7CD` | neutral.700 `#434A52` | Decorative card outlines only |
| `border.strong` | neutral.500 `#737B84` | neutral.500 `#737B84` | Input, checkbox, chip boundaries; >= 3:1 on all surfaces |
| `border.focus` | brand.600 `#0B6283` | brand.300 `#5FAECB` | Focus ring; >= 3:1 on all surfaces |
| `brand.primary` | brand.600 `#0B6283` | brand.300 `#5FAECB` | Primary CTA fill, Add button outline and label; AA as text on all surfaces |
| `brand.primaryHover` | brand.700 `#0A4F6A` | brand.200 `#97CBDD` | Web hover |
| `brand.primaryPressed` | brand.800 `#093D52` | brand.100 `#C9E5EE` | Pressed |
| `brand.onPrimary` | neutral.0 `#FFFFFF` | brand.950 `#041C26` | AA on primary, hover, pressed |
| `brand.primaryContainer` | brand.50 `#E8F4F8` | brand.900 `#072C3B` | Selected chip, "new" badge, info banners in brand tone |
| `brand.onPrimaryContainer` | brand.800 `#093D52` | brand.100 `#C9E5EE` | AA on container |
| `brand.secondary` / `onSecondary` | `#3A4578` / `#FFFFFF` | `#AEB8DC` / `#161B2F` | Secondary CTA, section headers; AA |
| `brand.accent` / `onAccent` | `#A6401D` / `#FFFFFF` | `#F28A66` / `#40190C` | Highlights, rider marker; AA |
| `feedback.success.fg` | green.700 `#0F5C31` | green.300 `#5CC283` | Text/icon on surfaces; AA |
| `feedback.success.fill` / `onFill` | `#12733C` / `#FFFFFF` | `#5CC283` / `#08321B` | Solid success; AA |
| `feedback.success.container` / `onContainer` | `#E9F7EE` / `#0C4626` | `#08321B` / `#C9EDD6` | Banners; AA |
| `feedback.warning.fg` | amber.700 `#7F4D06` | amber.300 `#F8BD4A` | AA |
| `feedback.warning.fill` / `onFill` | `#F0A01F` / `#121518` | `#F8BD4A` / `#3F2705` | Dark text on amber in both modes; AA |
| `feedback.warning.container` / `onContainer` | `#FFF7E6` / `#5C3806` | `#3F2705` / `#FEEBC0` | AA |
| `feedback.danger.fg` | red.600 `#A82020` | red.200 `#F4A3A3` | AA |
| `feedback.danger.fill` / `onFill` | `#A82020` / `#FFFFFF` | `#EC7272` / `#470E0E` | AA |
| `feedback.danger.container` / `onContainer` | `#FDECEC` / `#651414` | `#470E0E` / `#FAD1D1` | AA |
| `feedback.info.fg` | blue.600 `#1B4DAE` | blue.200 `#A0C2F8` | AA |
| `feedback.info.fill` / `onFill` | `#1B4DAE` / `#FFFFFF` | `#6CA0F2` / `#0E2149` | AA |
| `feedback.info.container` / `onContainer` | `#EAF2FE` / `#132E66` | `#0E2149` / `#CFE0FC` | AA |
| `commerce.price.current` | neutral.900 `#1C2025` | neutral.50 `#F5F6F7` | Selling price; AA |
| `commerce.price.mrp` | neutral.600 `#59616A` | neutral.400 `#9AA1A9` | Struck-through MRP; still AA (strikethrough reduces legibility) |
| `commerce.price.perUnit` | neutral.600 `#59616A` | neutral.400 `#9AA1A9` | "per 100 g"; AA |
| `commerce.price.saving` | green.700 `#0F5C31` | green.300 `#5CC283` | "You save X"; AA |
| `commerce.discount.fill` / `onFill` | blue.600 `#1B4DAE` / `#FFFFFF` | blue.200 `#A0C2F8` / `#0E2149` | Percent/flat off badge; AA; fill >= 3:1 vs card |
| `commerce.offer.fill` / `onFill` | violet.600 `#5A31A8` / `#FFFFFF` | violet.200 `#C7AFF4` / `#251444` | Coupon, bank offer tags; AA |
| `commerce.offer.container` / `onContainer` | `#F3EEFD` / `#472783` | `#251444` / `#E3D7FA` | Offer strips; AA |
| `commerce.badge.newFill` / `onNewFill` | brand.50 / brand.800 | brand.900 / brand.100 | AA |
| `commerce.badge.bestsellerFill` / `onBestsellerFill` | amber.100 `#FEEBC0` / amber.900 `#3F2705` | amber.800 `#5C3806` / amber.50 `#FFF7E6` | AA |
| `commerce.badge.limitedStockFill` / `onLimitedStockFill` | red.50 `#FDECEC` / red.700 `#861A1A` | red.900 `#470E0E` / red.100 `#FAD1D1` | AA |
| `commerce.badge.outOfStockFill` / `onOutOfStockFill` | neutral.700 `#434A52` / `#FFFFFF` | neutral.200 `#DADDE1` / neutral.950 `#121518` | AA; fill >= 3:1 vs card |
| `commerce.rating.fill` / `onFill` | green.700 `#0F5C31` / `#FFFFFF` | green.300 `#5CC283` / green.900 `#08321B` | Rating pill; AA |
| `commerce.rating.star` | amber.600 `#A96706` | amber.400 `#F0A01F` | Graphic; >= 3:1 on all surfaces |
| `dietary.veg` | green.600 `#12733C` | green.400 `#2FA75F` | Marker graphic; >= 3:1; always with shape + label |
| `dietary.nonVeg` | red.600 `#A82020` | red.400 `#E14848` | Same |
| `dietary.egg` | amber.600 `#A96706` | amber.400 `#F0A01F` | Same |
| `dietary.other` | neutral.600 `#59616A` | neutral.400 `#9AA1A9` | Halal, vegan, gluten-free etc. (icon + label) |
| `overlay.scrim` | `#0B0D0F8F` | `#000000A3` | Behind sheets and dialogs |
| `overlay.pressed` | `#1C202514` | `#F5F6F71F` | Ink/press layer |
| `skeleton.base` / `highlight` | `#ECEEF0` / `#F5F6F7` | `#1C2025` / `#2C3238` | Shimmer |
| `map.route` | brand.600 | brand.300 | Route polyline; >= 3:1 |
| `map.riderMarker` | brandAccent.600 `#A6401D` | brandAccent.300 `#F28A66` | >= 3:1 |
| `map.destination` | neutral.900 | neutral.50 | >= 3:1 |
| `sla.onTrack` / `atRisk` / `breached` | `#0F5C31` / `#7F4D06` / `#A82020` | `#5CC283` / `#F8BD4A` / `#F4A3A3` | Store and rider timers; AA as text; always with icon and text |

**Decision:** dietary markers keep fixed colors regardless of tenant brand because they carry regulated meaning in some countries. Which markers are shown, and their labels, come from country/tenant settings (`03-CONFIG-FLAGS-TAX.md`). Default marker shapes: veg = filled circle in a square outline; non-veg = filled triangle in a square outline; egg = filled circle in a square outline with an "Egg" text label; other = icon from the dietary icon set with a text label.

### 4.3 Typography

**Font stacks** (`primitive.font.family.*`):

| Script / locale | Primary | Fallbacks | Notes |
|---|---|---|---|
| Latin (`en`, and default `brand`) | Inter (tenant may replace) | Noto Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif | Enable `tnum` for prices and timers |
| Arabic (`ar`) | Noto Sans Arabic | Noto Naskh Arabic, Segoe UI, Tahoma, sans-serif | Letter spacing always 0 (breaks joining); no synthetic italics |
| Devanagari (`hi`, `mr`, `ne`) | Noto Sans Devanagari | Mukta, Nirmala UI, sans-serif | Taller ascenders and matras; see line-height factors |
| Monospace (admin, ids) | JetBrains Mono | Roboto Mono, ui-monospace, Menlo, Consolas, monospace | Order ids, SKU codes |

Bundling: Flutter bundles Inter, Noto Sans Arabic and Noto Sans Devanagari (subset to the scripts used; variable font where available) as assets so first paint never waits on a font download. Web self-hosts WOFF2 with `font-display: swap` and `unicode-range` per script so an English-only session never downloads Arabic or Devanagari files.

**Scale** (Latin metrics; sizes in sp on Flutter, px on web, scale with user text size):

| Token | Size | Weight | Line height | Letter spacing | Typical use |
|---|---|---|---|---|---|
| `displayLg` | 40 | 700 | 1.20 (48) | -0.5 | Order success, onboarding |
| `displayMd` | 32 | 700 | 1.25 (40) | -0.25 | Wallet balance, ETA hero |
| `headlineLg` | 28 | 700 | 1.29 (36) | 0 | Screen titles (large) |
| `headlineMd` | 24 | 600 | 1.33 (32) | 0 | Section headers |
| `titleLg` | 20 | 600 | 1.40 (28) | 0 | App bar title, sheet title |
| `titleMd` | 18 | 600 | 1.33 (24) | 0 | Card titles (list variant) |
| `titleSm` | 16 | 600 | 1.375 (22) | 0 | Carousel headers |
| `bodyLg` | 16 | 400 | 1.50 (24) | 0 | Product description, forms |
| `bodyMd` | 14 | 400 | 1.43 (20) | 0 | Default body, product name on card |
| `bodySm` | 13 | 400 | 1.38 (18) | 0 | Secondary info |
| `labelLg` | 16 | 600 | 1.25 (20) | 0.1 | Buttons, cart bar |
| `labelMd` | 14 | 600 | 1.29 (18) | 0.1 | Stepper count, chips |
| `labelSm` | 12 | 600 | 1.33 (16) | 0.2 | Tabs, small buttons |
| `caption` | 12 | 400 | 1.33 (16) | 0.2 | Unit size, timestamps |
| `badge` | 11 | 700 | 1.45 (16) | 0.3 | Badges only (uppercase not used; see 5) |
| `priceLg` | 20 | 700 | 1.20 (24) | 0 | PDP price, cart total |
| `priceMd` | 16 | 700 | 1.25 (20) | 0 | Card price |
| `priceSm` | 14 | 700 | 1.29 (18) | 0 | Line items |
| `mrp` | 12 | 400 | 1.33 (16) | 0 | Struck-through list price |

**Script adjustments (applied by the theme builder by locale, not by components):**

| Script | Line-height factor | Minimum body line height | Letter spacing | Other |
|---|---|---|---|---|
| Latin | 1.00 | 1.43 | As table | |
| Arabic | 1.15 | 1.50 | Forced 0 | Size +1 sp for `caption`, `badge`, `bodySm` (Arabic glyphs read small at the same em size) |
| Devanagari | 1.20 | 1.60 | Forced 0 | Size +1 sp for `caption`, `badge`; avoid weights below 400 |

### 4.4 Spacing (4-point scale)

| Token | Value | Token | Value |
|---|---|---|---|
| `space.0` | 0 | `space.6` | 24 |
| `space.0_5` | 2 | `space.8` | 32 |
| `space.1` | 4 | `space.10` | 40 |
| `space.2` | 8 | `space.12` | 48 |
| `space.3` | 12 | `space.16` | 64 |
| `space.4` | 16 | `space.20` | 80 |
| `space.5` | 20 | | |

Aliases: `space.gutter` = 16 (phone side padding), `space.gutterTablet` = 24, `space.gridGap` = 8, `space.cardInset` = 8, `space.sectionGap` = 24. Off-scale values are a design QA failure except optical 1-2 px corrections inside icons.

### 4.5 Radius

| Token | Base value (scale 1.0) | At scale 0 / 0.5 / 1.5 | Use |
|---|---|---|---|
| `radius.none` | 0 | 0 / 0 / 0 | Full-bleed images |
| `radius.xs` | 4 | 0 / 2 / 6 | Badges, skeleton blocks |
| `radius.sm` | 8 | 0 / 4 / 12 | Buttons, inputs, stepper, toast |
| `radius.md` | 12 | 0 / 6 / 18 | Product cards, cart bar, banners |
| `radius.lg` | 16 | 0 / 8 / 24 | Large cards, dialogs |
| `radius.xl` | 24 | 0 / 12 / 36 | Bottom sheet top corners |
| `radius.full` | 9999 | unchanged | Chips, avatars, pills |

### 4.6 Elevation and shadows

| Token | Light | Dark | Use |
|---|---|---|---|
| `shadow.0` | none | none | Flat cards with `border.subtle` |
| `shadow.1` | 0 1 3 0 neutral.1000 @12% | 0 1 2 0 black @40% | Product card on canvas (optional) |
| `shadow.2` | 0 4 12 -2 neutral.1000 @12% | 0 2 8 0 black @40% | Sticky headers, floating search |
| `shadow.3` | 0 8 24 -4 neutral.1000 @20% | 0 6 16 0 black @60% | Cart bar, FAB, popovers |
| `shadow.4` | 0 16 40 -8 neutral.1000 @20% | 0 12 32 0 black @60% | Bottom sheets, dialogs |

Format: offsetX offsetY blur spread color. **Decision:** in dark mode elevation is carried mainly by surface tone (`surface.base` < `raised` < `overlay`), shadows are secondary. Flutter maps shadows to `BoxShadow` lists, not Material `elevation`, so both platforms match.

### 4.7 Motion

| Token | Value | Use |
|---|---|---|
| `motion.duration.instant` | 0 ms | Reduced-motion replacement |
| `motion.duration.micro` | 100 ms | Press feedback, count bump |
| `motion.duration.short` | 150 ms | Add button to stepper morph, chip select, checkbox |
| `motion.duration.medium` | 250 ms | Cart bar slide-in, toast in/out, tab switch |
| `motion.duration.long` | 300 ms | Bottom sheet, page transition |
| `motion.duration.xlong` | 500 ms | Success checkmark draw, optional fly-to-cart |
| `motion.duration.shimmer` | 1200 ms | One skeleton sweep |
| `motion.duration.mapTick` | 1500 ms | Rider marker interpolation window |
| `motion.easing.standard` | cubic-bezier(0.2, 0, 0, 1) | Most transitions |
| `motion.easing.enter` | cubic-bezier(0, 0, 0, 1) | Elements entering (decelerate) |
| `motion.easing.exit` | cubic-bezier(0.3, 0, 1, 1) | Elements leaving (accelerate) |
| `motion.easing.emphasized` | cubic-bezier(0.2, 0, 0, 1.2) | Count bump overshoot only |
| `motion.easing.linear` | linear | Shimmer, map interpolation, progress |

**Reduced motion** (Flutter `MediaQuery.disableAnimationsOf(context)`; web `prefers-reduced-motion: reduce`; plus the in-app setting `ui.reduce_motion`, proposed key to be registered in `03-CONFIG-FLAGS-TAX.md` as a user preference):

| Motion | Reduced-motion behaviour |
|---|---|
| Transforms (slide, scale, fly-to-cart, overshoot) | Removed; replaced by a cross-fade of `micro` (100 ms) or instant |
| Shimmer | Static skeleton (base color only), no sweep |
| Page transitions | Fade 150 ms, no slide |
| Map marker interpolation | Kept (it conveys position, not decoration) but linear and without camera follow animation |
| Success checkmark draw | Checkmark appears fully drawn, no draw-on stroke |
| Carousel autoplay | Disabled |

### 4.8 Z-index layers

| Token | Value | Layer |
|---|---|---|
| `zIndex.base` | 0 | Content |
| `zIndex.raised` | 10 | Card hover, selected row |
| `zIndex.sticky` | 100 | Sticky headers, filter bars |
| `zIndex.cartBar` | 200 | Sticky cart bar, bottom nav |
| `zIndex.dropdown` | 300 | Menus, autocomplete |
| `zIndex.overlay` | 400 | Scrim |
| `zIndex.sheet` | 500 | Bottom sheets, side drawers |
| `zIndex.dialog` | 600 | Modal dialogs |
| `zIndex.toast` | 700 | Toasts and snackbars |
| `zIndex.tooltip` | 800 | Tooltips |
| `zIndex.debug` | 9000 | Developer overlays (non-production builds) |

Flutter uses widget order and `Overlay` rather than numeric z-index; the table defines which overlay entry sits above which.

### 4.9 Breakpoints

| Token | Min width | Devices | Layout |
|---|---|---|---|
| `breakpoint.xs` | 0 | Small phones | 2-column product grid |
| `breakpoint.sm` | 360 | Standard phones | 2 columns (3 columns if width >= 412 and text scale <= 1.3) |
| `breakpoint.md` | 600 | Unfolded foldables, small tablets, landscape phones | 3-4 columns; master-detail optional |
| `breakpoint.lg` | 840 | Tablets (store app two-pane) | Navigation rail + two panes |
| `breakpoint.xl` | 1200 | Desktop dashboards | 12-column grid, side nav |
| `breakpoint.xxl` | 1600 | Wide dashboards | Max content width 1440, extra columns for tables |

Flutter uses window width from `MediaQuery.sizeOf(context).width` (logical pixels), not device type.

### 4.10 Icon sizes

| Token | Size | Use |
|---|---|---|
| `size.icon.xs` | 12 | Inline in badges |
| `size.icon.sm` | 16 | Inline with caption/body text, dietary markers |
| `size.icon.md` | 20 | Chips, list rows, stepper glyphs |
| `size.icon.lg` | 24 | App bar, bottom nav, default |
| `size.icon.xl` | 32 | Category tiles fallback, empty-state small |
| `size.icon.xxl` | 48 | Empty and error states |

Icon set: one outlined set (Material Symbols Rounded, weight 400, grade 0, optical size matched to rendered size) bundled as a subset font on Flutter and SVG sprites on web. Icon-only buttons always have an accessible label.

Other sizes: `size.touchTarget` 48, `size.touchTargetDense` 40 (admin web), `size.appBar` 56, `size.cartBar` 64, `size.bottomNav` 64, `size.stepperHeight` 36 (visual; hit area padded to 48), `size.productImageGrid` 120, `size.productImageList` 88, `size.focusRing` 2, `size.focusOffset` 2.

### 4.11 Opacity

| Token | Value | Use |
|---|---|---|
| `opacity.disabled` | 0.38 | Disabled controls (content and container) |
| `opacity.outOfStockImage` | 0.45 | Product image on OOS cards (text stays full contrast) |
| `opacity.hover` | 0.08 | Hover state layer (web) |
| `opacity.pressed` | 0.12 | Pressed state layer |
| `opacity.dragged` | 0.16 | Drag state layer (admin tables, banner ordering) |
| `opacity.scrim` | 0.56 | Reference value for the light scrim |

**Decision:** opacity is never applied to text that must remain readable (prices, OOS label, badges). Reduce emphasis by switching to a lower-emphasis text token instead.

---

## 5. Discount and badge system

### 5.1 Badge catalogue

| Badge | Text pattern (translation key) | Fill / content tokens | Icon | Priority |
|---|---|---|---|---|
| Percent off | "{percent}% OFF" (`badge.percent_off`) | `commerce.discount.fill` / `onFill` | none | 1 |
| Flat off | "{amount} OFF" (`badge.flat_off`), amount formatted per currency | `commerce.discount.fill` / `onFill` | none | 1 |
| Offer (coupon, bank, bundle) | "Buy 2 Get 1", "Extra 10% with code" (`badge.offer.*`) | `commerce.offer.fill` / `onFill` (card); `offer.container` / `onContainer` (strip) | `local_offer` | 2 |
| Limited stock | "Only {n} left" (`badge.limited_stock`) | `commerce.badge.limitedStockFill` / `onLimitedStockFill` | `inventory` | 3 |
| Bestseller | "Bestseller" (`badge.bestseller`) | `commerce.badge.bestsellerFill` / `onBestsellerFill` | none | 4 |
| New | "New" (`badge.new`) | `commerce.badge.newFill` / `onNewFill` | none | 5 |
| Out of stock | "Out of stock" (`badge.out_of_stock`) | `commerce.badge.outOfStockFill` / `onOutOfStockFill` | none | Overrides all |

All pairs are verified AA (>= 4.5:1) in both themes, and solid fills (discount, offer, out of stock) are >= 3:1 against `surface.base` so the badge shape is visible (Appendix A).

### 5.2 Rules

| Rule | Detail |
|---|---|
| Max badges per card | 1 top-start badge (highest priority) + 1 inline badge (limited stock) under the price. Never more than 2. |
| Placement | Discount/offer/new/bestseller: top-start corner of the image, inset 0, corner radius `radius.xs` on the inner corner only (badge sits flush with the card corner). Limited stock: under the price row. Out of stock: centered over the image, replaces all others. |
| Discount source | Percent shown when `(mrp - price) / mrp >= 5%`; flat shown instead when the tenant setting prefers flat or when percent < 5% and amount is meaningful (setting `ui.discount_badge_mode`: `percent` / `flat` / `auto`; proposed key for `03-CONFIG-FLAGS-TAX.md`). Rounded down, never up. Computed from minor units, never floats. |
| Minimum size | Height 20 dp, horizontal padding 4 dp, `typography.badge` (11 sp, bold). At 200% text scale the badge grows in height and may wrap to 2 lines; it never truncates the number. |
| Case | Sentence case. No uppercase transform (breaks in Arabic/Devanagari, hurts readability); "OFF" is part of the translated string where a language uses it. |
| Color independence | Badges are text, never color alone. OOS also sets image opacity and swaps the Add button for "Notify me". |
| RTL | "Top-start" means top-right in RTL. Numbers inside badges are bidi-isolated (11.6). |
| Screen readers | Badge text is merged into the card's semantic label in priority order: name, unit, price, MRP, discount, stock state. |

---

## 6. Loading: skeleton vs spinner vs optimistic UI

### 6.1 Decision table

| Situation | Pattern | Why |
|---|---|---|
| Screen or section whose layout is known (home, category grid, PDP, cart, order list) | Skeleton | Layout is stable; perceived speed is highest |
| User-initiated local change likely to succeed (add to cart, quantity change, favourite, stock toggle in store app) | Optimistic UI with rollback | Feedback within 100 ms; server confirms later |
| Action with an unknown or consequential result (place order, payment, refund, assign rider) | Inline progress in the triggering button (spinner replaces label, button keeps its width) + disabled re-submit | User must not think it succeeded early; idempotency key on retry (contract section 6) |
| Pull-to-refresh | Platform refresh indicator | Expected affordance |
| Pagination / infinite scroll | 1 row of skeleton cards at the end of the list | No layout jump |
| Full-screen blocking spinner | Never in customer app; allowed only during bootstrap before the first frame of a cold start without cache (splash) | |
| Image loading | Fixed-ratio box with BlurHash or `skeleton.base`, then 150 ms fade-in | No layout shift |

### 6.2 Skeleton shapes per component

| Component | Skeleton |
|---|---|
| ProductCard grid | Image square (1:1, `radius.sm`), 2 text bars (100% and 60% width, 12 dp high), price bar 40%, Add button outline block 72x36 at bottom-end |
| ProductCard list | Image 88x88 at start, 3 bars on the right, stepper block at end |
| CategoryTile | Circle or rounded square 64 dp + 1 bar 70% width |
| BannerCarousel | Full-width block at banner aspect ratio (default 2.4:1), `radius.md` |
| AppBar address | 1 bar 140 dp + ETA chip pill 72x24 |
| Order timeline | 4 rows of dot + bar |
| DataTable (web) | Header row real; 8 body rows of bars matching column widths |
| StatTile (web) | Label bar + large value bar + sparkline block |

Skeleton blocks use `radius.xs` unless mirroring a rounder element; text bars have the same height as the text line they replace (line height, not font size) so the swap causes no shift.

### 6.3 Timing

| Parameter | Value |
|---|---|
| Shimmer sweep | `motion.duration.shimmer` 1200 ms, linear, gradient `skeleton.base` -> `skeleton.highlight` -> `skeleton.base`, angle follows reading direction (start to end; mirrored in RTL) |
| Delay before showing skeleton | 0 ms on first load; on refresh of existing content keep old content (stale-while-revalidate) and show no skeleton |
| Minimum display time | None (avoid artificial delay); if data arrives within 100 ms of mount, skip the skeleton by rendering content directly |
| Maximum skeleton time | 8 s, then switch the section to ErrorState with retry (network) or keep cached content with an offline toast |
| Content swap | Cross-fade 150 ms; reduced motion: instant |
| Layout stability | Skeleton and content share the same size constraints. Target CLS <= 0.1 on web; on Flutter, zero item-position change during swap (checked by golden tests, section 14) |

---

## 7. Micro-animations and haptics

| Animation | Spec | Duration / easing tokens | Haptic | Reduced motion |
|---|---|---|---|---|
| Add to cart: button morph to stepper | "Add" outline button cross-fades and expands to filled stepper "- 1 +" in the same footprint (min width 72 dp, height 36 dp, hit area 48 dp) | `short` 150 ms, `standard` | `HapticFeedback.lightImpact` on first add | Instant swap |
| Count bump | Number scales 1.0 -> 1.15 -> 1.0 and slides vertically (up on increment, down on decrement) | `micro` 100 ms, `emphasized` | `selectionClick` on each change | Number changes with no transform |
| Max quantity reached | Plus button shakes horizontally 4 dp twice; toast "Max {n} per order" | `micro` x 2 | `HapticFeedback.heavyImpact` | No shake; toast only |
| Fly-to-cart (optional, setting `ui.animation.fly_to_cart`, default off; proposed key) | Product thumbnail clone (40 dp) travels along a quadratic curve to the cart bar, scaling to 0.4 | `xlong` 500 ms, `standard`; never blocks input | none | Disabled |
| Cart bar slide-in | Slides up from below the bottom nav on first item, item count and total update in place afterwards | `medium` 250 ms, `enter`; exit `medium`, `exit` | none | Fade 100 ms |
| Cart total update | Total cross-fades; savings line counts up only if delta >= 1 major unit | `short` | none | Instant |
| Success checkmark (order placed, payment success, POD done) | Circle scales in (200 ms) then check stroke draws (300 ms) | `xlong` 500 ms total | `HapticFeedback.mediumImpact` at stroke end | Static check shown |
| Pull-to-refresh | Platform indicator; content offset follows finger 1:1 then springs back | Platform defaults | `selectionClick` at trigger threshold | Same (no extra motion) |
| Bottom sheet | Slides up with scrim fade | `long` 300 ms, `enter`; dismiss 250 ms, `exit` | none | Fade 150 ms |
| Toast | Slides 16 dp + fade | `medium` | none | Fade |
| Rider marker interpolation | Between location pings, marker position is linearly interpolated over `mapTick` (1500 ms), bearing rotated along the shortest arc; if a ping is > 10 s late, marker stops and shows "Updating location" | `mapTick`, `linear` | none | Interpolation kept; camera follow disabled |
| Order status step change | Timeline dot fills, connector line grows to next step | `medium` | `lightImpact` (customer app, foreground only) | Instant |
| Store app new order | Card slides in at top of queue, highlight pulse 2x | `medium` + 2 x 600 ms pulse | Strong vibration pattern + sound (configurable per store) | No pulse; sound and vibration kept (operational alert) |
| Rider app new offer | Full-width OfferCard rises from bottom | `long` | Repeating vibration until accept/decline/timeout | No slide; vibration kept |

**Haptics rules:** at most one haptic per user action; none on scroll or passive updates in the customer app; respect the OS setting and the in-app toggle `ui.haptics.enabled` (proposed user preference key); operational alerts in store and rider apps are exempt from the in-app toggle but follow OS do-not-disturb rules (documented per store setting).

---

## 8. Component library

Format for each component: anatomy, states, sizes, accessibility, RTL. Shared rules: every interactive element has a 48 dp hit area; every state change is announced or reflected in semantics; all horizontal paddings and alignment use start/end.

### 8.1 Customer app

#### AppBar with address selector and ETA chip

| Aspect | Spec |
|---|---|
| Anatomy | Start: delivery-mode label ("Delivery in") + ETA chip (`labelMd`, `brand.primaryContainer` fill, e.g. "12 min"); below: address line (`bodySm`, 1 line, ellipsis) with chevron-down; end: profile/avatar button. Second row: SearchBar (pinned when collapsed). |
| States | Default; collapsed on scroll (address row hides, search pins, height 56 -> search only); store closed (ETA chip becomes `feedback.warning.container` "Opens 7:00"); unserviceable (chip "Not deliverable here", tap opens address sheet); loading (skeleton bars). |
| Sizes | Expanded 112 dp + status bar; collapsed 56 dp. |
| Accessibility | Address button label: "Delivering to {address label}. Change address". ETA chip is part of that label, not a separate stop. Header semantics on the address row. |
| RTL | Chip and address align start; chevron does not mirror (it points down). |

#### SearchBar

| Aspect | Spec |
|---|---|
| Anatomy | Leading search icon, input with rotating placeholder hints ("Search for milk", cycled every 3 s, paused for screen readers and reduced motion), trailing clear button and optional voice button (flag-controlled by platform availability). |
| States | Idle (tap navigates to search screen with keyboard up), focused, typing (results update with 150 ms debounce), no results (EmptyState with suggestions), offline. |
| Sizes | Height 48 dp, `radius.sm`, fill `surface.sunken`, border `border.strong` on focus `border.focus` 2 dp. |
| Accessibility | Role search/text field; placeholder is not the label ("Search products" label is always present); result count announced politely ("24 results"). |
| RTL | Search icon at start (does not mirror: magnifier is not directional); text direction follows input content (`TextDirection` auto-detected per field on first strong character). |

#### CategoryTile

| Aspect | Spec |
|---|---|
| Anatomy | Image (64 dp square, `radius.md`, `surface.sunken` background) + label (`labelSm`, max 2 lines, centered). |
| States | Default, pressed (scale 0.97 + `overlay.pressed`), focused (ring), loading (skeleton). |
| Sizes | Grid of 4 per row at 360 dp; 5-6 on `md`. |
| Accessibility | Label is the accessible name; image decorative. Button role. |
| RTL | Grid flows start to end. |

#### ProductCard (grid and list)

| Aspect | Spec |
|---|---|
| Anatomy (grid) | Image 1:1 with top-start badge; dietary marker (top-end of image, 16 dp); product name (`bodyMd`, max 2 lines); unit size (`caption`, `text.tertiary`, e.g. "500 g", "6 x 330 ml"); price row: price (`priceMd`, `price.current`) + MRP (`mrp` style, strikethrough, `price.mrp`); optional per-unit price (`caption`); Add control at bottom-end; optional inline badge (limited stock); optional delivery-time or offer strip. |
| Anatomy (list) | Image 88 dp at start; name, unit, price row in the middle; Add/stepper at end vertically centered; used in search results, reorder, cart suggestions. |
| States | Default; in-cart (stepper shows quantity); max reached (plus disabled, reason in semantics); out of stock (image at `opacity.outOfStockImage`, OOS badge, Add replaced by "Notify me" text button, substitute hint "Similar items" link if `product_substitutes` exist); age-restricted (lock badge "18+" when `catalog.age_restricted_items` is on, Add opens verification sheet); price changed since last view (price briefly highlighted with `feedback.info.container` for 1 s, no motion if reduced); loading (skeleton). |
| Sizes | Grid card min width 156 dp (2 columns at 360 dp with 16 gutter and 8 gap), card padding `space.2`, radius `radius.md`, border `border.subtle` or `shadow.1` (tenant preset). List row min height 112 dp. |
| Accessibility | Card is one focus stop for "open product" with a merged label: "{name}, {unit}, {price}, was {mrp}, {discount}, {stock state}". The Add/stepper is a separate focus stop (never nested inside the card's tap target semantics). Prices read with currency name per locale. |
| RTL | Badge top-start (top-right), marker top-end, Add at bottom-end (bottom-left). Price and MRP order follows reading direction; each amount is bidi-isolated. |

#### QuantityStepper

| Aspect | Spec |
|---|---|
| Anatomy | Minus button, count (`labelMd`, tabular figures), plus button; filled `component.stepper.background`. At quantity 1 the minus shows a delete glyph only if the tenant setting `ui.stepper_delete_icon` is on (proposed key); otherwise minus. |
| States | Idle "Add" (outline), active (filled stepper), pending (count updated optimistically; a 2 dp progress underline appears only if the server takes > 800 ms), error (revert count, toast with reason e.g. `inventory.insufficient_stock`), max reached (plus disabled), disabled (OOS). |
| Sizes | Visual 36 dp high, min width 96 dp in stepper form; each button hit area 48x48 (extends outside the visual bounds). Large variant on PDP: 48 dp visual. |
| Accessibility | Exposed as an adjustable control: "Quantity, {n}, {product name}"; increase/decrease actions (`Semantics(onIncrease, onDecrease)` in Flutter; `role="spinbutton"` with `aria-valuenow/min/max` or two labeled buttons plus `aria-live="polite"` count on web). Changes announced politely. |
| RTL | Order stays [minus][count][plus] in reading order, which places plus at the end; in RTL plus appears on the left. Glyphs do not mirror. |

#### CartBar (sticky)

| Aspect | Spec |
|---|---|
| Anatomy | Start: item thumbnails stack (max 3) + "{n} items" + total (`labelLg`, tabular); end: "View cart" with forward chevron. Above it, optional thin progress strip "Add {amount} for free delivery" (`offer.container`). |
| States | Hidden (empty cart), entering (slide-in), visible, updating (total cross-fade), blocked (store closed: `feedback.warning.container` "Store opens at 7:00"), minimum order not met (secondary text "Min order {amount}"). |
| Sizes | 64 dp high, side margins `space.4`, bottom margin above bottom nav `space.2`, radius `radius.md`, `shadow.3`, z-layer `cartBar`. Respects bottom safe area. |
| Accessibility | Single button: "View cart, {n} items, total {amount}". Content below gets bottom padding equal to cart bar height so nothing is hidden behind it. |
| RTL | Chevron mirrors (directional forward). Thumbnails stack from start. |

#### BannerCarousel

| Aspect | Spec |
|---|---|
| Anatomy | Full-width banners (aspect from `banners` config, default 2.4:1), `radius.md`, page indicator dots below (active dot elongated). |
| States | Autoplay every 5 s (paused on touch, focus, screen reader active, reduced motion, or when < 50% visible); loading skeleton; single banner (no dots). |
| Sizes | Width = screen - 2 x gutter on phones; 2-up on `md`+. |
| Accessibility | Each banner has alt text from CMS (required field in admin-web); dots are not focusable; "Banner {i} of {n}" announced. Text baked into images is not allowed for prices (must be live text overlay). |
| RTL | Swipe direction and page order reverse. |

#### ProductCarousel

| Aspect | Spec |
|---|---|
| Anatomy | Header row: title (`titleSm`) + "See all" text button at end; horizontally scrolling ProductCards (grid variant, width 140 dp, partial next card visible as scroll affordance). |
| States | Loading (3 skeleton cards), empty (section hidden, never an empty carousel), error (section hidden; logged). |
| Accessibility | Section is a labelled list ("Bestsellers, list, 12 items"). |
| RTL | Scroll starts at the right; "See all" chevron mirrors. |

#### Chip / FilterChip

| Aspect | Spec |
|---|---|
| Anatomy | Optional leading icon, label (`labelMd`), optional trailing count or dropdown chevron. |
| States | Default (`surface.base`, `border.strong`), selected (`brand.primaryContainer` fill, `onPrimaryContainer` text, leading check icon so state is not color-only), pressed, disabled, focused. |
| Sizes | 32 dp visual height, 48 dp hit height, `radius.full`, horizontal padding 12 dp. |
| Accessibility | Toggle semantics with selected state; filter count announced. |
| RTL | Row scrolls from start; check icon at start. |

#### BottomSheet

| Aspect | Spec |
|---|---|
| Anatomy | Drag handle (32x4, `border.default`), optional title row with close button at end, content, optional sticky footer action. |
| States | Collapsed/half/expanded snap points (25/50/90% height), dragging, dismissing. |
| Sizes | Top radius `radius.xl`; max width 640 dp centered on `md`+; `surface.overlay`, `shadow.4`, scrim `overlay.scrim`. |
| Accessibility | Modal: focus moves to title on open, is trapped, returns to the trigger on close; close button always present (drag-only dismissal fails WCAG 2.5.7); Escape closes on web. |
| RTL | Close button at end. |

#### Toast / Snackbar

| Aspect | Spec |
|---|---|
| Anatomy | Message (`bodyMd`, max 2 lines) + optional action (e.g. "Undo") on `surface.inverse`. |
| States | Info, success (leading check icon), error (leading error icon); queue: one at a time, newest replaces after current min duration. |
| Sizes | Above the cart bar when visible; side margins `space.4`; radius `radius.sm`. Duration 4 s; 8 s if it has an action; never auto-dismiss errors that need action. |
| Accessibility | `aria-live="polite"` (errors `assertive`); Flutter `SemanticsService.announce`; timing adjustable (WCAG 2.2.1) by extending when screen reader is on. |
| RTL | Action at end. |

#### EmptyState and ErrorState

| Aspect | Spec |
|---|---|
| Anatomy | Icon or small illustration (48-96 dp, decorative), title (`titleMd`), body (`bodyMd`, `text.secondary`), primary action, optional secondary action. |
| Variants | Empty: empty cart ("Start shopping"), no search results (suggest spellings, popular categories), no orders, no addresses. Error: offline (retry, uses cached data where possible), server error (retry, error code shown small for support), unserviceable location (change address), store closed (show hours, schedule if `checkout.scheduled_orders`). |
| Accessibility | Title is a heading; retry button focus on appear (errors only). Error messages come from the API `error.code` translation key (contract section 6). |
| RTL | Centered layout; actions stacked. |

#### OrderStatusTimeline

| Aspect | Spec |
|---|---|
| Anatomy | Vertical steps mapped from canonical statuses (contract section 4): Placed, Accepted, Picking, Packed, Out for delivery (`assigned`/`picked_up`), Arriving, Delivered. Each: dot (done = filled `feedback.success.fill` with check, current = `brand.primary` ring, upcoming = `border.default` hollow), label, timestamp (store time zone), optional detail (substitutions made). |
| States | Normal progress; side exits shown as a terminal step in `feedback.danger` with reason (cancelled, rejected, failed_delivery) and next action (refund status). |
| Accessibility | Ordered list; current step `aria-current="step"`; status changes announced politely from realtime events. |
| RTL | Dots on the start side; connector lines unchanged. |

#### LiveTrackingMap card

| Aspect | Spec |
|---|---|
| Anatomy | Map (tiles via the maps adapter, light/dark map style follows theme), route polyline `map.route`, rider marker `map.riderMarker` with bearing, destination marker `map.destination`, ETA overlay chip, recenter button. |
| States | Pre-assignment (store and home markers only, "Assigning a delivery partner"), tracking, rider stale (> 10 s: "Updating location"), arrived. |
| Sizes | Card 200 dp high in order screen; expandable to full screen. |
| Accessibility | Map is supplemental: an adjacent text summary ("Rider is 1.2 km away, arriving in 6 min") is the accessible content, updated at most every 30 s for announcements. Map gestures are not required for any task. |
| RTL | Map not mirrored; overlay controls positioned with start/end. |

#### RiderCard

| Aspect | Spec |
|---|---|
| Anatomy | Avatar, rider first name, vehicle info (optional per country privacy settings), rating pill, call button (masked number via telephony proxy if configured), chat button (`support.in_app_chat`). |
| Accessibility | Call/chat buttons labeled with rider name. |
| RTL | Avatar at start; phone glyph does not mirror. |

#### PaymentMethodTile

| Aspect | Spec |
|---|---|
| Anatomy | Radio, method logo (provider brand assets used per provider guidelines, not mirrored), label, sublabel (masked card "**** 4242", UPI id, wallet balance), optional offer strip (`offer.container`). |
| States | Selected, unselected, disabled with reason (e.g. COD unavailable over limit, `checkout.cod` off), needs action (re-authenticate). |
| Accessibility | Radio group with group label "Payment method"; disabled reason in semantics hint. |
| RTL | Radio at start; masked digits bidi-isolated LTR. |

#### WalletBalance

| Aspect | Spec |
|---|---|
| Anatomy | Label, amount (`displayMd`, tabular), "Add money" and "History" actions; shown only when `checkout.wallet` is on. |
| States | Loading (skeleton), zero, low balance hint, error. |
| Accessibility | Amount read with currency name. |

### 8.2 Store app (`store` flavor, phones and tablets)

#### OrderQueueCard with SLA timer

| Aspect | Spec |
|---|---|
| Anatomy | Order short id (`titleSm`, mono digits), item count, customer type tags (first order, priority), SLA timer chip (time remaining to accept/pack, tabular `labelLg`), status, primary action (Accept / Start picking / Mark packed). |
| States | New (highlight pulse), on track (`sla.onTrack` + clock icon + "4:32 left"), at risk at <= 30% remaining (`sla.atRisk` + warning icon + "1:10 left"), breached (`sla.breached` + error icon + "+0:45 late", counts up). |
| Sizes | Phone: full-width card; tablet `lg`: 3-column Kanban (New / Picking / Packed). |
| Accessibility | Timer announces only threshold crossings (at risk, breached), not every second. Status uses text + icon, never color only. |
| RTL | Timer chip at end; digits isolated. |

#### StockToggleRow

| Aspect | Spec |
|---|---|
| Anatomy | Thumbnail, name + variant + SKU (`bodyMd`, `caption`), on-hand count, switch (In stock / Out of stock) writing `inventory_items.is_active`. |
| States | On, off, pending (optimistic, switch shows small progress), error (revert + toast), locked (manager-only permission). |
| Accessibility | Switch label includes product name; state "In stock"/"Out of stock" text next to switch. |
| RTL | Switch at end; switch track direction mirrors (platform behaviour). |

#### LowStockAlert

| Aspect | Spec |
|---|---|
| Anatomy | `feedback.warning.container` banner with icon, "{n} items below threshold", action "Review"; list rows show on-hand vs `low_stock_threshold`. |
| Accessibility | Banner is a status region; not modal. |

### 8.3 Rider app (`rider` flavor)

#### OfferCard with countdown

| Aspect | Spec |
|---|---|
| Anatomy | Pickup store, drop distance and area, estimated earnings (`priceLg`), total distance, countdown ring around the accept button (time from `dispatch_offers` expiry), Accept (primary, large) and Decline (secondary). |
| States | Incoming (rises, vibration), counting down (ring depletes linearly), expired (card collapses with "Offer expired"), accepted (success checkmark then navigation), batched (multiple drops listed when `dispatch.batching`). |
| Sizes | Accept button 56 dp high, full width; Decline is a text button with 48 dp height, separated by >= 16 dp to prevent mis-taps. |
| Accessibility | Countdown announces at 10 s remaining; buttons labeled with earnings. Large-touch mode for gloves (setting): all targets 56 dp. |
| RTL | **Decision:** the countdown ring does not mirror; it always depletes clockwise (clock semantics). Layout (Accept/Decline, earnings) follows start/end. |

#### NavigationPanel

| Aspect | Spec |
|---|---|
| Anatomy | Next maneuver (arrow icon + distance, `headlineMd`), street name, ETA, "Open in maps" external action, call customer button, order items toggle. |
| Accessibility | Maneuver text is announced on change; high-contrast mode available for sunlight (uses `text.primary` on `surface.base` with `displayMd` sizes). |
| RTL | Turn arrows do not mirror (they represent real-world directions); layout start/end does. |

#### PODCapture (OTP / signature / photo)

| Aspect | Spec |
|---|---|
| Anatomy | Method tabs based on flags `delivery.otp_pod`, `delivery.signature_pod`, `delivery.photo_pod`. OTP: 4-6 digit segmented input (numeric keyboard, auto-advance, paste support). Signature: canvas with clear button and baseline. Photo: camera preview with capture, retake, thumbnail. Submit primary button. |
| States | Idle, input, validating, error (wrong OTP with remaining attempts), offline queued (photo stored and uploaded later with idempotency key), success (checkmark). |
| Accessibility | OTP field has one label "Delivery code" and is a single semantic field (segments are visual); signature has an alternative (OTP or photo) since drawing is not accessible to all users (WCAG 2.5.7 / 2.5.1). |
| RTL | OTP digits always LTR; signature canvas not mirrored. |

### 8.4 Admin web (`admin-web`, `store-web`)

#### DataTable

| Aspect | Spec |
|---|---|
| Anatomy | Toolbar (search, filters as FilterChips, column visibility, export), header row (sortable columns with sort icon), body rows (virtualized beyond 100 rows with TanStack Virtual), row selection checkboxes, pagination or infinite load, sticky header and first column. |
| States | Loading (skeleton rows), empty, error, selected rows (bulk action bar), row hover, row focus. |
| Sizes | Row height 48 (comfortable) or 40 (compact; pointer only). |
| Accessibility | Native `<table>` semantics; `aria-sort` on sorted header; keyboard: Tab to table, arrow keys move cell focus (grid pattern only when cells are interactive); selection announced. |
| RTL | Column order reverses; numeric columns stay end-aligned (which is left in RTL); sticky first column sticks to the start side. |

#### StatTile

| Aspect | Spec |
|---|---|
| Anatomy | Label (`labelSm`, `text.secondary`), value (`headlineLg`, tabular), delta (`labelSm` with up/down arrow icon and sign, colored success/danger plus explicit "+4.2%" text), optional sparkline (decorative, data in a tooltip/table). |
| Accessibility | Delta phrased in text ("up 4.2% versus last week"). |
| RTL | Sparkline does not mirror (time axis stays left-to-right per charting convention for RTL locales; **Decision** applied consistently to all charts). |

#### FormField

| Aspect | Spec |
|---|---|
| Anatomy | Label (always visible, `labelMd`), optional required marker (text "Required", not only an asterisk), input, helper text, error text (`feedback.danger.fg` + icon), character counter. |
| States | Default, focus, filled, error, disabled, read-only. |
| Accessibility | `<label for>`; `aria-describedby` for helper and error; `aria-invalid`; errors summarized at top on submit with links to fields. |
| RTL | Label and helper align start; inputs for phone, email, URL, ids, SKU forced `dir="ltr"`. |

#### ConfigForm (schema-driven)

| Aspect | Spec |
|---|---|
| Anatomy | Rendered from the setting definition schema (JSON Schema produced from Zod via the config package, see `03-CONFIG-FLAGS-TAX.md`): sections, fields mapped by type (string, number, money with currency, enum, boolean, color with contrast preview, translations per locale, JSON for advanced). Shows the effective value and which scope it is inherited from (global, country, tenant, store). |
| States | Inherited (read-only display with "Override" action), overridden (reset to inherited action), dirty, saving, validation error (server error codes mapped to fields), conflict (version mismatch). |
| Accessibility | Same as FormField; section headings; "inherited from Country: QA" is text. |
| RTL | As FormField. |

#### FlagToggle with scope

| Aspect | Spec |
|---|---|
| Anatomy | Flag key (mono) + name + description; scope selector (global, country, tenant, store, segment per contract section 5); switch; effective-value badge showing the resolved value and its source; kill-switch indicator if `force_off` is active (switch disabled with explanation). |
| States | On, off, inherited, overridden, killed, pending save, audit link (opens `audit_logs` filtered to this flag). |
| Accessibility | Switch label "{flag name} at {scope}: {state}"; kill-switch reason exposed as description. |
| RTL | Switch at end; flag key LTR-isolated. |

---

## 9. Accessibility

Target: **WCAG 2.2 level AA** on all apps, plus the stricter platform rules below.

| Area | Requirement | Flutter implementation | Web implementation |
|---|---|---|---|
| Contrast | Text >= 4.5:1 (also for large text by policy), non-text UI >= 3:1, focus indicator >= 3:1 | Tokens only; contrast gate in CI | Same |
| Screen readers | Every interactive element has a name, role, state; decorative images excluded | `Semantics`, `MergeSemantics`, `ExcludeSemantics`, `semanticsLabel` on `Text`/`Image`; custom actions for stepper (`onIncrease`/`onDecrease`) | Native elements first; ARIA only where needed (`aria-live`, `aria-current`, `aria-sort`, `aria-expanded`); tested with TalkBack, VoiceOver, NVDA |
| Dynamic type | Usable at 200% text scale without truncating prices, quantities or actions | Do not clamp `TextScaler` below 2.0; layouts use `Flexible`/wrapping; product grid drops to 1 column above 1.6 scale on `xs`/`sm` | rem units; layout tested at 200% browser zoom and 400% reflow (WCAG 1.4.10) |
| Touch targets | >= 48x48 dp (mobile), WCAG 2.5.8 minimum 24x24 always met | `MaterialTapTargetSize.padded`; `ConstrainedBox(minWidth/minHeight: 48)` around small visuals | `min-h-12 min-w-12` on mobile web; dense admin 40 px with spacing |
| Focus order | Logical, follows visual reading order in both directions; focus never hidden behind sticky bars (WCAG 2.4.11) | `FocusTraversalGroup` + `OrderedTraversalPolicy` where needed; scroll padding for cart bar | DOM order = visual order; `scroll-padding-bottom` equal to cart bar height |
| Focus visibility | 2 dp ring `border.focus`, 2 dp offset | Custom `FocusableActionDetector` ring for keyboard/switch access | `focus-visible:outline-2 outline-offset-2 outline-[rgb(var(--color-border-focus))]` via token class |
| Color-independent status | Every status uses text and/or icon, plus color | Badges, SLA chips, deltas, dietary markers (shape + label) | Same |
| Motion | Respect reduced motion; no flashing > 3 per second | `MediaQuery.disableAnimationsOf` | `@media (prefers-reduced-motion: reduce)` |
| Dragging | Every drag has a single-pointer alternative (WCAG 2.5.7) | Sheets have close buttons; reorder lists have move up/down actions | Same; banner ordering has move buttons |
| Media | Captions for all video (banner videos, tutorials); no autoplay with sound; audio-only alerts duplicated visually | `video_player` with WebVTT captions | `<track kind="captions">` required by the CMS validator |
| Timing | Rider/store timers are operational and essential; customer flows have no time limits except payment provider sessions (warn 60 s before expiry with option to extend where the provider allows) | | |
| Authentication | No cognitive tests; OTP paste and autofill allowed (WCAG 3.3.8) | `AutofillHints.oneTimeCode` | `autocomplete="one-time-code"` |
| Forms | Labels persistent, errors in text with suggestion, input purpose set (`autocomplete` for address, name, phone) | `AutofillHints` | `autocomplete` attributes |
| Language | Correct language tags so screen readers switch voice | `Locale` per app; `Semantics` with `TextSpan(locale:)` for mixed-language product names when known | `lang` on `<html>` and on mixed-language spans |

---

## 10. Responsive rules

| Surface | Rules |
|---|---|
| Customer app (phones) | Single column; product grid 2 columns at < 412 dp, 3 columns at >= 412 dp when text scale <= 1.3, 1 column (list variant) when text scale > 1.6 on widths < 600. Gutter 16. Bottom nav + cart bar. |
| Customer app (`md` foldables/tablets) | Grid 4-5 columns, max content width 840 dp centered; navigation rail replaces bottom nav at `lg`; cart becomes a side panel at `lg`. |
| Store app | Phone: order queue as list. Tablet `lg` (primary target, landscape): navigation rail + two panes (queue at start, order detail/pick list at end) or 3-column Kanban. Pick list rows 56 dp high for gloves. Keep screen on during shift (wakelock). |
| Rider app | Phone portrait only; large-touch mode available; one-hand bottom actions. |
| Admin/store web | 12-column grid at `xl`, gutters 24, side nav 264 px (collapsible to 72); 8 columns at `lg`; 4 columns at < 840 (mobile web supported for read and quick toggles, full editing at `lg`+). Max content width 1440 at `xxl`. Dashboards: StatTiles 4-up at `xl`, 2-up at `md`, 1-up below. |
| Safe areas | Flutter `SafeArea`/`MediaQuery.paddingOf` for notches, home indicator and gesture bar; cart bar sits above `viewPadding.bottom`. Web `env(safe-area-inset-*)` with `viewport-fit=cover`. |
| Keyboard | Sticky footers move above the keyboard (`viewInsets.bottom`); checkout button never hidden by the keyboard. |
| Foldables | Use `MediaQuery.displayFeatures` to avoid placing content across the hinge; two-pane layouts split on the hinge when vertical. Window size changes (fold/unfold, split screen) preserve state and scroll position. |
| Orientation | Customer and rider apps portrait-locked on phones; tablets and foldables support both. Store app supports both. |

---

## 11. Internationalization and RTL

### 11.1 Runtime directionality

- **Decision:** direction is derived from the active locale (`ar` -> RTL; `en`, `hi` -> LTR), never stored separately. Users switch language in-app without restart: the locale provider changes, `MaterialApp.router` rebuilds with the new `locale`, and Flutter's localization delegates set `Directionality`. Web sets `<html lang dir>` and Tailwind's `rtl:` variants react.
- Enabled languages per tenant/country come from `languages` and settings (`03-CONFIG-FLAGS-TAX.md`); strings from `translations` with tenant overrides.

### 11.2 Logical properties only

| Physical (forbidden in app code) | Logical (required) Flutter | Logical web (Tailwind 3.3+) |
|---|---|---|
| `EdgeInsets.only(left:, right:)` | `EdgeInsetsDirectional.only(start:, end:)` | `ps-*`, `pe-*`, `ms-*`, `me-*` |
| `Alignment.centerLeft` | `AlignmentDirectional.centerStart` | `text-start`, `justify-start` |
| `Positioned(left:)` | `PositionedDirectional(start:)` | `start-0`, `end-0` |
| `BorderRadius.only(topLeft:)` | `BorderRadiusDirectional.only(topStart:)` | `rounded-s-*`, `rounded-ss-*` |
| `TextAlign.left` | `TextAlign.start` | `text-start` |

Enforced by lint (custom_lint rule `no_physical_direction` on Dart; ESLint restricted-syntax on class names matching `\b(pl|pr|ml|mr|left|right|text-left|text-right|rounded-l|rounded-r)-` in `className` strings).

### 11.3 Icons: mirror vs do-not-mirror

| Mirror in RTL | Do NOT mirror |
|---|---|
| Back / forward arrows, chevrons (navigation, "See all", list disclosure) | Play, pause, media controls |
| Send, reply, redo/undo | Clocks, timers, countdown rings, history/refresh circular arrows |
| Cart bar "View cart" arrow, stepper-free directional icons | Brand logos, payment-provider logos, app icon |
| Progress indicators that show direction (linear progress fills from start) | Charts and sparklines (time axis stays left-to-right, see 8.4) |
| List/indent icons, text-alignment icons | Checkmark, close (X), plus, minus, search magnifier |
| Exit/logout arrow, open-in-new arrow | Phone handset, camera, map compass, real-world turn arrows in navigation |
| Swipe hints | Numerals and digit-containing icons, slashes in "18+", OTP fields |

Flutter: Material arrow/chevron icons used with `Icon(icon, matchTextDirection: true)` (set explicitly for custom icons); web: `rtl:-scale-x-100` on the mirrored icon component.

### 11.4 Numbers, currency, dates

- Formatting uses the active locale plus tenant/country settings: currency from the price or order (`currency` column), minor-unit exponent from `currencies`. Amounts arrive as `amount_minor` and are never converted through floating point for arithmetic. Web: build an exact decimal string from the `bigint` and pass it to `Intl.NumberFormat#format` (example below). Flutter: the Dart `Money` helper (mirror of `packages/money`) splits `BigInt` minor units into integer and fraction parts, formats the integer part with `NumberFormat.decimalPattern(locale)` for grouping, and places the currency symbol and decimal separator using the locale's `NumberSymbols` and `NumberFormat.simpleCurrency(locale:, name:)` pattern.
- **Digits setting** `ui.numerals`: `latn` (default) or `arab` (Arabic-Indic) for `ar`, `deva` optional for `hi` (proposed setting key; per tenant, user-overridable). Web uses the Unicode extension (`ar-QA-u-nu-arab` vs `ar-QA-u-nu-latn`) explicitly so behaviour does not depend on CLDR defaults. Flutter formats with the locale and then transliterates digits explicitly to the configured numbering system, again independent of CLDR defaults.
- OTP codes, order ids, SKU codes, phone numbers and card masks are always Latin digits (users copy them to other systems).
- Dates and times display in the store's IANA time zone (contract section 2) with locale formats; relative times ("in 12 min") from ICU plural rules in the translation files.

### 11.5 Example (web)

```ts
// packages/i18n/src/formatMoney.ts (blueprint)
export type Numerals = 'latn' | 'arab' | 'deva';

export function formatMoney(amountMinor: bigint, currency: string, exponent: number, locale: string, numerals: Numerals): string {
  const negative = amountMinor < 0n;
  const abs = negative ? -amountMinor : amountMinor;
  const digits = abs.toString().padStart(exponent + 1, '0');
  const major = exponent === 0 ? digits : `${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
  const nf = new Intl.NumberFormat(`${locale}-u-nu-${numerals}`, {
    style: 'currency',
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  });
  // Intl.NumberFormat accepts exact decimal strings (ECMA-402 NumberFormat v3; TypeScript lib es2023), so no float rounding occurs.
  return nf.format(`${negative ? '-' : ''}${major}` as Intl.StringNumericLiteral);
}
```

### 11.6 Bidi isolation

Mixed-direction content must be isolated so punctuation and numbers do not jump:

| Content | Rule |
|---|---|
| Product names (may mix Latin brand + Arabic description) | Render in an isolate with direction auto-detected from the first strong character (web `<bdi>` or `dir="auto"`; Flutter: wrap interpolated values with FSI U+2068 ... PDI U+2069 via a shared `isolate()` helper) |
| Prices inside translated sentences ("You save {amount}") | Placeholder value wrapped in FSI/PDI by the i18n layer automatically |
| Phone numbers, OTP, order ids, emails, URLs, SKU | Forced LTR isolate (LRI U+2066 ... PDI; web `<bdi dir="ltr">` / `dir="ltr"` inputs) |
| Addresses | `dir="auto"` per line |
| User-entered text fields | `TextDirection` resolved from content (Flutter: set `textDirection` from `Bidi.detectRtlDirectionality`; web `dir="auto"`) |

### 11.7 Text expansion and line breaking

| Topic | Rule |
|---|---|
| Expansion allowance | Design every label for +40% length (strings < 10 chars: +100%); no fixed-width buttons; chips and tabs scroll rather than truncate; Hindi typically +20-35% width and needs taller lines, Arabic is often narrower but taller. |
| Pseudo-locales | CI screenshot runs with `en-XA` (expanded, accented) and `ar-XB` (RTL pseudo) to catch truncation and physical-direction bugs. |
| Truncation | Max 2 lines for product names on cards; ellipsis only at grapheme boundaries (Flutter `characters` package; web `Intl.Segmenter` for manual truncation, CSS `line-clamp` otherwise). |
| Devanagari | Never break inside a conjunct or between a consonant and its matra (rely on ICU/browser line breaking; do not insert manual soft hyphens); no letter-spacing; avoid `overflow-wrap: anywhere` on Devanagari text. |
| Arabic | No letter-spacing, no justify with inter-character spacing; kashida not used; numerals per 11.4. |
| Font fallback | Each locale's script font is first in the stack; Latin brand font follows for embedded Latin words (Flutter `fontFamilyFallback`; web stack order per `:lang()` selector). |

---

## 12. Theming implementation

### 12.1 Flutter

Generated files (by Style Dictionary, see `design-tokens/README.md`) live in `apps/mobile/lib/design_system/generated/`. Hand-written theme code lives in `apps/mobile/lib/design_system/`.

```dart
// lib/design_system/generated/qc_color_tokens.g.dart  (generated; excerpt)
// Do not edit. Source: packages/design-tokens/tokens.json
import 'dart:ui';

abstract final class QcLightColors {
  static const Color backgroundCanvas = Color(0xFFF5F6F7);
  static const Color surfaceBase = Color(0xFFFFFFFF);
  static const Color surfaceOverlay = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1C2025);
  static const Color textSecondary = Color(0xFF434A52);
  static const Color borderStrong = Color(0xFF737B84);
  static const Color brandPrimary = Color(0xFF0B6283);
  static const Color brandOnPrimary = Color(0xFFFFFFFF);
  static const Color feedbackDangerFill = Color(0xFFA82020);
  static const Color feedbackDangerOnFill = Color(0xFFFFFFFF);
  static const Color commerceDiscountFill = Color(0xFF1B4DAE);
  static const Color commerceDiscountOnFill = Color(0xFFFFFFFF);
  static const Color commercePriceCurrent = Color(0xFF1C2025);
  static const Color commercePriceMrp = Color(0xFF59616A);
  static const Color skeletonBase = Color(0xFFECEEF0);
  static const Color skeletonHighlight = Color(0xFFF5F6F7);
}

abstract final class QcDarkColors {
  static const Color backgroundCanvas = Color(0xFF0B0D0F);
  static const Color surfaceBase = Color(0xFF121518);
  static const Color surfaceOverlay = Color(0xFF2C3238);
  static const Color textPrimary = Color(0xFFF5F6F7);
  static const Color textSecondary = Color(0xFFC2C7CD);
  static const Color borderStrong = Color(0xFF737B84);
  static const Color brandPrimary = Color(0xFF5FAECB);
  static const Color brandOnPrimary = Color(0xFF041C26);
  static const Color feedbackDangerFill = Color(0xFFEC7272);
  static const Color feedbackDangerOnFill = Color(0xFF470E0E);
  static const Color commerceDiscountFill = Color(0xFFA0C2F8);
  static const Color commerceDiscountOnFill = Color(0xFF0E2149);
  static const Color commercePriceCurrent = Color(0xFFF5F6F7);
  static const Color commercePriceMrp = Color(0xFF9AA1A9);
  static const Color skeletonBase = Color(0xFF1C2025);
  static const Color skeletonHighlight = Color(0xFF2C3238);
}
```

```dart
// lib/design_system/qc_colors.dart
// ThemeExtension holding semantic colors. The generator emits every semantic
// role; this listing shows the full pattern for a representative subset.
import 'package:flutter/material.dart';

import 'generated/qc_color_tokens.g.dart';

@immutable
class QcColors extends ThemeExtension<QcColors> {
  const QcColors({
    required this.canvas,
    required this.surfaceBase,
    required this.surfaceOverlay,
    required this.textPrimary,
    required this.textSecondary,
    required this.borderStrong,
    required this.brandPrimary,
    required this.onBrandPrimary,
    required this.dangerFill,
    required this.onDangerFill,
    required this.discountFill,
    required this.onDiscountFill,
    required this.priceCurrent,
    required this.priceMrp,
    required this.skeletonBase,
    required this.skeletonHighlight,
  });

  final Color canvas;
  final Color surfaceBase;
  final Color surfaceOverlay;
  final Color textPrimary;
  final Color textSecondary;
  final Color borderStrong;
  final Color brandPrimary;
  final Color onBrandPrimary;
  final Color dangerFill;
  final Color onDangerFill;
  final Color discountFill;
  final Color onDiscountFill;
  final Color priceCurrent;
  final Color priceMrp;
  final Color skeletonBase;
  final Color skeletonHighlight;

  static const QcColors light = QcColors(
    canvas: QcLightColors.backgroundCanvas,
    surfaceBase: QcLightColors.surfaceBase,
    surfaceOverlay: QcLightColors.surfaceOverlay,
    textPrimary: QcLightColors.textPrimary,
    textSecondary: QcLightColors.textSecondary,
    borderStrong: QcLightColors.borderStrong,
    brandPrimary: QcLightColors.brandPrimary,
    onBrandPrimary: QcLightColors.brandOnPrimary,
    dangerFill: QcLightColors.feedbackDangerFill,
    onDangerFill: QcLightColors.feedbackDangerOnFill,
    discountFill: QcLightColors.commerceDiscountFill,
    onDiscountFill: QcLightColors.commerceDiscountOnFill,
    priceCurrent: QcLightColors.commercePriceCurrent,
    priceMrp: QcLightColors.commercePriceMrp,
    skeletonBase: QcLightColors.skeletonBase,
    skeletonHighlight: QcLightColors.skeletonHighlight,
  );

  static const QcColors dark = QcColors(
    canvas: QcDarkColors.backgroundCanvas,
    surfaceBase: QcDarkColors.surfaceBase,
    surfaceOverlay: QcDarkColors.surfaceOverlay,
    textPrimary: QcDarkColors.textPrimary,
    textSecondary: QcDarkColors.textSecondary,
    borderStrong: QcDarkColors.borderStrong,
    brandPrimary: QcDarkColors.brandPrimary,
    onBrandPrimary: QcDarkColors.brandOnPrimary,
    dangerFill: QcDarkColors.feedbackDangerFill,
    onDangerFill: QcDarkColors.feedbackDangerOnFill,
    discountFill: QcDarkColors.commerceDiscountFill,
    onDiscountFill: QcDarkColors.commerceDiscountOnFill,
    priceCurrent: QcDarkColors.commercePriceCurrent,
    priceMrp: QcDarkColors.commercePriceMrp,
    skeletonBase: QcDarkColors.skeletonBase,
    skeletonHighlight: QcDarkColors.skeletonHighlight,
  );

  /// Applies server-derived tenant brand roles (bootstrap `branding.theme.light|dark`).
  /// Unknown keys are ignored; missing keys keep the platform placeholder.
  QcColors withTenantRoles(Map<String, Color> roles) => copyWith(
        brandPrimary: roles['brand.primary'],
        onBrandPrimary: roles['brand.onPrimary'],
      );

  @override
  QcColors copyWith({
    Color? canvas,
    Color? surfaceBase,
    Color? surfaceOverlay,
    Color? textPrimary,
    Color? textSecondary,
    Color? borderStrong,
    Color? brandPrimary,
    Color? onBrandPrimary,
    Color? dangerFill,
    Color? onDangerFill,
    Color? discountFill,
    Color? onDiscountFill,
    Color? priceCurrent,
    Color? priceMrp,
    Color? skeletonBase,
    Color? skeletonHighlight,
  }) {
    return QcColors(
      canvas: canvas ?? this.canvas,
      surfaceBase: surfaceBase ?? this.surfaceBase,
      surfaceOverlay: surfaceOverlay ?? this.surfaceOverlay,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      borderStrong: borderStrong ?? this.borderStrong,
      brandPrimary: brandPrimary ?? this.brandPrimary,
      onBrandPrimary: onBrandPrimary ?? this.onBrandPrimary,
      dangerFill: dangerFill ?? this.dangerFill,
      onDangerFill: onDangerFill ?? this.onDangerFill,
      discountFill: discountFill ?? this.discountFill,
      onDiscountFill: onDiscountFill ?? this.onDiscountFill,
      priceCurrent: priceCurrent ?? this.priceCurrent,
      priceMrp: priceMrp ?? this.priceMrp,
      skeletonBase: skeletonBase ?? this.skeletonBase,
      skeletonHighlight: skeletonHighlight ?? this.skeletonHighlight,
    );
  }

  @override
  QcColors lerp(ThemeExtension<QcColors>? other, double t) {
    if (other is! QcColors) return this;
    return QcColors(
      canvas: Color.lerp(canvas, other.canvas, t)!,
      surfaceBase: Color.lerp(surfaceBase, other.surfaceBase, t)!,
      surfaceOverlay: Color.lerp(surfaceOverlay, other.surfaceOverlay, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      borderStrong: Color.lerp(borderStrong, other.borderStrong, t)!,
      brandPrimary: Color.lerp(brandPrimary, other.brandPrimary, t)!,
      onBrandPrimary: Color.lerp(onBrandPrimary, other.onBrandPrimary, t)!,
      dangerFill: Color.lerp(dangerFill, other.dangerFill, t)!,
      onDangerFill: Color.lerp(onDangerFill, other.onDangerFill, t)!,
      discountFill: Color.lerp(discountFill, other.discountFill, t)!,
      onDiscountFill: Color.lerp(onDiscountFill, other.onDiscountFill, t)!,
      priceCurrent: Color.lerp(priceCurrent, other.priceCurrent, t)!,
      priceMrp: Color.lerp(priceMrp, other.priceMrp, t)!,
      skeletonBase: Color.lerp(skeletonBase, other.skeletonBase, t)!,
      skeletonHighlight: Color.lerp(skeletonHighlight, other.skeletonHighlight, t)!,
    );
  }
}

extension QcThemeContext on BuildContext {
  QcColors get qcColors => Theme.of(this).extension<QcColors>()!;
}
```

```dart
// lib/design_system/tenant_theme.dart
import 'package:flutter/material.dart';

/// Parsed from bootstrap `branding` (see 01-ARCHITECTURE.md). Values are
/// validated server-side; parsing still rejects anything that is not #RRGGBB.
@immutable
class TenantTheme {
  const TenantTheme({
    required this.version,
    required this.light,
    required this.dark,
    required this.fontFamily,
    required this.radiusScale,
  });

  final String version;
  final Map<String, Color> light;
  final Map<String, Color> dark;
  final String fontFamily;
  final double radiusScale;

  static const TenantTheme platformDefault = TenantTheme(
    version: 'platform-default',
    light: <String, Color>{},
    dark: <String, Color>{},
    fontFamily: 'Inter',
    radiusScale: 1,
  );

  static final RegExp _hex = RegExp(r'^#[0-9A-Fa-f]{6}$');

  static Map<String, Color> _roles(Object? raw) {
    if (raw is! Map<String, dynamic>) return const {};
    final out = <String, Color>{};
    raw.forEach((key, value) {
      if (value is String && _hex.hasMatch(value)) {
        out[key] = Color(0xFF000000 | int.parse(value.substring(1), radix: 16));
      }
    });
    return out;
  }

  factory TenantTheme.fromBootstrap(Map<String, dynamic> branding) {
    final theme = branding['theme'] as Map<String, dynamic>? ?? const {};
    final font = branding['font'] as Map<String, dynamic>? ?? const {};
    final scale = (branding['radiusScale'] as num?)?.toDouble() ?? 1;
    return TenantTheme(
      version: theme['version'] as String? ?? 'unknown',
      light: _roles(theme['light']),
      dark: _roles(theme['dark']),
      fontFamily: font['family'] as String? ?? 'Inter',
      radiusScale: const [0.0, 0.5, 1.0, 1.5].contains(scale) ? scale : 1,
    );
  }
}
```

```dart
// lib/design_system/build_theme.dart
import 'package:flutter/material.dart';

import 'qc_colors.dart';
import 'tenant_theme.dart';

enum _Script { latin, arabic, devanagari }

_Script _scriptFor(Locale locale) => switch (locale.languageCode) {
      'ar' => _Script.arabic,
      'hi' || 'mr' || 'ne' => _Script.devanagari,
      _ => _Script.latin,
    };

ThemeData buildTheme({
  required Brightness brightness,
  required TenantTheme tenant,
  required Locale locale,
}) {
  final base = brightness == Brightness.light ? QcColors.light : QcColors.dark;
  final colors = base.withTenantRoles(brightness == Brightness.light ? tenant.light : tenant.dark);
  final script = _scriptFor(locale);

  final (String family, List<String> fallback, double heightFactor) = switch (script) {
    _Script.arabic => ('Noto Sans Arabic', <String>[tenant.fontFamily, 'Noto Sans'], 1.15),
    _Script.devanagari => ('Noto Sans Devanagari', <String>[tenant.fontFamily, 'Noto Sans'], 1.2),
    _Script.latin => (tenant.fontFamily, <String>['Inter', 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Devanagari'], 1.0),
  };

  TextStyle style(double size, FontWeight weight, double height, double tracking) => TextStyle(
        fontFamily: family,
        fontFamilyFallback: fallback,
        fontSize: size,
        fontWeight: weight,
        height: height * heightFactor,
        letterSpacing: script == _Script.latin ? tracking : 0,
        color: colors.textPrimary,
      );

  final textTheme = TextTheme(
    displayLarge: style(40, FontWeight.w700, 1.2, -0.5),
    displayMedium: style(32, FontWeight.w700, 1.25, -0.25),
    headlineLarge: style(28, FontWeight.w700, 1.29, 0),
    headlineMedium: style(24, FontWeight.w600, 1.33, 0),
    titleLarge: style(20, FontWeight.w600, 1.4, 0),
    titleMedium: style(18, FontWeight.w600, 1.33, 0),
    titleSmall: style(16, FontWeight.w600, 1.375, 0),
    bodyLarge: style(16, FontWeight.w400, 1.5, 0),
    bodyMedium: style(14, FontWeight.w400, 1.43, 0),
    bodySmall: style(13, FontWeight.w400, 1.38, 0),
    labelLarge: style(16, FontWeight.w600, 1.25, 0.1),
    labelMedium: style(14, FontWeight.w600, 1.29, 0.1),
    labelSmall: style(12, FontWeight.w600, 1.33, 0.2),
  );

  final scheme = ColorScheme.fromSeed(seedColor: colors.brandPrimary, brightness: brightness).copyWith(
    primary: colors.brandPrimary,
    onPrimary: colors.onBrandPrimary,
    error: colors.dangerFill,
    onError: colors.onDangerFill,
    surface: colors.surfaceBase,
    onSurface: colors.textPrimary,
    outline: colors.borderStrong,
  );

  final radiusSm = 8 * tenant.radiusScale;
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: colors.canvas,
    textTheme: textTheme,
    materialTapTargetSize: MaterialTapTargetSize.padded,
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(64, 48),
        backgroundColor: colors.brandPrimary,
        foregroundColor: colors.onBrandPrimary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
        textStyle: textTheme.labelLarge,
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: colors.surfaceOverlay,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24 * tenant.radiusScale)),
      ),
    ),
    extensions: <ThemeExtension<dynamic>>[colors],
  );
}
```

```dart
// lib/app.dart (excerpt): light/dark with system default and user override (Riverpod 2)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'design_system/build_theme.dart';
import 'design_system/tenant_theme.dart';

enum ThemePreference { system, light, dark }

class ThemePreferenceNotifier extends Notifier<ThemePreference> {
  @override
  ThemePreference build() => ThemePreference.system; // persisted value is loaded by the bootstrap layer

  void set(ThemePreference value) => state = value;
}

final themePreferenceProvider =
    NotifierProvider<ThemePreferenceNotifier, ThemePreference>(ThemePreferenceNotifier.new);

/// Overridden at startup with the cached/bootstrap tenant theme.
final tenantThemeProvider = Provider<TenantTheme>((ref) => TenantTheme.platformDefault);

/// Overridden by the i18n layer; changing it rebuilds the app in the new direction.
final localeProvider = StateProvider<Locale>((ref) => const Locale('en'));

class QuickCartApp extends ConsumerWidget {
  const QuickCartApp({super.key, required this.routerConfig});

  final RouterConfig<Object> routerConfig;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tenant = ref.watch(tenantThemeProvider);
    final locale = ref.watch(localeProvider);
    final pref = ref.watch(themePreferenceProvider);
    return MaterialApp.router(
      routerConfig: routerConfig,
      locale: locale,
      theme: buildTheme(brightness: Brightness.light, tenant: tenant, locale: locale),
      darkTheme: buildTheme(brightness: Brightness.dark, tenant: tenant, locale: locale),
      // ThemeMode.system follows MediaQuery.platformBrightness automatically.
      themeMode: switch (pref) {
        ThemePreference.system => ThemeMode.system,
        ThemePreference.light => ThemeMode.light,
        ThemePreference.dark => ThemeMode.dark,
      },
      // localizationsDelegates / supportedLocales come from the generated l10n class.
    );
  }
}
```

Widgets outside `MaterialApp` theming (for example the map style JSON) read `Theme.of(context).brightness`, which already reflects both the platform brightness and the user override.

Add-to-cart control showing tokens, semantics and reduced motion together:

```dart
// lib/features/catalog/widgets/add_to_cart_control.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../design_system/qc_colors.dart';

class AddToCartControl extends StatelessWidget {
  const AddToCartControl({
    super.key,
    required this.productName,
    required this.quantity,
    required this.maxQuantity,
    required this.onChanged,
    required this.addLabel,
  });

  final String productName;
  final int quantity;
  final int maxQuantity;
  final ValueChanged<int> onChanged; // optimistic update handled by the cart controller
  final String addLabel; // localized "Add"

  @override
  Widget build(BuildContext context) {
    final c = context.qcColors;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final duration = reduceMotion ? Duration.zero : const Duration(milliseconds: 150);

    void change(int next) {
      if (next > maxQuantity) {
        HapticFeedback.heavyImpact();
        return;
      }
      if (quantity == 0 && next == 1) {
        HapticFeedback.lightImpact();
      } else {
        HapticFeedback.selectionClick();
      }
      onChanged(next);
    }

    final child = quantity == 0
        ? OutlinedButton(
            key: const ValueKey('add'),
            onPressed: () => change(1),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(72, 36),
              tapTargetSize: MaterialTapTargetSize.padded,
              foregroundColor: c.brandPrimary,
              side: BorderSide(color: c.brandPrimary),
            ),
            child: Text(addLabel, semanticsLabel: '$addLabel $productName'),
          )
        : Semantics(
            key: const ValueKey('stepper'),
            label: productName,
            value: '$quantity',
            increasedValue: quantity < maxQuantity ? '${quantity + 1}' : null,
            decreasedValue: '${quantity - 1}',
            onIncrease: quantity < maxQuantity ? () => change(quantity + 1) : null,
            onDecrease: () => change(quantity - 1),
            child: ExcludeSemantics(
              child: DecoratedBox(
                decoration: BoxDecoration(color: c.brandPrimary, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove, size: 20),
                      color: c.onBrandPrimary,
                      onPressed: () => change(quantity - 1),
                    ),
                    AnimatedSwitcher(
                      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 100),
                      transitionBuilder: (w, a) => ScaleTransition(scale: a, child: w),
                      child: Text(
                        '$quantity',
                        key: ValueKey(quantity),
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: c.onBrandPrimary,
                              fontFeatures: const [FontFeature.tabularFigures()],
                            ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add, size: 20),
                      color: c.onBrandPrimary,
                      onPressed: quantity < maxQuantity ? () => change(quantity + 1) : null,
                    ),
                  ],
                ),
              ),
            ),
          );

    return AnimatedSwitcher(
      duration: duration,
      switchInCurve: const Cubic(0.2, 0, 0, 1),
      switchOutCurve: const Cubic(0.3, 0, 1, 1),
      child: child,
    );
  }
}
```

Note: `IconButton` already provides a 48x48 hit area; the stepper's visual height is set by the decoration and content, and the screen reader exposes one adjustable control rather than three stops.

### 12.2 Web (React + Vite + Tailwind)

Generated CSS (Style Dictionary output `packages/design-tokens/dist/web/tokens.css`). Colors are emitted as space-separated RGB channels so Tailwind can apply alpha; alpha-bearing tokens (scrim, press) are emitted as full `rgb(... / a)` values.

```css
/* tokens.css (generated; excerpt) */
:root {
  --color-background-canvas: 245 246 247;
  --color-surface-base: 255 255 255;
  --color-surface-overlay: 255 255 255;
  --color-text-primary: 28 32 37;
  --color-text-secondary: 67 74 82;
  --color-border-strong: 115 123 132;
  --color-border-focus: 11 98 131;
  --color-brand-primary: 11 98 131;
  --color-brand-on-primary: 255 255 255;
  --color-commerce-discount-fill: 27 77 174;
  --color-commerce-discount-on-fill: 255 255 255;
  --color-overlay-scrim: rgb(11 13 15 / 0.56);
  --radius-sm: 8px;
  --radius-md: 12px;
  --shadow-3: 0px 8px 24px -4px rgb(11 13 15 / 0.2);
  --motion-duration-short: 150ms;
  --motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --font-family-base: Inter, "Noto Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color-scheme: light;
}

:root[data-theme="dark"] {
  --color-background-canvas: 11 13 15;
  --color-surface-base: 18 21 24;
  --color-surface-overlay: 44 50 56;
  --color-text-primary: 245 246 247;
  --color-text-secondary: 194 199 205;
  --color-border-strong: 115 123 132;
  --color-border-focus: 95 174 203;
  --color-brand-primary: 95 174 203;
  --color-brand-on-primary: 4 28 38;
  --color-commerce-discount-fill: 160 194 248;
  --color-commerce-discount-on-fill: 14 33 73;
  --color-overlay-scrim: rgb(0 0 0 / 0.64);
  --shadow-3: 0px 6px 16px 0px rgb(0 0 0 / 0.6);
  color-scheme: dark;
}

/* System preference when the user has not chosen explicitly (no data-theme attribute). */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-background-canvas: 11 13 15;
    --color-surface-base: 18 21 24;
    --color-surface-overlay: 44 50 56;
    --color-text-primary: 245 246 247;
    --color-text-secondary: 194 199 205;
    --color-border-strong: 115 123 132;
    --color-border-focus: 95 174 203;
    --color-brand-primary: 95 174 203;
    --color-brand-on-primary: 4 28 38;
    --color-commerce-discount-fill: 160 194 248;
    --color-commerce-discount-on-fill: 14 33 73;
    --color-overlay-scrim: rgb(0 0 0 / 0.64);
    --shadow-3: 0px 6px 16px 0px rgb(0 0 0 / 0.6);
    color-scheme: dark;
  }
}

:lang(ar) { --font-family-base: "Noto Sans Arabic", "Noto Naskh Arabic", Inter, "Segoe UI", Tahoma, sans-serif; }
:lang(hi) { --font-family-base: "Noto Sans Devanagari", Mukta, Inter, "Nirmala UI", sans-serif; }

@media (prefers-reduced-motion: reduce) {
  :root { --motion-duration-short: 0ms; --motion-duration-medium: 0ms; --motion-duration-long: 0ms; }
}
```

```ts
// apps/admin-web/tailwind.config.ts (store-web identical via packages/ui-web preset)
import type { Config } from 'tailwindcss';

const c = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui-web/src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    screens: { sm: '360px', md: '600px', lg: '840px', xl: '1200px', '2xl': '1600px' },
    extend: {
      colors: {
        canvas: c('background-canvas'),
        surface: {
          base: c('surface-base'),
          raised: c('surface-raised'),
          overlay: c('surface-overlay'),
          sunken: c('surface-sunken'),
          inverse: c('surface-inverse'),
        },
        fg: {
          primary: c('text-primary'),
          secondary: c('text-secondary'),
          tertiary: c('text-tertiary'),
          disabled: c('text-disabled'),
          inverse: c('text-inverse'),
          link: c('text-link'),
        },
        line: {
          subtle: c('border-subtle'),
          DEFAULT: c('border-default'),
          strong: c('border-strong'),
          focus: c('border-focus'),
        },
        brand: {
          DEFAULT: c('brand-primary'),
          hover: c('brand-primary-hover'),
          pressed: c('brand-primary-pressed'),
          on: c('brand-on-primary'),
          container: c('brand-primary-container'),
          'on-container': c('brand-on-primary-container'),
        },
        success: { fg: c('feedback-success-fg'), fill: c('feedback-success-fill'), on: c('feedback-success-on-fill'), container: c('feedback-success-container'), 'on-container': c('feedback-success-on-container') },
        warning: { fg: c('feedback-warning-fg'), fill: c('feedback-warning-fill'), on: c('feedback-warning-on-fill'), container: c('feedback-warning-container'), 'on-container': c('feedback-warning-on-container') },
        danger: { fg: c('feedback-danger-fg'), fill: c('feedback-danger-fill'), on: c('feedback-danger-on-fill'), container: c('feedback-danger-container'), 'on-container': c('feedback-danger-on-container') },
        info: { fg: c('feedback-info-fg'), fill: c('feedback-info-fill'), on: c('feedback-info-on-fill'), container: c('feedback-info-container'), 'on-container': c('feedback-info-on-container') },
        discount: { DEFAULT: c('commerce-discount-fill'), on: c('commerce-discount-on-fill') },
        scrim: 'var(--color-overlay-scrim)',
      },
      fontFamily: { sans: 'var(--font-family-base)' },
      borderRadius: {
        xs: 'var(--radius-xs)', sm: 'var(--radius-sm)', md: 'var(--radius-md)',
        lg: 'var(--radius-lg)', xl: 'var(--radius-xl)',
      },
      boxShadow: { 1: 'var(--shadow-1)', 2: 'var(--shadow-2)', 3: 'var(--shadow-3)', 4: 'var(--shadow-4)' },
      transitionDuration: {
        micro: 'var(--motion-duration-micro)', short: 'var(--motion-duration-short)',
        medium: 'var(--motion-duration-medium)', long: 'var(--motion-duration-long)',
      },
      transitionTimingFunction: {
        standard: 'var(--motion-easing-standard)', enter: 'var(--motion-easing-enter)', exit: 'var(--motion-easing-exit)',
      },
      zIndex: { sticky: '100', cartbar: '200', dropdown: '300', overlay: '400', sheet: '500', dialog: '600', toast: '700', tooltip: '800' },
    },
  },
} satisfies Config;
```

Usage: `className="bg-brand text-brand-on hover:bg-brand-hover rounded-sm shadow-3 duration-short ease-standard"`, `bg-brand/10` works because of `<alpha-value>`.

Runtime tenant injection from the bootstrap config:

```ts
// packages/ui-web/src/theme/applyTenantTheme.ts
export interface BootstrapTheme {
  version: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}
export interface BootstrapBranding {
  theme: BootstrapTheme;
  radiusScale: number;
  font: { family: string; files: { url: string; weight: string; style: 'normal' | 'italic' }[] };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const RADIUS_BASE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
const ALLOWED_SCALES = new Set([0, 0.5, 1, 1.5]);
const FONT_NAME = /^[A-Za-z0-9 \-]{1,64}$/;

// 'brand.onPrimary' -> '--color-brand-on-primary'
const varName = (role: string) =>
  `--color-${role.replace(/\./g, '-').replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

const channels = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

// Dependent roles resolved from brand roles (alias table in design-tokens/README.md, section 5).
const SHARED_DEPENDENTS: Record<string, string> = {
  'border.focus': 'brand.primary',
  'map.route': 'brand.primary',
  'map.riderMarker': 'brand.accent',
  'commerce.badge.newFill': 'brand.primaryContainer',
  'commerce.badge.onNewFill': 'brand.onPrimaryContainer',
};
const DEPENDENT_LIGHT: Record<string, string> = { ...SHARED_DEPENDENTS, 'text.link': 'brand.primary' };
const DEPENDENT_DARK: Record<string, string> = { ...SHARED_DEPENDENTS, 'text.link': 'brand.primaryHover' };

function declarations(roles: Record<string, string>, dependents: Record<string, string>): string {
  const all = { ...roles };
  for (const [dep, src] of Object.entries(dependents)) if (roles[src]) all[dep] = roles[src];
  return Object.entries(all)
    .filter(([, v]) => HEX.test(v)) // never inject anything that is not a plain hex color
    .map(([k, v]) => `${varName(k)}: ${channels(v)};`)
    .join('');
}

export async function applyTenantTheme(branding: BootstrapBranding, doc: Document = document): Promise<void> {
  const scale = ALLOWED_SCALES.has(branding.radiusScale) ? branding.radiusScale : 1;
  const radius = Object.entries(RADIUS_BASE).map(([k, v]) => `--radius-${k}: ${v * scale}px;`).join('');
  const family = FONT_NAME.test(branding.font.family) ? branding.font.family : 'Inter';
  const font = `--font-family-base: "${family}", Inter, "Noto Sans", system-ui, sans-serif;`;

  const light = declarations(branding.theme.light, DEPENDENT_LIGHT);
  const dark = declarations(branding.theme.dark, DEPENDENT_DARK);
  const css =
    `:root{${light}${radius}}` +
    `:root:not(:lang(ar)):not(:lang(hi)){${font}}` + // script locales keep their script font first

    `:root[data-theme="dark"]{${dark}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`;

  let el = doc.getElementById('tenant-theme') as HTMLStyleElement | null;
  if (!el) {
    el = doc.createElement('style');
    el.id = 'tenant-theme';
    doc.head.appendChild(el); // after tokens.css, so equal-specificity rules win
  }
  el.textContent = css;

  // Tenant font files come from tenants/{tenantId}/branding/ on the platform CDN (allowlisted origin).
  await Promise.all(
    branding.font.files.map(async (f) => {
      const face = new FontFace(family, `url(${JSON.stringify(f.url)})`, { weight: f.weight, style: f.style, display: 'swap' });
      doc.fonts.add(await face.load());
    }),
  );
}

export type ThemePreference = 'system' | 'light' | 'dark';

export function setThemePreference(pref: ThemePreference, root: HTMLElement = document.documentElement): void {
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
  try {
    localStorage.setItem('qc.theme', pref);
  } catch {
    /* storage unavailable: preference lasts for this page view only */
  }
}
```

To avoid a flash of the wrong theme, `index.html` contains a 5-line inline script that reads `qc.theme` from `localStorage` (in a try/catch) and sets `data-theme` before the stylesheet paints; the last tenant theme CSS is cached in `localStorage` by version and injected by the same script, then refreshed after bootstrap. The Content-Security-Policy allows this script by hash.

---

## 13. UI performance budgets

### 13.1 Reference devices

| Platform | Reference (example; configurable in the perf lab) |
|---|---|
| Android low-mid | 4 GB RAM, octa-core 2.0 GHz class SoC, Android 12, 60 Hz, 1080p |
| Android high | 8 GB RAM, 120 Hz |
| iOS | Oldest supported iPhone with 60 Hz display; one ProMotion 120 Hz device |
| Web | Mid-tier laptop, Chrome stable, "Fast 4G" throttling profile for LCP checks |

### 13.2 Budgets

| Metric | Budget | How measured |
|---|---|---|
| Frame time | Build + raster <= 16 ms at 60 Hz, <= 8 ms at 120 Hz | `flutter run --profile`, DevTools timeline; integration tests with `traceAction` |
| Jank | < 1% janky frames (P90 of runs) scrolling home and category grid for 10 s; no single frame > 32 ms during add-to-cart, cart bar entry, sheet open | `FrameTiming` reported by integration tests in CI on device farm |
| Cold start | <= 2.0 s P75 to interactive home with cache (low-mid Android) | Firebase Performance / custom trace |
| App size | Customer flavor download <= 25 MB (Android App Bundle per ABI), store/rider <= 30 MB | CI size check |
| Memory | Customer app steady state <= 250 MB on low-mid Android after browsing 5 categories | DevTools memory |
| Images: grid thumbnail | Served at displayed size x DPR (e.g. 120 dp x 3 = 360 px), AVIF first, WebP fallback (JPEG only for legacy web); <= 25 KB typical, 40 KB hard cap | Image CDN transform params `w`, `fmt`, `q=70`; CI audit of catalog sample |
| Images: banner | <= 120 KB at 1080 px wide; LCP-candidate banner preloaded on web | Same |
| Images: PDP gallery | <= 200 KB per image at 1080 px; zoom loads higher resolution on demand | Same |
| Image decode | Flutter decodes at display size (`cacheWidth`/`memCacheWidth` via `cached_network_image`); placeholders BlurHash (<= 30 bytes in API) | Code review rule |
| Image cache | Memory cache 100 MB, disk cache 200 MB LRU (customer app, example values); web relies on HTTP caching with immutable, content-hashed URLs | |
| Lists | Always builder-based (`ListView.builder`, `SliverGrid` with `SliverChildBuilderDelegate`), fixed `itemExtent`/`prototypeItem` where possible; no `shrinkWrap` lists inside scroll views; web virtualization (TanStack Virtual) beyond 100 rows | Lint + review |
| Rebuild scope | Riverpod `select` for cart quantity per product so one add rebuilds only that card and the cart bar | DevTools rebuild stats |
| Web admin | LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 (P75, Core Web Vitals); initial JS <= 200 KB gzip per app, route chunks <= 100 KB | Lighthouse CI + RUM (web-vitals) |
| Fonts | Mobile bundled; web WOFF2 subsets per `unicode-range`, Latin subset <= 40 KB per weight; max 3 weights per script | Bundle audit |
| Animation | Only transform and opacity on web; Flutter uses implicit/explicit animations without rebuilding large subtrees (`RepaintBoundary` around shimmer, map, carousels) | Review |

---

## 14. Design QA checklist

Every screen or component change is checked against this list before merge (design review + automated checks).

**Tokens and theming**
- [ ] No hex literals, no primitive tokens, no off-scale spacing in app code (lint passes).
- [ ] Renders correctly in light, dark, and with two sample tenant themes (one dark brand, one very light brand) via golden tests.
- [ ] `check_contrast.py` (and its TypeScript port for tenant themes) passes.
- [ ] Radius scale 0 and 1.5 do not break layouts.

**Commerce clarity**
- [ ] Selling price is the most prominent number; MRP struck through and readable; unit size present.
- [ ] Add-to-cart reachable in 1 tap from every listing; stepper appears in place without layout shift.
- [ ] Max 2 badges per card, correct priority; OOS state shows substitute hint where available.
- [ ] Amounts formatted per locale and currency from minor units; digits follow `ui.numerals`.

**Loading and motion**
- [ ] Skeleton matches final layout (no shift on swap); max skeleton time handled with error state.
- [ ] Optimistic updates roll back with a clear toast on server rejection.
- [ ] All durations from motion tokens; reduced-motion mode verified; no animation blocks input.
- [ ] Haptics at most one per action and respect settings.

**Accessibility**
- [ ] TalkBack and VoiceOver pass (web: NVDA + VoiceOver): names, roles, states, logical order, merged product card label, stepper adjustable.
- [ ] 200% text scale: no clipped prices, quantities or primary actions.
- [ ] Every touch target >= 48 dp; adjacent targets spaced >= 8 dp.
- [ ] Status never conveyed by color alone; focus ring visible and not obscured by sticky bars.
- [ ] Every drag has a button alternative; media has captions.

**Internationalization**
- [ ] Verified in `en`, `ar` (RTL) and `hi`; pseudo-locales `en-XA` and `ar-XB` screenshots reviewed.
- [ ] Only logical (start/end) properties; directional icons mirror, non-directional icons do not.
- [ ] Phone numbers, OTPs, ids, prices isolated; mixed-script product names render correctly.
- [ ] No truncation inside grapheme clusters; Devanagari and Arabic line heights applied.

**Responsive and platform**
- [ ] Tested at 320, 360, 412 dp phones, a foldable (unfolded and folded), a 10-inch tablet (store app), and 1280/1920 px web.
- [ ] Safe areas and keyboard insets respected; cart bar and checkout never hidden.

**Performance**
- [ ] Profile-mode trace shows no frames over budget for the changed screen.
- [ ] Images requested at display size in AVIF/WebP; list is builder-based or virtualized.
- [ ] Web: Lighthouse CI budgets pass (LCP, INP, CLS, JS size).

---

## Appendix A. Contrast verification result

Computed with `design-tokens/check_contrast.py` against `design-tokens/tokens.json` (WCAG 2.x relative luminance; thresholds 4.5:1 for text pairs, 3:1 for graphics and UI boundaries). The script checked **316 pairs (158 per mode) with 0 failures**. Each text and graphic token was checked against all five surfaces (canvas, base, raised, overlay, sunken); the table lists the lowest ratio found per token.

| Foreground token | Min ratio light | Min ratio dark | Required |
|---|---|---|---|
| `text.primary` | 14.08 | 11.98 | 4.5 |
| `text.secondary` | 7.72 | 7.62 | 4.5 |
| `text.tertiary` | 5.40 | 4.96 | 4.5 |
| `text.link` | 5.84 | 7.35 | 4.5 |
| `brand.primary` (as text) | 5.84 | 5.19 | 4.5 |
| `commerce.price.current` | 14.08 | 11.98 | 4.5 |
| `commerce.price.mrp` | 5.40 | 4.96 | 4.5 |
| `commerce.price.perUnit` | 5.40 | 4.96 | 4.5 |
| `commerce.price.saving` | 6.96 | 5.86 | 4.5 |
| `feedback.success.fg` | 6.96 | 5.86 | 4.5 |
| `feedback.warning.fg` | 6.09 | 7.63 | 4.5 |
| `feedback.danger.fg` | 6.24 | 6.55 | 4.5 |
| `feedback.info.fg` | 6.64 | 7.14 | 4.5 |
| `sla.onTrack` / `atRisk` / `breached` | 6.96 / 6.09 / 6.24 | 5.86 / 7.63 / 6.55 | 4.5 |
| `border.strong` | 3.69 | 3.02 | 3.0 |
| `border.focus` | 5.84 | 5.19 | 3.0 |
| `dietary.veg` / `nonVeg` / `egg` / `other` | 5.10 / 6.24 / 3.90 / 5.40 | 4.20 / 3.22 / 6.02 / 4.96 | 3.0 |
| `commerce.rating.star` | 3.90 | 6.02 | 3.0 |
| `map.route` / `riderMarker` / `destination` | 5.84 / 5.35 / 14.08 | 5.19 / 5.31 / 11.98 | 3.0 |
| `brand.onPrimary` on primary/hover/pressed | 6.80 | 7.01 | 4.5 |
| `brand.onPrimaryContainer` on container | 10.40 | 11.12 | 4.5 |
| `brand.onSecondary` on secondary | 9.12 | 8.68 | 4.5 |
| `brand.onAccent` on accent | 6.23 | 6.31 | 4.5 |
| `text.inverse` on `surface.inverse` | 16.37 | 16.93 | 4.5 |
| `commerce.discount.onFill` on fill | 7.72 | 8.68 | 4.5 |
| `commerce.offer.onFill` on fill | 8.61 | 8.61 | 4.5 |
| `commerce.offer.onContainer` on container | 9.79 | 12.17 | 4.5 |
| `badge.onNewFill` / `onBestsellerFill` / `onLimitedStockFill` / `onOutOfStockFill` | 10.40 / 11.88 / 8.45 / 8.97 | 11.12 / 9.74 / 11.30 / 13.45 | 4.5 |
| `commerce.rating.onFill` on fill | 8.09 | 6.41 | 4.5 |
| `feedback.*.onFill` on fill (success / warning / danger / info) | 5.93 / 8.51 / 7.26 / 7.72 | 6.41 / 8.23 / 5.40 / 5.97 | 4.5 |
| `feedback.*.onContainer` on container (success / warning / danger / info) | 9.90 / 9.74 / 11.05 / 11.57 | 11.18 / 11.88 / 11.30 / 11.80 | 4.5 |
| Solid fills vs `surface.base` (discount / offer / out-of-stock / rating / brand) | 7.72 / 8.61 / 8.97 / 8.09 / 6.80 | 10.09 / 9.48 / 13.45 / 8.29 / 7.33 | 3.0 |

Tightest margins (watch these when editing primitives): dark `border.strong` 3.02, dark `dietary.nonVeg` 3.22, dark `text.tertiary`/`price.mrp` 4.96. `text.disabled` is intentionally not in the gate (WCAG 1.4.3 exempts inactive components).
