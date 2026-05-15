# OTP Quick Access

## What this extension is

**OTP Quick Access** is a Chrome extension that reads your **Gmail** (read-only) and collects **recent one-time codes** from verification-style emails. It shows them in a small panel when you click the extension icon, so you can copy a code quickly instead of searching your inbox.

It does **not** send mail, delete mail, or change your account. It only **looks up recent messages** that match a search for things like “verification code,” “OTP,” “2FA,” and similar wording, then tries to pick out **4–8 digit numbers** from those emails.

---

## How to use it

1. **Install the extension**  
   After it is added to Chrome (for example from the Chrome Web Store or by loading an unpacked build from your developer), you will see **OTP Quick Access** in the toolbar.

2. **Open the popup**  
   Click the extension **icon** next to the address bar. The popup must be opened this way so Gmail sign-in works correctly.

3. **Connect Gmail**  
   The first time, choose **Connect Gmail** (or equivalent). Google opens a screen where you can choose **which Google account** to use (if you use more than one), then approve read-only mail access for this extension.

4. **Read your status**  
   You should see that you are **Connected**. If not, connect again or check that you completed sign-in.

5. **See recent codes**  
   Under **Recent codes**, the extension lists the latest extracted codes it found, newest first. Each row shows who it thinks the message is from, the **digits**, and roughly **when** it arrived.

6. **Copy a code**  
   Tap **Copy** on the row you need. Paste it into the app or site that asked for the code.

7. **Refresh**  
   When a **new** email arrives, tap **Refresh** so the list updates from Gmail. The list does not update by itself in the background while the popup is closed.

8. **Switch account**  
   While connected, tap **Switch account**. This clears the extension’s saved Google session for this tool, then opens Chrome’s normal Google sign-in flow so you can approve access again—often with a **different Google account** if your browser has several.

9. **Light / dark theme**  
   Use the **sun / moon** button in the header to switch appearance. Your choice is remembered on this browser.

10. **Sign out**  
    Tap **Sign out** to remove Gmail access for this extension and clear its cached tokens, without signing in to another account right away. Use **Connect Gmail** again when you want back in.

---

## Technologies used in this project

The extension is built as a **Chrome Extension** using **Manifest V3** (modern extension format with a small background **service worker**).

**Interface**

- **React** — UI library used to build the popup screens (connection card, list of codes, buttons, theme toggle).
- **JavaScript (ES modules) + JSX** — Source code style for components and logic.
- **CSS** — Layout and styling; **light/dark** modes use **CSS custom properties** (variables) switched from the app.

**Build**

- **Vite** — Bundles the React app into static files (`HTML`, `JS`, `CSS`) that Chrome loads inside the popup.

**Chrome & Google**

- **`chrome.identity`** — Lets the extension request a Google **OAuth** access token after you approve sign-in (no separate login server in this project).
- **Gmail API** — HTTPS requests to Google’s servers to **search** recent messages and **fetch** message content; only **read-only** access is requested.

**Storage**

- **`localStorage`** (in the popup) — Saves your **theme** choice (light or dark) so it stays next time you open the popup.

**Developer tooling** (for people working on the code)

- **ESLint** — Linting for JavaScript/React code quality.

---

## Tips

- If you see **Error 400: redirect_uri_mismatch** after an update, reload the extension from a fresh build; sign-in should use Chrome’s built-in OAuth tied to your manifest (no manual redirect URL).
- If a code **does not appear**, it may not match the search words yet, or the message may use an unusual format. You can still open **Gmail** as usual.
- You need an **internet connection** for Connect, Refresh, and loading codes.
