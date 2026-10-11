# Design tokens: build and runtime merge

> **Status: blueprint.** This describes the token pipeline to be built in `packages/design-tokens` (contract section 7). It has not been run. The design rationale and the full token tables are in `../04-DESIGN-SYSTEM.md`.

## 1. Files

| File | Purpose |
|---|---|
| `tokens.json` | Single source of truth. W3C Design Tokens Community Group (DTCG) format (`$value`, `$type`, `$description`, `$extensions`), readable by Style Dictionary v4. Brand-neutral placeholder palette. |
| `check_contrast.py` | WCAG contrast gate over semantic pairs for light and dark mode. Exit code 1 on failure. Runs in CI on every change to `tokens.json`. |
| `README.md` | This file. |

In the monorepo these move to:

```
packages/design-tokens/
  tokens/tokens.json
  sd.config.mjs              # Style Dictionary build (section 3)
  src/derive.ts              # tenant palette derivation (04-DESIGN-SYSTEM.md, 3.3)
  src/contrast.ts            # TypeScript port of check_contrast.py for tenant themes
  tools/check_contrast.py
  dist/
    web/tokens.css           # :root (light), [data-theme="dark"], prefers-color-scheme block
    web/tokens.d.ts          # typed token names for packages/ui-web
    dart/qc_color_tokens.g.dart
    dart/qc_tokens.g.dart    # spacing, radius, durations, z-order, breakpoints
    meta/brand-dependents.json
```

The Flutter app consumes `dist/dart/*.g.dart` by copying them into `apps/mobile/lib/design_system/generated/` (a `melos`/`make tokens` step); the web apps import `@quickcart/design-tokens/web/tokens.css` and the Tailwind preset from `packages/ui-web`.

## 2. Structure of `tokens.json`

| Path | Tier | Notes |
|---|---|---|
| `primitive.color.*` | 1 | Ramps: neutral, brand, brandSecondary, brandAccent, green, red, amber, blue, violet, alpha |
| `primitive.font.*`, `primitive.duration.*`, `primitive.easing.*` | 1 | Raw type, duration and curve values |
| `color.*` | 2 | Semantic roles. `$value` = light; dark in `$extensions["com.quickcart.modes"].dark` |
| `typography.*` | 2 | DTCG composite typography (Latin metrics; script factors applied by the theme builders) |
| `space.*`, `radius.*`, `size.*`, `opacity.*`, `zIndex.*`, `breakpoint.*` | 2 | Mode-independent |
| `shadow.*` | 2 | Composite shadows; dark variant in `$extensions["com.quickcart.modes"].dark` |
| `motion.duration.*`, `motion.easing.*` | 2 | Aliases of primitives |
| `component.*` | 3 | Alias semantic tokens only |

Dimensions use the string form (`"16px"`) that Style Dictionary v4 accepts; if the pipeline moves to the object form of the final DTCG spec (`{"value": 16, "unit": "px"}`), only the build transforms change.

**Why modes live in `$extensions`:** one token path per role means component tokens alias `{color.brand.primary}` once and stay correct in both modes; a build-time preprocessor swaps `$value` for the dark value before the dark platform build.

## 3. Style Dictionary configuration (v4)

