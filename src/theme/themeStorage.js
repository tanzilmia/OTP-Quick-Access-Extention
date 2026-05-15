const STORAGE_KEY = 'otp-quick-access-theme'

/** @returns {'light' | 'dark'} */
export function getStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* extension sandbox */
  }
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

export function applyStoredTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = getStoredTheme()
}

/** Persist + apply immediately (no React rerender dependency). */
export function commitTheme(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = mode
  }
}
