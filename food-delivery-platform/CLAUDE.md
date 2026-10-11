# Food delivery platform: notes for Claude

A food delivery platform (customer, restaurant partner and rider apps, plus admin) where almost everything is configured at runtime from the admin panel.

## Layout
- `backend/`: Node/Express/MongoDB API with Socket.io. Config defaults live in `config/defaultConfig.js`, prices are calculated in `utils/pricing.js`, order statuses are handled in `utils/orderFlow.js`, and input validation is in `middleware/validation.js`.
- `flutter-apps/`: one Flutter codebase with three flavors: `customer`, `vendor` (the Partner app) and `delivery` (the Rider app). The entry points are `lib/main_<flavor>.dart`. The API URL is set at build time with `--dart-define=API_BASE_URL=...`.
- `admin-panel/` and `vendor-dashboard/`: React + Vite + Tailwind. The API URL comes from `VITE_API_URL`; leave it empty when the app is served on the same origin as the API.
- `docker-compose.yml` is for production. `docker-compose.demo.yml` with `demo/` is a local demo of every app. `docs/` holds the guides, and `TESTING.md` explains how to test locally.

## Setup commands (slash commands in `.claude/commands/`)
- `/setup-demo`: install or check Docker, start the demo stack and print the app links and logins.
- `/build-apks`: install or check Flutter and the Android SDK, then build debug APKs for all three apps against the local demo.
- `/install-apks`: install the built APKs on a phone connected over USB.

## Rules
- Don't hardcode anything. A new setting goes in `defaultConfig.js`, the `AppConfig` schema and its admin editor page. New UI text goes into the translations in `backend/seeders/translations/`.
- Every route that changes data gets a validator in `middleware/validation.js`.
- Checks to run before you finish:
  - `node --check` on any backend file you changed
  - `npm run test:e2e` in `backend/` (needs MongoDB and a running API)
  - `flutter analyze` in `flutter-apps/`
  - `npm run build` in `admin-panel/` and `vendor-dashboard/`
- Demo credentials and secrets exist only in `docker-compose.demo.yml`. Never reuse them in production.
