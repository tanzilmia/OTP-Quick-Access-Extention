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
   The first time, choose **Connect Gmail** (or equivalent). Chrome opens Google’s permission screen. Approve access so the extension can **read** your mail at the level shown (read-only Gmail scope).

4. **Read your status**  
   You should see that you are **Connected**. If not, connect again or check that you completed sign-in.

5. **See recent codes**  
   Under **Recent codes**, the extension lists the latest extracted codes it found, newest first. Each row shows who it thinks the message is from, the **digits**, and roughly **when** it arrived.

6. **Copy a code**  
   Tap **Copy** on the row you need. Paste it into the app or site that asked for the code.

7. **Refresh**  
   When a **new** email arrives, tap **Refresh** so the list updates from Gmail. The list does not update by itself in the background while the popup is closed.

8. **Light / dark theme**  
   Use the **sun / moon** button in the header to switch appearance. Your choice is remembered on this browser.

9. **Disconnect**  
   Use **Disconnect** when you want to sign out from Gmail inside the extension and clear that session from this tool. You can connect again later.

---

## Tips

- If a code **does not appear**, it may not match the search words yet, or the message may use an unusual format. You can still open **Gmail** as usual.
- You need an **internet connection** for Connect, Refresh, and loading codes.
