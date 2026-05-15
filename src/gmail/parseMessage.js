import { OTP_REGEX } from './constants'
import { collectPlainTextFromPayload } from './decodeBody'

export function headerValues(headers) {
  const map = {}
  for (const h of headers || []) {
    if (h?.name) map[h.name.toLowerCase()] = h.value ?? ''
  }
  return map
}

export function domainLabelFromEmail(email) {
  const domain = email.split('@')[1]
  if (!domain) return email
  const segment = domain.split('.').filter(Boolean)[0]
  if (!segment) return domain
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
}

export function inferPlatform(fromHeader, subject) {
  const from = (fromHeader || '').trim()
  const sub = (subject || '').trim()

  const angle = from.match(/^([^<]+)<([^>]+)>/)
  if (angle) {
    const display = angle[1].trim().replace(/^"+|"+$/g, '').trim()
    const emailAddr = angle[2].trim()
    if (display) return display.length > 56 ? `${display.slice(0, 53)}…` : display
    return domainLabelFromEmail(emailAddr)
  }

  const bareEmail = from.match(/<?([\w.+-]+@[\w.-]+\.[a-z]{2,})>?/i)
  if (bareEmail) return domainLabelFromEmail(bareEmail[1])

  if (sub) return sub.length > 56 ? `${sub.slice(0, 53)}…` : sub
  if (from) return from.length > 56 ? `${from.slice(0, 53)}…` : from
  return 'Unknown'
}

export function extractFirstOtp(snippet, plainBody) {
  const haystack = [snippet, plainBody].filter(Boolean).join('\n')
  if (!haystack) return null
  const match = haystack.match(OTP_REGEX)
  return match?.[0] ?? null
}

export function messageToOtpEntry(message) {
  if (!message?.id) return null

  const headers = headerValues(message.payload?.headers)
  const from = headers.from ?? ''
  const subject = headers.subject ?? ''
  const platform = inferPlatform(from, subject)

  const plain = collectPlainTextFromPayload(message.payload)
  const code = extractFirstOtp(message.snippet, plain)
  if (!code) return null

  const ms = Number(message.internalDate)
  const receivedAt = Number.isFinite(ms)
    ? new Date(ms).toISOString()
    : new Date().toISOString()

  return {
    id: message.id,
    platform,
    code,
    receivedAt,
  }
}
