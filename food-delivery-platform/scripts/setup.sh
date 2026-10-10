#!/usr/bin/env bash
# One-shot local setup: installs dependencies, creates env files, seeds the database.
# Usage: ./scripts/setup.sh [--docker]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }

[ -f backend/.env ] || { cp backend/.env.example backend/.env; say "Created backend/.env — edit secrets before production"; }
[ -f admin-panel/.env ] || cp admin-panel/.env.example admin-panel/.env
[ -f vendor-dashboard/.env ] || cp vendor-dashboard/.env.example vendor-dashboard/.env
[ -f .env ] || cp .env.example .env

if [ "${1:-}" = "--docker" ]; then
  say "Building and starting containers"
  docker compose up -d --build
  say "Seeding database"
  docker compose exec -T backend node seeders/seedDatabase.js
  say "Done → API :5000 · Admin :5173 · Vendor :5174"
  exit 0
fi

command -v node >/dev/null || { echo "Node.js 18+ is required"; exit 1; }

say "Installing backend dependencies"
(cd backend && npm install)
say "Installing admin panel dependencies"
(cd admin-panel && npm install)
say "Installing vendor dashboard dependencies"
(cd vendor-dashboard && npm install)

if command -v flutter >/dev/null; then
  say "Fetching Flutter packages"
  (cd flutter-apps && flutter pub get)
else
  echo "Flutter not found — skipping mobile apps (see docs/FLUTTER_BUILD_GUIDE.md)"
fi

say "Seeding database (MongoDB must be running at MONGO_URI)"
node scripts/seed-database.js

cat <<MSG

Setup complete. Start everything with:
  (cd backend && npm run dev)
  (cd admin-panel && npm run dev)        # http://localhost:5173
  (cd vendor-dashboard && npm run dev)   # http://localhost:5174

Admin login: see SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in backend/.env
MSG
