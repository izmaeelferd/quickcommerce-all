#!/usr/bin/env bash
# Builds demo/web/ (used by docker-compose.demo.yml) from source. Needs Flutter and Node 18+.
# The all-in-one zip already contains demo/web, so you only need this when working from git.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/demo/web"
mkdir -p "$OUT"

cd "$ROOT/flutter-apps"
flutter pub get
for pair in customer:customer vendor:partner delivery:rider; do
  flavor="${pair%%:*}"; dir="${pair##*:}"
  echo "==> Flutter web: $flavor → /$dir/"
  flutter build web --release --no-web-resources-cdn -t "lib/main_$flavor.dart" --base-href "/$dir/" \
    --dart-define=API_BASE_URL=origin --dart-define=FLAVOR="$flavor"
  rm -rf "${OUT:?}/$dir" && cp -r build/web "$OUT/$dir"
  # CanvasKit is identical for all flavors: keep one shared copy (nginx maps /<app>/canvaskit/ to it).
  rm -rf "${OUT:?}/canvaskit" && mv "$OUT/$dir/canvaskit" "$OUT/canvaskit"
done

for pair in admin-panel:admin vendor-dashboard:vendor; do
  app="${pair%%:*}"; dir="${pair##*:}"
  echo "==> $app → demo/web/$dir"
  (cd "$ROOT/$app" && npm ci && VITE_API_URL= npm run build)
  rm -rf "${OUT:?}/$dir" && cp -r "$ROOT/$app/dist" "$OUT/$dir"
done
echo "Done: demo/web ready — start with ./scripts/demo.sh"
