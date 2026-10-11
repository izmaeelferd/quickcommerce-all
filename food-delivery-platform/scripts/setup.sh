#!/usr/bin/env bash
# One-shot setup: installs dependencies for every service, creates .env files from the
# examples, seeds MongoDB and starts the API.
#   ./scripts/setup.sh            # local Node + MongoDB (MONGODB_URI in backend/.env)
#   ./scripts/setup.sh --docker   # everything in containers
#   ./scripts/setup.sh --no-start # install + seed only
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

[ -f backend/.env ] || { cp backend/.env.example backend/.env; say "Created backend/.env — edit secrets before going to production"; }
[ -f admin-panel/.env ] || cp admin-panel/.env.example admin-panel/.env
[ -f vendor-dashboard/.env ] || cp vendor-dashboard/.env.example vendor-dashboard/.env
[ -f .env ] || cp .env.example .env

if [ "${1:-}" = "--docker" ]; then
  command -v docker >/dev/null || { echo "Docker is required for --docker"; exit 1; }
  say "Building and starting containers"
  docker compose up -d --build
  say "Seeding database"
  docker compose exec -T backend node seeders/seedDatabase.js
  say "Done → API http://localhost:5000 · Admin http://localhost:5173 · Vendor http://localhost:5174"
  exit 0
fi

command -v node >/dev/null || { echo "Node.js 18+ is required"; exit 1; }
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || { echo "Node.js 18+ is required"; exit 1; }

say "Installing backend dependencies";          (cd backend && npm ci)
say "Installing admin panel dependencies";      (cd admin-panel && npm ci)
say "Installing vendor dashboard dependencies"; (cd vendor-dashboard && npm ci)
if command -v flutter >/dev/null; then
  say "Fetching Flutter packages"; (cd flutter-apps && flutter pub get)
else
  echo "Flutter not found — skipping mobile apps (see docs/FLUTTER_BUILD_GUIDE.md)"
fi

say "Seeding database (MongoDB must be reachable at MONGODB_URI)"
node scripts/seed-database.js

if [ "${1:-}" = "--no-start" ]; then exit 0; fi

say "Starting the API (logs: backend/api.log)"
(cd backend && exec nohup node server.js > api.log 2>&1 < /dev/null) &
echo $! > backend/api.pid
for i in $(seq 1 20); do
  if curl -fs "http://localhost:$(grep -E '^PORT=' backend/.env | cut -d= -f2 || echo 5000)/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done

cat <<MSG

API running (pid $(cat backend/api.pid)). Next:
  (cd admin-panel && npm run dev)        # http://localhost:5173
  (cd vendor-dashboard && npm run dev)   # http://localhost:5174
Log in to the admin panel with ADMIN_DEFAULT_EMAIL and the password printed above
(or ADMIN_DEFAULT_PASSWORD), then CHANGE THE PASSWORD (header → Change password).
Stop the API: kill \$(cat backend/api.pid)
MSG