```js
// packages/design-tokens/sd.config.mjs
import StyleDictionary from 'style-dictionary';
import { fileHeader, formattedVariables } from 'style-dictionary/utils';

const MODES_KEY = 'com.quickcart.modes';

/* ---------- Preprocessor: replace $value with the dark value ---------- */
function swapToDark(node) {
  if (node && typeof node === 'object') {
    const dark = node.$extensions?.[MODES_KEY]?.dark;
    if ('$value' in node && dark !== undefined) node.$value = dark;
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) swapToDark(child);
    }
  }
  return node;
}

StyleDictionary.registerPreprocessor({
  name: 'qc/mode-dark',
  preprocessor: (dictionary) => swapToDark(structuredClone(dictionary)),
});

/* ---------- Helpers ---------- */
const val = (token, options) => (options.usesDtcg ? token.$value : token.value);
const typeOf = (token, options) => (options.usesDtcg ? token.$type : token.type);

function parseHex(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

/* ---------- Transforms ---------- */
// Web: opaque colors become "R G B" channel triples for rgb(var(--x) / <alpha-value>);
// translucent colors become full rgb(R G B / a) values.
StyleDictionary.registerTransform({
  name: 'qc/color/rgb-channels',
  type: 'value',
  transitive: true,
  filter: (token, options) => typeOf(token, options) === 'color',
  transform: (token, _config, options) => {
    const v = val(token, options);
    if (typeof v !== 'string' || !v.startsWith('#')) return v; // already transformed
    const { r, g, b, a } = parseHex(v);
    return a < 1 ? `rgb(${r} ${g} ${b} / ${Number(a.toFixed(2))})` : `${r} ${g} ${b}`;
  },
});

// Dart: Color(0xAARRGGBB)
StyleDictionary.registerTransform({
  name: 'qc/color/dart',
  type: 'value',
  transitive: true,
  filter: (token, options) => typeOf(token, options) === 'color',
  transform: (token, _config, options) => {
    const v = val(token, options);
    if (typeof v !== 'string' || !v.startsWith('#')) return v;
    const { r, g, b, a } = parseHex(v);
    const hex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
    return `Color(0x${hex(Math.round(a * 255))}${hex(r)}${hex(g)}${hex(b)})`;
  },
});

// Dart names drop the leading "color" segment: color.brand.onPrimary -> brandOnPrimary
StyleDictionary.registerTransform({
  name: 'qc/name/dart',
  type: 'name',
  transform: (token) => {
    const parts = token.path[0] === 'color' ? token.path.slice(1) : token.path;
    return parts
      .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join('')
      .replace(/[^A-Za-z0-9]/g, '');
  },
});

/* ---------- Formats ---------- */
// Dark CSS: explicit [data-theme="dark"] plus prefers-color-scheme when no explicit choice.
StyleDictionary.registerFormat({
  name: 'qc/css-dark',
  format: async ({ dictionary, options, file }) => {
    const header = await fileHeader({ file });
    const vars = formattedVariables({ format: 'css', dictionary, outputReferences: false, usesDtcg: options.usesDtcg });
    return (
      `${header}:root[data-theme="dark"] {\n${vars}\n  color-scheme: dark;\n}\n\n` +
      `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${vars}\n    color-scheme: dark;\n  }\n}\n`
    );
  },
});

// Dart color class per mode.
StyleDictionary.registerFormat({
  name: 'qc/dart-colors',
  format: async ({ dictionary, options, file }) => {
    const header = await fileHeader({ file, commentStyle: 'short' });
    const lines = dictionary.allTokens.map(
      (t) => `  static const Color ${t.name} = ${options.usesDtcg ? t.$value : t.value};`,
    );
    return `${header}import 'dart:ui';\n\nabstract final class ${options.className} {\n${lines.join('\n')}\n}\n`;
  },
});

// Which semantic roles alias tenant brand primitives (used by the server and clients
// to resolve dependent roles after tenant derivation).
StyleDictionary.registerFormat({
  name: 'qc/brand-dependents',
  format: ({ dictionary }) => {
    const out = {};
    for (const t of dictionary.allTokens) {
      const ref = t.original.$value;
      if (t.path[0] === 'color' && typeof ref === 'string' && ref.includes('primitive.color.brand')) {
        out[t.path.slice(1).join('.')] = {
          light: ref.slice(1, -1).replace('primitive.color.', ''),
          dark: t.original.$extensions?.[MODES_KEY]?.dark?.slice(1, -1).replace('primitive.color.', ''),
        };
      }
    }
    return JSON.stringify(out, null, 2) + '\n';
  },
});

/* ---------- Filters ---------- */
const isSemantic = (t) => t.path[0] !== 'primitive';               // apps never see primitives
const isModeColor = (t) => t.path[0] === 'color';
const isModeAware = (t) => t.path[0] === 'color' || t.path[0] === 'shadow';

const webTransforms = [
  'name/kebab',
  'qc/color/rgb-channels',
  'fontFamily/css',
  'cubicBezier/css',
  'shadow/css/shorthand',
  'typography/css/shorthand',
];

/* ---------- Builds ---------- */
const light = new StyleDictionary({
  source: ['tokens/tokens.json'],
  usesDtcg: true,
  log: { verbosity: 'default', warnings: 'error' },
  platforms: {
    web: {
      transforms: webTransforms,
      buildPath: 'dist/web/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          filter: isSemantic,
          options: { selector: ':root', outputReferences: true },
        },
      ],
    },
    dart: {
      transforms: ['qc/name/dart', 'qc/color/dart'],
      buildPath: 'dist/dart/',
      files: [
        {
          destination: 'qc_color_tokens.light.g.dart',
          format: 'qc/dart-colors',
          filter: isModeColor,
          options: { className: 'QcLightColors' },
        },
      ],
    },
    meta: {
      transforms: ['name/kebab'],
      buildPath: 'dist/meta/',
      files: [{ destination: 'brand-dependents.json', format: 'qc/brand-dependents' }],
    },
  },
});

const dark = new StyleDictionary({
  source: ['tokens/tokens.json'],
  usesDtcg: true,
  preprocessors: ['qc/mode-dark'],
  log: { verbosity: 'default', warnings: 'error' },
  platforms: {
    web: {
      transforms: webTransforms,
      buildPath: 'dist/web/',
      files: [{ destination: 'tokens.dark.css', format: 'qc/css-dark', filter: isModeAware }],
    },
    dart: {
      transforms: ['qc/name/dart', 'qc/color/dart'],
      buildPath: 'dist/dart/',
      files: [
        {
          destination: 'qc_color_tokens.dark.g.dart',
          format: 'qc/dart-colors',
          filter: isModeColor,
          options: { className: 'QcDarkColors' },
        },
      ],
    },
  },
});

await light.buildAllPlatforms();
await dark.buildAllPlatforms();
```

