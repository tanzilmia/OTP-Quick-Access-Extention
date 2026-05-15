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

/** 4-digit values that are almost always years in email headers, not OTPs. */
function isLikelyCalendarYear(digits) {
  if (digits.length !== 4) return false
  const n = Number(digits)
  return n >= 1900 && n <= 2099
}

const OTP_CONTEXT_RE =
  /otp|one[\s-]?time|verification|password|pin(?!\w)|security code|login code|securely\s+log|log\s+in/i

const FOOTERISH_RE =
  /\b(tel|phone|whatsapp|contact\s+us|address|unsubscribe|follow\s+us|copyright)\b/i

/**
 * Picks the best OTP-like digit run. The naive first match fails when dates like
 * "15 May, 2026" appear before the real code (e.g. 932338).
 */
export function extractBestOtp(plainBody, snippet) {
  const haystack = [plainBody, snippet].filter(Boolean).join('\n')
  if (!haystack) return null

  OTP_REGEX.lastIndex = 0
  const occurrences = [...haystack.matchAll(OTP_REGEX)].map((m) => ({
    text: m[0],
    index: m.index ?? 0,
  }))
  if (occurrences.length === 0) return null

  const nonYears = occurrences.filter((o) => !isLikelyCalendarYear(o.text))
  const pool = nonYears.length > 0 ? nonYears : occurrences

  function scoreCandidate(o) {
    const { text, index } = o
    const len = text.length
    let score = 0
    // Same baseline for 4 / 5 / 6 digits — real OTPs vary; disambiguate with context below.
    if (len === 4 || len === 5 || len === 6) score += 100

    const winStart = Math.max(0, index - 120)
    const winEnd = Math.min(haystack.length, index + text.length + 80)
    const ctx = haystack.slice(winStart, winEnd)

    if (OTP_CONTEXT_RE.test(ctx)) score += 85
    if (FOOTERISH_RE.test(ctx)) score -= 65

    const after = haystack.slice(index + text.length, index + text.length + 18)
    const before = haystack.slice(Math.max(0, index - 18), index)
    if (/^[\s+().-]+\d{2,}/.test(after) || /\d{2,}[\s+().-]+$/.test(before)) {
      score -= 35
    }

    score += index / 100000
    return score
  }

  pool.sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
  return pool[0].text
}

export function messageToOtpEntry(message) {
  if (!message?.id) return null

  const headers = headerValues(message.payload?.headers)
  const from = headers.from ?? ''
  const subject = headers.subject ?? ''
  const platform = inferPlatform(from, subject)

  const plain = collectPlainTextFromPayload(message.payload)
  const code = extractBestOtp(plain, message.snippet)
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
