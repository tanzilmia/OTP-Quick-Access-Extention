# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 Chrome extension. The toolbar popup is a React app (Vite-bundled) that reads Gmail **read-only** via the Gmail REST API, extracts recent one-time codes from verification emails, and displays them for quick copy. There is no backend — OAuth is handled entirely by `chrome.identity` using the `client_id`/`scopes` declared in `public/manifest.json`.

## Commands

```bash
npm run dev      # Vite dev server — UI iteration ONLY; OAuth/Gmail will NOT work here (see below)
npm run build    # Bundle to dist/ — this is what you load as the unpacked extension
npm run lint     # ESLint (flat config, eslint.config.js)
```

There is **no test suite or test runner** configured.

### Running/verifying the real extension

OAuth only works inside the actual extension popup, never on `localhost` or `file://` (`chrome.runtime.id` is empty there; `src/auth/googleIdentity.js` detects this and throws an explanatory error). To test anything touching auth or Gmail:

1. `npm run build`
2. `chrome://extensions` → enable Developer mode → **Load unpacked** → select the `dist/` folder
3. Click the toolbar icon to open the popup. After editing code, rebuild and hit the reload icon on the extension card.

## Architecture

### Build/packaging quirks

- `vite.config.js` sets `base: './'` (relative paths, required for the `chrome-extension://` origin) and forces stable, non-hashed output filenames under `assets/` so the manifest can reference predictable paths.
- Files in `public/` (`manifest.json`, `background.js`, `icons/`) are copied verbatim into `dist/` by Vite. Edit these in `public/`, not `dist/`.
- `background.js` is a near-empty service worker — the manifest requires one, but all real work happens in the popup. `alarms`/`storage` permissions are declared but the background does nothing with them yet.

### The OTP pipeline (the core of the app)

Data flows `App.jsx` → `fetchRecentOtps` → Gmail API → per-message parse/extract. The interesting logic lives in `src/gmail/`:

- **`constants.js`** — `OTP_SEARCH_QUERY` (the Gmail search string, `newer_than:7d` + OTP-ish keywords), `OTP_REGEX` (4–8 digit runs), and result caps (`SEARCH_MAX_RESULTS` fetched, `DISPLAY_MAX_OTPS` shown).
- **`fetchRecentOtps.js`** — search for message stubs, fetch each in full (`format=full`) in parallel, parse, drop nulls, sort newest-first, slice to display cap.
- **`gmailClient.js`** — thin Gmail REST wrapper; `gmailFetchJson` surfaces `error.message` from Google's JSON on non-2xx.
- **`decodeBody.js`** — recursively walks the MIME `payload` tree, base64url-decodes `text/plain` and crudely strips `text/html` to text.
- **`parseMessage.js`** — the extraction heart. From one message it picks the single best OTP candidate by **scoring**, not just regex. Candidates (plain digit runs + separator-formatted runs like `123-456`) are scored on length, proximity to OTP-context words (`OTP_CONTEXT_RE`), penalties for footer/phone-number context, and a calendar-year filter. A candidate is only accepted if `looksLikeOtpContext` passes — this is what prevents newsletters and order numbers from being returned as codes.
- **`otpProfiles.js`** — sender-specific tuning. `getOtpExtractionHints(from, subject)` matches the sender domain/subject against an ordered `PROFILES` list (Google, Apple, Microsoft, banks, etc., first match wins) and returns hints (`preferredLengths`, `extraContextRes`, `minLen`/`maxLen`) that bias the scoring in `parseMessage.js`. **To improve detection for a specific provider, add or adjust a profile here** rather than touching the generic scorer.

When changing extraction behavior, remember `parseMessage.js` and `otpProfiles.js` are coupled through the `OtpExtractionHints` typedef — the hints produced by a profile are consumed by `scoreCandidate`/`pickBestFromHaystack`.

### Auth / session model (`src/auth/googleIdentity.js`)

- `getSilentAuthToken` (non-interactive, restores a cached session on popup open) vs `getInteractiveAuthToken` (shows Google's consent UI).
- Sign-out / switch-account go through `clearGoogleSession`: revoke the token at Google's `/revoke` endpoint, remove it from Chrome's identity cache (`removeCachedAuthToken` + `clearAllCachedAuthTokens`), and set the `OTP_SESSION_CLEARED_KEY` flag in `chrome.storage.local`.
- That cleared-flag is the gate `App.jsx` checks before attempting silent restore — without it, Chrome would silently re-grant the old token and "Sign out" would not stick. Preserve this flag's set/clear pairing (`markSessionActive` clears it on successful connect) when editing auth flows.

### UI

`App.jsx` owns all state (token, otps, loading/error, theme) and passes callbacks down to presentational components in `src/components/` (each with a co-located `.css`). Theme is light/dark via `data-theme` on `<html>` and CSS custom properties, persisted to `localStorage` by `src/theme/themeStorage.js` (`commitTheme` applies immediately, independent of React render).
