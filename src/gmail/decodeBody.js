/** Decode Gmail API base64url payload segments (UTF-8). */
export function decodeBase64Url(data) {
  if (!data) return ''
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (base64.length % 4)) % 4
  const padded = base64 + '='.repeat(padLen)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export function collectPlainTextFromPayload(payload) {
  if (!payload) return ''
  let out = ''
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    out += decodeBase64Url(payload.body.data)
  }
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = decodeBase64Url(payload.body.data)
    out += html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  if (payload.parts?.length) {
    for (const part of payload.parts) {
      out += collectPlainTextFromPayload(part)
    }
  }
  return out
}
