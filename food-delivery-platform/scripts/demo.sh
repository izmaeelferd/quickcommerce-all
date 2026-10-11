#!/usr/bin/env bash
# One-command local demo of every app (customer, partner, rider, admin panel, vendor dashboard).
#   ./scripts/demo.sh          # this computer only (http://localhost:...)
#   ./scripts/demo.sh --lan    # also reachable from phones on the same Wi-Fi
#   ./scripts/demo.sh --stop   # stop the demo (data is kept)
#   ./scripts/demo.sh --reset  # stop and DELETE all demo data
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
DC=(docker compose -f docker-compose.demo.yml)

command -v docker >/dev/null || { echo "Docker Desktop / Docker Engine is required: https://docs.docker.com/get-docker/"; exit 1; }
case "${1:-}" in
  --stop)  "${DC[@]}" down; exit 0 ;;
  --reset) "${DC[@]}" down -v; exit 0 ;;
esac
[ -f demo/web/customer/index.html ] || { echo "demo/web is missing. Use the all-in-one zip, or build it with ./scripts/build-web-demo.sh"; exit 1; }

HOST=localhost
if [ "${1:-}" = "--lan" ]; then
  HOST="$( (hostname -I 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || true) | awk '{print $1}')"
  [ -n "$HOST" ] || { echo "Could not detect the LAN IP; run: DEMO_HOST=<your-ip> BIND_HOST=0.0.0.0 $0"; exit 1; }
  export BIND_HOST=0.0.0.0
fi
export DEMO_HOST="${DEMO_HOST:-$HOST}"

echo "==> Starting containers (first run builds the API image; takes a few minutes)"
"${DC[@]}" up -d --build
echo "==> Waiting for the API"
for i in $(seq 1 60); do
  "${DC[@]}" exec -T backend wget -qO- http://127.0.0.1:5000/api/health >/dev/null 2>&1 && break
  sleep 2
done
echo "==> Seeding demo data (safe to repeat)"
"${DC[@]}" exec -T backend node seeders/seedDatabase.js

cat <<MSG

Done: Demo is running
  Customer app      http://$DEMO_HOST:8080/customer/   customer@example.com / Password@123
  Partner app       http://$DEMO_HOST:8080/partner/    vendor1@example.com  / Password@123
  Rider app         http://$DEMO_HOST:8080/rider/      rider@example.com    / Password@123
  Admin panel       http://$DEMO_HOST:5173             admin@yourapp.com    / ${DEMO_ADMIN_PASSWORD:-Admin@12345}
  Vendor dashboard  http://$DEMO_HOST:5174             vendor1@example.com  / Password@123

Stop: ./scripts/demo.sh --stop     Wipe data: ./scripts/demo.sh --reset
MSG
