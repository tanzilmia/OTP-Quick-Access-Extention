/**
 * Uses oauth2 client_id and scopes from manifest.json.
 * Sign-in: chrome.identity.getAuthToken (Chrome-managed redirect).
 */

export const OTP_SESSION_CLEARED_KEY = 'otp_quick_access_session_cleared'

function isExtensionPage() {
  try {
    return (
      typeof chrome !== 'undefined' &&
      Boolean(chrome.runtime?.id) &&
      typeof chrome.identity?.getAuthToken === 'function'
    )
  } catch {
    return false
  }
}

function getIdentityUnavailableReason() {
  if (typeof chrome === 'undefined') {
    return 'The chrome global is missing. You must open the real extension popup, not a normal website tab.'
  }
  if (!chrome.runtime?.id) {
    const hint =
      typeof location !== 'undefined' &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? ' You are on localhost (e.g. npm run dev). OAuth only works in the extension popup after loading dist/ from chrome://extensions.'
        : typeof location !== 'undefined' && location.protocol === 'file:'
          ? ' Do not open index.html from disk; load the dist folder as an unpacked extension and open the toolbar popup.'
          : ' Load the dist folder at chrome://extensions → Developer mode → Load unpacked, then click the extension icon in the toolbar (not this tab).'
    return `Not inside an extension page (chrome.runtime.id is empty).${hint}`
  }
  if (typeof chrome.identity?.getAuthToken !== 'function') {
    return 'chrome.identity is not available. Add "identity" to manifest permissions and reload the extension.'
  }
  return 'Unknown reason.'
}

function assertChromeIdentity() {
  if (!isExtensionPage()) {
    throw new Error(
      `Chrome identity API is unavailable. ${getIdentityUnavailableReason()}`,
    )
  }
}

function normalizeGetAuthTokenResult(result) {
  if (result == null) {
    return null
  }
  if (typeof result === 'string') {
    return result || null
  }
  if (typeof result === 'object' && result !== null && 'token' in result) {
    return result.token ?? null
  }
  return null
}

/** Marks user session active so we may restore a cached token on next popup open. */
export async function markSessionActive() {
  await chrome.storage.local.remove(OTP_SESSION_CLEARED_KEY)
}

async function markSessionClearedIntent() {
  await chrome.storage.local.set({ [OTP_SESSION_CLEARED_KEY]: true })
}

/** Cached token without UI (fails quietly). */
export function getSilentAuthToken() {
  assertChromeIdentity()
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (result) => {
      if (chrome.runtime.lastError) {
        resolve(null)
        return
      }
      resolve(normalizeGetAuthTokenResult(result))
    })
  })
}

/** Interactive OAuth using manifest oauth2. */
export function getInteractiveAuthToken() {
  assertChromeIdentity()
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(normalizeGetAuthTokenResult(result))
    })
  })
}

function removeCachedAuthTokenPromise(token) {
  assertChromeIdentity()
  return new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

function clearAllCachedAuthTokensPromise() {
  assertChromeIdentity()
  return new Promise((resolve, reject) => {
    if (typeof chrome.identity.clearAllCachedAuthTokens !== 'function') {
      resolve()
      return
    }
    chrome.identity.clearAllCachedAuthTokens(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

/** Invalidate token at Google (best-effort; avoids sticky cached grants). */
async function revokeGoogleAccessToken(accessToken) {
  if (!accessToken) return
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: accessToken }).toString(),
      signal: controller.signal,
    })
  } catch {
    /* offline / already revoked */
  } finally {
    clearTimeout(t)
  }
}

/**
 * Fully clears extension Google session: revoke + remove cached token + clear identity cache.
 * Pass the current access token when you have it (sign-out / switch account).
 */
export async function clearGoogleSession(accessToken) {
  await revokeGoogleAccessToken(accessToken ?? '')
  if (accessToken) {
    try {
      await removeCachedAuthTokenPromise(accessToken)
    } catch {
      /* stale token */
    }
  }
  await clearAllCachedAuthTokensPromise()
  await markSessionClearedIntent()
}
