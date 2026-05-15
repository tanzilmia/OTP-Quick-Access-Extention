# OTP Quick Access

Chrome extension (Manifest V3) that connects to **Gmail** with **read-only** access, searches recent messages for likely OTP / verification emails, extracts numeric codes, and lists them in the toolbar **popup** for quick copy.

## What you need

- **Node.js** (for building)
- **Google Chrome** (Chromium-based browsers that support MV3 + `chrome.identity` work too)
- A **Google Cloud OAuth client** configured for this extension (see below)

## How to run it (local install)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure OAuth** (first time only)

   In [Google Cloud Console](https://console.cloud.google.com/):

   - Create or pick a project; enable the **Gmail API**.
   - **Credentials** → **Create credentials** → **OAuth client ID**.
   - Application type: **Chrome extension**.
   - **Extension ID**: install the unpacked extension once (step 4) and copy the ID from `chrome://extensions`, or use a packed `.pem`-derived ID if you already have one.
   - Put the client ID in `public/manifest.json` under `oauth2.client_id` (and keep `scopes` as `https://www.googleapis.com/auth/gmail.readonly`).
   - Rebuild (`npm run build`) so `dist/manifest.json` picks up changes.

3. **Production build** (what Chrome loads)

   ```bash
   npm run build
   ```

   Output goes to **`dist/`** (`index.html`, `assets/*`, `manifest.json`, `background.js`, icons, etc.). Vite uses `base: './'` so asset paths work inside the extension popup.

4. **Load unpacked**

   - Open `chrome://extensions`
   - Turn on **Developer mode**
   - **Load unpacked** → choose the **`dist`** folder (not the repo root)

5. **Use the real popup**

   Click the extension icon in the toolbar to open the popup. **OAuth does not work** from a normal tab (`npm run dev` / localhost or `file://`) because `chrome.identity.getAuthToken` requires an extension context (`chrome.runtime.id`).

Optional checks:

```bash
npm run lint      # ESLint
npm run preview   # Vite preview (still not the extension popup; OAuth won’t apply)
```

---

## How this approach works

### High-level flow

1. **Manifest V3** declares `oauth2` (client ID + Gmail readonly scope), `identity` permission, and `host_permissions` for `https://www.googleapis.com/*`.
2. The popup calls **`chrome.identity.getAuthToken({ interactive: true })`**. Chrome runs the OAuth consent flow and returns an access token; no backend server is required for basic usage.
3. The app calls the **Gmail REST API** (`gmail/v1`) with `Authorization: Bearer <token>`:
   - **messages.list** with a Gmail search query (recent messages that look OTP-related).
   - **messages.get** (`format=full`) for each candidate.
4. **Parsing** (`decodeBody`, `parseMessage`) walks MIME parts, decodes `base64url`, normalizes HTML-ish text, runs a **regex** for 4–8 digit codes, picks the best candidate per message, sorts by date, and shows the top N in the UI.

### Why React + Vite

- **React** powers the popup UI (connection card, OTP list, theme toggle, errors).
- **Vite** bundles the popup entry (`src/main.jsx` → `dist/assets/index.js`) and copies **`public/`** into **`dist/`**, which is where `manifest.json`, `background.js`, and icons must live for MV3.

### Important files

| Area | Path |
|------|------|
| Popup shell / state | `src/App.jsx` |
| OAuth helpers | `src/auth/googleIdentity.js` |
| Gmail HTTP | `src/gmail/gmailClient.js` |
| Search + fetch pipeline | `src/gmail/fetchRecentOtps.js` |
| Query / regex / limits | `src/gmail/constants.js` |
| Extract OTP from message | `src/gmail/parseMessage.js`, `decodeBody.js` |
| MV3 manifest (source) | `public/manifest.json` |
| Theme persistence | `src/theme/themeStorage.js` (`localStorage`) |

### Background service worker

`public/background.js` is a minimal MV3 worker (currently only `chrome.runtime.onInstalled`). Gmail calls happen **from the popup**, not from the service worker.

### Privacy / security

- Scope is **read-only** Gmail (`gmail.readonly`).
- Tokens are handled by Chrome’s identity layer; treat builds as trusted and **do not commit** untrusted client secrets (Chrome extension OAuth uses the client ID in the manifest, not a client secret in the extension).
- For production / Chrome Web Store, use **your own** OAuth client and extension ID; rotate IDs if this repo’s manifest was ever shared publicly.

---

## Customizing behavior

- **Search coverage**: edit `OTP_SEARCH_QUERY` in `src/gmail/constants.js`.
- **Code shape**: `OTP_REGEX` (digit length and word boundaries).
- **How many messages / OTPs**: `SEARCH_MAX_RESULTS`, `DISPLAY_MAX_OTPS` in the same file.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| “Chrome identity API is unavailable” | Open the **extension popup**, not localhost / file tab. |
| OAuth errors | Gmail API enabled; OAuth client type **Chrome extension**; manifest `oauth2.client_id` matches that client; extension ID matches Google Cloud. |
| Empty OTP list | Inbox may not match the query; widen keywords or inspect messages in Gmail with the same search string. |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (UI only; Gmail OAuth won’t work here). |
| `npm run build` | Build extension into `dist/`. |
| `npm run preview` | Preview production build in a browser tab. |
| `npm run lint` | Run ESLint. |
