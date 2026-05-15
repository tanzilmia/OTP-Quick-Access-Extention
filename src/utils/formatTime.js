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
