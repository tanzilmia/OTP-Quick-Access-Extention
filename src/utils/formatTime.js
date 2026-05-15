export function formatReceivedTime(iso) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return iso
  }
}

/** e.g. "May 15, 2026 • 2:16 PM" */
export function formatCardTimestamp(iso) {
  try {
    const d = new Date(iso)
    const datePart = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
    return `${datePart} • ${timePart}`
  } catch {
    return iso
  }
}
