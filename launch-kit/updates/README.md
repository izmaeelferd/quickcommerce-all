# FeastFlow — Update System

A repeatable way to keep developing the FeastFlow codebase (`food-delivery-platform/`) with **any** AI assistant — ChatGPT, Claude, Gemini or another tool with a code sandbox and file uploads — without re-explaining the architecture every time.

| File | Purpose |
|---|---|
| [`UPDATE_PROMPT.md`](UPDATE_PROMPT.md) | The master prompt. Paste it into a new chat together with the codebase zip. Contains the architecture, conventions, behaviour rules (FORGE-Z), checks and deploy steps. |
| [`CHANGELOG.md`](CHANGELOG.md) | Keep a Changelog history, v1.0.0 entry, template for new entries, semver rules, how to force app updates via `appVersions`. |
| [`feature-backlog.md`](feature-backlog.md) | 90 prioritised feature ideas (P0–P3, effort S–XL) with the modules each one touches — ready to request by ID. |

---

## The workflow (every change)

### 1. Prepare the codebase zip
From the folder that contains `food-delivery-platform/`:
```bash
cd /opt/food-delivery            # or wherever your repo lives
git pull                         # make sure you send the latest code
zip -r food-delivery-platform-FINAL.zip food-delivery-platform \
  -x "*/node_modules/*" "*/.git/*" "*/dist/*" "*/build/*" "*/.dart_tool/*" "*/uploads/*" "*/.env"
```
**Never include `.env` files, keystores, `google-services.json`/`GoogleService-Info.plist` or service-account JSON** — the exclude list above removes `.env`; check for the others before uploading (`unzip -l food-delivery-platform-FINAL.zip | grep -iE "\.env|keystore|\.jks|service-account|GoogleService"` should print nothing).

### 2. Produce the file tree (optional but recommended)
```bash
cd food-delivery-platform
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/.dart_tool/*" | sort > /tmp/tree.txt
```
Paste the contents into section 9 of the prompt (`[PASTE CURRENT FILE TREE HERE]`). If it is too long for the chat, leave the placeholder — the prompt tells the assistant to map the tree itself from the uploaded zip (or from `MANIFEST.txt`).

### 3. Start a fresh chat
1. Upload `food-delivery-platform-FINAL.zip`.
2. Paste the prompt from `UPDATE_PROMPT.md` (everything between the `=====` lines).
3. Replace section 10 `[DESCRIBE THE NEW FEATURE OR CHANGE HERE]` with your request. Good requests are specific:
   - "Implement **FIN-01** from the feature backlog: vendor payout button on the Restaurants page."
   - "Add a small-order fee: orders below ₹149 pay ₹20. Admin-editable. Show it as a separate bill row."
   - "Fix: rider app doesn't show the customer's landmark on the order card."
4. Send. The assistant will plan (affected files), implement, run checks, and hand you a zip.

### 4. If the answer stops with `CONTINUE?`
That's the length-limit protocol: reply `continue`. Repeat until it says it's complete. Don't start a new chat in the middle of a feature — the context is in the current one.

### 5. Review and apply
```bash
cd /path/to/repo
unzip -o ~/Downloads/<delivered>.zip -d .        # zip mirrors repo paths
git status && git diff                           # review every change
```
Read `CHANGES.md` from the zip. Then run the checks yourself:
```bash
cd food-delivery-platform
find backend scripts -name "*.js" -not -path "*/node_modules/*" -print0 | xargs -0 -n1 node --check
cd backend && npm ci && npm run seed && npm run dev            # terminal 1 (local MongoDB)
ADMIN_DEFAULT_PASSWORD="<your seeded admin password>" API_URL=http://localhost:5000/api npm run test:e2e   # terminal 2
npm run test:scheduler
cd ../admin-panel && npm ci && npx vite build
cd ../vendor-dashboard && npm ci && npx vite build
cd ../flutter-apps && flutter pub get && flutter analyze && flutter test
```
(`npm run seed:reset` gives a clean test database — **local only, never production**.)

### 6. Commit, document, deploy
```bash
git checkout -b feature/<short-name>
git add -A && git commit -m "feat: <summary>"
```
- Make sure `CHANGELOG.md` has the entry (move it from `[Unreleased]` to a version on release; semver rules are in the changelog).
- Deploy following the steps the assistant gave you (they match `docs/DEPLOYMENT_GUIDE.md`):
  - Path A: `git pull && docker compose up -d --build && docker compose exec backend npm run seed`
  - Path B: `git pull && cd backend && npm ci --omit=dev && npm run seed && pm2 restart food-api` + rebuild the panels
  - Check `curl -s https://[API DOMAIN]/api/health`
- Review any new config defaults in the Admin Panel (Business Rules / Feature Flags / Settings) — new features may ship behind a flag.
- If Flutter changed: bump `version:` in `flutter-apps/pubspec.yaml`, build each affected flavor, submit to the stores, and after approval update **Admin → Settings → App Versions**.

### 7. Keep the prompt current
After each shipped feature, edit `UPDATE_PROMPT.md`:
- Section 4 (MODULES): add the feature; remove it from the "NOT built" list.
- Section 3: add any new architectural piece (e.g. Redis, a worker process, a new socket event).
- Section 5: add any new convention you want enforced.
Then re-zip the codebase for the next session. An outdated prompt is the #1 cause of AI-written code that doesn't fit.

---

## Tips
- **One feature per chat** gives the best results. For XL items (e.g. GEO-01 multi-city zones, MON-01 ads marketplace), ask for the backend + admin first, then the Flutter screens in a follow-up message in the same chat.
- If the assistant proposes changing the stack, hardcoding values, skipping validators or skipping translation keys, point it back to sections 1 and 5 of the prompt.
- If an assistant has no sandbox, it can still follow the prompt, but you must run every check yourself — be stricter in review.
- Keep secrets out of chats. If one leaks, follow `../operations/incident-response.md` §10.
- Security-sensitive changes (auth, payments, refunds, wallet) deserve a human code review and a test with real test-mode gateway keys before release.
