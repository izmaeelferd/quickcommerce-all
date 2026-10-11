# FeastFlow Cookie & Browser Storage Policy

> **TEMPLATE — NOT LEGAL ADVICE.** This is a starting-point template. It is not legal advice. Cookie and tracking rules (e.g. the EU ePrivacy Directive, GDPR, UK PECR, India's DPDP Act, 2023, US state laws) differ by jurisdiction. **Have qualified legal counsel review it before publishing.** Replace every `[BRACKETED PLACEHOLDER]`.
>
> **Configured values:** This policy has few configurable numbers. Where it refers to settings controlled in the Admin Panel (e.g. **Config → Theme → dark mode default**, **Config → Languages**), make sure the description matches your live configuration. **Accuracy check before publishing:** this policy describes the FeastFlow web dashboards **as shipped**. If you add analytics, chat widgets, ads, A/B testing, error-tracking or any other third-party script, or put a marketing website on the same domain, you **must** update Section 5 (and, in the EU/UK, add a consent banner) before going live.

**Last updated:** [EFFECTIVE DATE]

This policy explains how **[COMPANY LEGAL NAME]** ("FeastFlow", "we") uses cookies and similar browser storage technologies on:

- the **FeastFlow Admin Panel** — [ADMIN PANEL URL] — used by FeastFlow staff; and
- the **FeastFlow Vendor Dashboard** — [VENDOR DASHBOARD URL] — used by restaurant partners.

The FeastFlow **mobile apps** (customer, Partner and Rider) do not use browser cookies; how they store data on your device is covered by the [Privacy Policy](privacy-policy.md). If you run a separate marketing website at [WEBSITE URL], publish a separate cookie notice for it describing the tools used there.

---

## 1. What are cookies and local storage?

**Cookies** are small text files a website stores in your browser and sends back to the server with each request. **Local storage** (`localStorage`) is a similar browser feature that lets a website save small pieces of data in your browser; unlike cookies, it is **not** sent automatically to the server with every request and is only readable by the same website. The law generally treats both the same way: storage that is **strictly necessary** to provide a service you asked for does not require consent, while non-essential storage (e.g. analytics or advertising) generally does.

## 2. Summary

- The Admin Panel and Vendor Dashboard **do not set tracking cookies**.
- They store a **small number of items in your browser's local storage**: your login tokens (so you stay signed in) and your language and dark-mode preferences.
- **No third-party analytics, advertising or social-media trackers are included by default.**
- All of the items below are **strictly necessary** or **functional preferences** you choose yourself.

## 3. What we store in your browser

### 3.1 Admin Panel

| Key (localStorage) | Purpose | Category | Contents | How long it lasts |
|---|---|---|---|---|
| `admin_access_token` | Keeps you signed in; sent by our app (not automatically by the browser) as an authorization header to the FeastFlow API | Strictly necessary | Short-lived signed access token (JWT) | Until you log out, the token is cleared after a failed refresh, or you clear browser data. The token itself expires after [15 MINUTES — default of the `JWT_ACCESS_EXPIRES_IN` server setting; confirm yours]. |
| `admin_refresh_token` | Obtains a new access token when the old one expires, so you don't have to log in repeatedly | Strictly necessary | Signed refresh token | Until logout / browser data cleared; expires after [30 DAYS — default of the `JWT_REFRESH_EXPIRES_IN` server setting; confirm yours] |
| `admin_language` | Remembers the dashboard language you selected | Functional (preference) | Language code, e.g. `en`, `hi` | Until changed or browser data cleared |
| `admin_dark_mode` | Remembers whether you chose dark mode | Functional (preference) | `true` / `false` | Until changed or browser data cleared |

### 3.2 Vendor Dashboard

| Key (localStorage) | Purpose | Category | Contents | How long it lasts |
|---|---|---|---|---|
| `vendor_access_token` | Keeps you signed in to your restaurant dashboard | Strictly necessary | Short-lived signed access token (JWT) | Until logout / browser data cleared; token expiry as above |
| `vendor_refresh_token` | Renews your session without re-entering your password | Strictly necessary | Signed refresh token | Until logout / browser data cleared; token expiry as above |
| `vendor_language` | Remembers your selected language | Functional (preference) | Language code | Until changed or browser data cleared |
| `vendor_dark_mode` | Remembers your dark-mode choice | Functional (preference) | `true` / `false` | Until changed or browser data cleared |

**Logging out** removes the access and refresh tokens from your browser and invalidates the refresh token on our server. Language and dark-mode preferences remain until you change them or clear your browser data.

**Security tip:** Because login tokens are stored in your browser, do not use the dashboards on shared or public computers, always log out when finished, and keep your browser and extensions up to date.

### 3.3 Cookies set by infrastructure

Our servers, reverse proxy (Nginx) and hosting/CDN provider [HOSTING/CDN PROVIDER] **do not set cookies by default**. If you place the dashboards behind a CDN, firewall or load balancer that sets its own cookies (e.g. for bot protection or load balancing), list them here: [COOKIE NAME — PROVIDER — PURPOSE — DURATION].

### 3.4 Real-time connection

The dashboards open a real-time (WebSocket / Socket.io) connection to receive live order and configuration updates. This connection uses your access token for authentication and does not store tracking data in your browser. [CONFIRM: if your deployment enables Socket.io sticky-session cookies, e.g. `io`, list them here as strictly necessary.]

## 4. Legal basis

Strictly necessary storage (login tokens) is used because it is essential to provide the secure dashboard you requested; consent is not required for this under the ePrivacy Directive/PECR exemption, and it is processed under our contract with you / legitimate interests (security). Preference storage (language, dark mode) is set only when you choose those options and is used solely to remember your choice. [COUNSEL: confirm whether preference storage requires consent in your target jurisdictions.]

## 5. Analytics and third-party tools (only if you add them)

*[OPTIONAL — The FeastFlow dashboards ship without analytics. If you add any, fill in and keep this section; otherwise state "We do not use analytics or advertising cookies on the dashboards." and delete the table.]*

| Tool / Provider | Purpose | Cookies / storage set | Duration | Data shared / transfer | Opt-out |
|---|---|---|---|---|---|
| [e.g. ANALYTICS TOOL] | [Usage analytics] | [COOKIE NAMES] | [DURATION] | [PROVIDER, COUNTRY] | [LINK] |
| [e.g. ERROR TRACKING TOOL] | [Crash/error reporting] | [ ] | [ ] | [ ] | [ ] |
| [e.g. SUPPORT CHAT WIDGET] | [Customer support] | [ ] | [ ] | [ ] | [ ] |

If you add non-essential cookies or storage and have users in the EU/UK (or elsewhere where consent is required), you must: show a consent banner **before** setting them; allow users to accept or reject as easily; record consent; and provide a way to change choices later (e.g. a "Cookie settings" link in the footer: [COOKIE SETTINGS LINK]).

## 6. How to control or delete browser storage

You can clear local storage and cookies at any time in your browser settings — usually under **Settings → Privacy → Clear browsing data / Cookies and site data** (Chrome, Edge), **Settings → Privacy & Security → Cookies and Site Data** (Firefox), or **Settings → Privacy → Manage Website Data** (Safari). Clearing site data for the dashboard will **sign you out** and reset your language and theme preferences. Blocking site storage entirely will prevent you from logging in.

## 7. Changes

We may update this policy when we change how the dashboards work or add tools. The "Last updated" date shows when it last changed.

## 8. Contact

[COMPANY LEGAL NAME], [REGISTERED ADDRESS] · [PRIVACY EMAIL] · Grievance Officer: [GRIEVANCE OFFICER NAME], [GRIEVANCE EMAIL]
