#!/usr/bin/env python3
"""WCAG 2.2 contrast gate for design-tokens/tokens.json (blueprint).

Resolves semantic color tokens for light and dark mode (dark values live in
$extensions["com.quickcart.modes"].dark) and checks every declared pair.
Exit code 1 if any pair fails. Usage:

    python3 check_contrast.py tokens.json [-v] [-t]

-v prints every pair, -t prints a per-token minimum-ratio table (Markdown).
The same pair list is enforced on tenant-derived themes in CI and at
branding-save time (see 04-DESIGN-SYSTEM.md, section 3.4).
"""
import json
import sys

TEXT = 4.5      # WCAG 1.4.3 normal text
NON_TEXT = 3.0  # WCAG 1.4.11 UI components and graphics

SURFACES = ["background.canvas", "surface.base", "surface.raised",
            "surface.overlay", "surface.sunken"]

TEXT_ON_SURFACES = [
    "text.primary", "text.secondary", "text.tertiary", "text.link",
    "brand.primary", "commerce.price.current", "commerce.price.mrp",
    "commerce.price.perUnit", "commerce.price.saving",
    "feedback.success.fg", "feedback.warning.fg", "feedback.danger.fg",
    "feedback.info.fg", "sla.onTrack", "sla.atRisk", "sla.breached",
]

GRAPHICS_ON_SURFACES = [
    "border.strong", "border.focus", "dietary.veg", "dietary.nonVeg",
    "dietary.egg", "dietary.other", "commerce.rating.star", "map.route",
    "map.riderMarker", "map.destination",
]

TEXT_ON_FILL = [
    ("brand.onPrimary", "brand.primary"),
    ("brand.onPrimary", "brand.primaryHover"),
    ("brand.onPrimary", "brand.primaryPressed"),
    ("brand.onPrimaryContainer", "brand.primaryContainer"),
    ("brand.onSecondary", "brand.secondary"),
    ("brand.onAccent", "brand.accent"),
    ("text.inverse", "surface.inverse"),
    ("commerce.discount.onFill", "commerce.discount.fill"),
    ("commerce.offer.onFill", "commerce.offer.fill"),
    ("commerce.offer.onContainer", "commerce.offer.container"),
    ("commerce.badge.onNewFill", "commerce.badge.newFill"),
    ("commerce.badge.onBestsellerFill", "commerce.badge.bestsellerFill"),
    ("commerce.badge.onLimitedStockFill", "commerce.badge.limitedStockFill"),
    ("commerce.badge.onOutOfStockFill", "commerce.badge.outOfStockFill"),
    ("commerce.rating.onFill", "commerce.rating.fill"),
] + [(f"feedback.{k}.onFill", f"feedback.{k}.fill")
     for k in ("success", "warning", "danger", "info")] \
  + [(f"feedback.{k}.onContainer", f"feedback.{k}.container")
     for k in ("success", "warning", "danger", "info")]

SOLID_FILLS_ON_BASE = [
    "commerce.discount.fill", "commerce.offer.fill",
    "commerce.badge.outOfStockFill", "commerce.rating.fill", "brand.primary",
]


def load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def node_at(tokens, dotted):
    node = tokens
    for part in dotted.split("."):
        node = node[part]
    return node


def resolve(tokens, value, mode):
    while isinstance(value, str) and value.startswith("{") and value.endswith("}"):
        node = node_at(tokens, value[1:-1])
        modes = node.get("$extensions", {}).get("com.quickcart.modes", {})
        value = modes["dark"] if mode == "dark" and "dark" in modes else node["$value"]
    return value


def luminance(hex_color):
    h = hex_color.lstrip("#")[:6]
    channels = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a, b):
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def pairs():
    out = [(fg, bg, TEXT) for fg in TEXT_ON_SURFACES for bg in SURFACES]
    out += [(fg, bg, NON_TEXT) for fg in GRAPHICS_ON_SURFACES for bg in SURFACES]
    out += [(fg, bg, TEXT) for fg, bg in TEXT_ON_FILL]
    out += [(fg, "surface.base", NON_TEXT) for fg in SOLID_FILLS_ON_BASE]
    return out


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    tokens = load(argv[1])
    verbose, table = "-v" in argv, "-t" in argv
    failures, checked, minima = 0, 0, {}
    for mode in ("light", "dark"):
        for fg, bg, required in pairs():
            a = resolve(tokens, "{color." + fg + "}", mode)
            b = resolve(tokens, "{color." + bg + "}", mode)
            ratio = contrast(a, b)
            checked += 1
            passed = ratio >= required
            minima.setdefault(fg, {}).setdefault(mode, []).append(ratio)
            if not passed:
                failures += 1
            if verbose or not passed:
                status = "PASS" if passed else "FAIL"
                print(f"{status} {mode:5} {fg:36} on {bg:30} {a} {b} {ratio:5.2f} (min {required})")
    if table:
        print("| Foreground token | Min ratio light | Min ratio dark |")
        print("|---|---|---|")
        for fg, by_mode in minima.items():
            print(f"| `{fg}` | {min(by_mode['light']):.2f} | {min(by_mode['dark']):.2f} |")
    print(f"checked {checked} pairs, {failures} failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