Notes on the configuration:

- `outputReferences: true` on the light CSS makes component variables point at semantic variables (`--component-stepper-background: var(--color-brand-primary)`), so the dark file only needs to redefine `color-*` and `shadow-*` variables. The dark build therefore filters to mode-aware tokens and emits resolved values.
- A small post-build step (`tools/concat.mjs`) concatenates `tokens.css` + `tokens.dark.css` + the `:lang()` font rules + the `prefers-reduced-motion` block into the published `tokens.css`, and merges the two Dart color files into `qc_color_tokens.g.dart` (`QcLightColors` and `QcDarkColors` in one file, as shown in `04-DESIGN-SYSTEM.md` section 12.1).
- Non-color Dart tokens (`qc_tokens.g.dart`: spacing as `double`, radius, `Duration`, `Cubic`, breakpoints) use a second custom format in the same style; omitted here because it follows the `qc/dart-colors` pattern with `dimension -> double` and `duration -> Duration(milliseconds: n)` transforms.
- `warnings: 'error'` fails the build on broken references or name collisions.

## 4. Build commands and CI

```bash
# in packages/design-tokens
npm run tokens:build      # node sd.config.mjs && node tools/concat.mjs
npm run tokens:check      # python3 tools/check_contrast.py tokens/tokens.json
npm run tokens:validate   # JSON parse + DTCG shape check (every leaf has $value; every $type known)
```

CI order on any change under `packages/design-tokens/`: validate, contrast check, build, then `git diff --exit-code` on the generated files committed to `apps/mobile/lib/design_system/generated/` (generated files must be committed and current), then Flutter golden tests and web visual tests in light and dark.

## 5. Tenant overrides at runtime

Tenant branding never edits `tokens.json`. The merge happens in three layers, later layers winning:

| Layer | Source | When |
|---|---|---|
| 1. Platform tokens | Generated files compiled into the apps (placeholder brand palette) | Build time |
| 2. Tenant brand roles | `branding.theme.light` / `.dark` in the bootstrap response, produced by `src/derive.ts` when the tenant admin saves branding and gated by the contrast check | App start (cached by `theme.version`, refreshed in the background) |
| 3. User preference | Theme mode (system, light, dark), text scale, reduced motion, numerals | Device |

**What the bootstrap overrides.** Only brand roles: `brand.primary`, `brand.primaryHover`, `brand.primaryPressed`, `brand.onPrimary`, `brand.primaryContainer`, `brand.onPrimaryContainer`, `brand.secondary`, `brand.onSecondary`, `brand.accent`, `brand.onAccent`, plus `font.family`, `font.files`, `radiusScale` and logos. Unknown keys are ignored; values that are not `#RRGGBB` are rejected by the client parser, falling back to layer 1 for that role.

**Dependent roles.** Clients resolve these from the brand roles with the fixed table below (generated as `dist/meta/brand-dependents.json` from the token aliases and checked in CI against this table):

| Dependent role | Light mode takes | Dark mode takes |
|---|---|---|
| `text.link` | `brand.primary` | `brand.primaryHover` |
| `border.focus` | `brand.primary` | `brand.primary` |
| `map.route` | `brand.primary` | `brand.primary` |
| `map.riderMarker` | `brand.accent` | `brand.accent` |
| `commerce.badge.newFill` | `brand.primaryContainer` | `brand.primaryContainer` |
| `commerce.badge.onNewFill` | `brand.onPrimaryContainer` | `brand.onPrimaryContainer` |

**Flutter merge.** `TenantTheme.fromBootstrap` parses the roles; `buildTheme` starts from `QcColors.light` / `QcColors.dark` and applies `withTenantRoles`, then sets `ThemeData.extensions`. Radius tokens are multiplied by `radiusScale`. The tenant font is registered with `FontLoader` from the cached font file before the first frame when present; otherwise the bundled Inter is used.

**Web merge.** `applyTenantTheme` (in `packages/ui-web`) writes a `<style id="tenant-theme">` after `tokens.css` that redefines the brand variables for `:root`, `:root[data-theme="dark"]` and the `prefers-color-scheme: dark` block, so Tailwind classes such as `bg-brand` pick up the tenant color with no rebuild. Values are validated as hex before injection, which prevents CSS injection through branding config.

**Safety net.** If the cached tenant theme is missing or corrupt, both platforms render with layer 1 (the neutral placeholder brand), which passes the contrast gate by construction.

## 6. Changing tokens

1. Edit `tokens.json` (primitives only when a ramp genuinely changes; prefer re-pointing a semantic alias).
2. Run `tokens:validate`, `tokens:check`, `tokens:build`.
3. Update `04-DESIGN-SYSTEM.md` tables and Appendix A if ratios changed.
4. Commit generated files; review Flutter goldens and web visual diffs in both modes and in RTL.
