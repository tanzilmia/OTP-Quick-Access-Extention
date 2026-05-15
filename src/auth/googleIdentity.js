/** Uses oauth2 client_id and scopes from manifest.json (Chrome merges them for getAuthToken). */

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

export function getInteractiveAuthToken() {
  assertChromeIdentity()
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(token ?? null)
    })
  })
}

export function removeCachedAuthToken(token) {
  assertChromeIdentity()
  return new Promise((resolve, reject) => {
    if (!token) {
      resolve()
      return
    }
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}
