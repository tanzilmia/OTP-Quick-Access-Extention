import { OTP_REGEX } from './constants'
import { collectPlainTextFromPayload } from './decodeBody'
import { getOtpExtractionHints } from './otpProfiles'

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

/** 4-digit values that are almost always years in mail UI, not OTPs */
function isLikelyCalendarYear(digits) {
  if (digits.length !== 4) return false
  const n = Number(digits)
  return n >= 1900 && n <= 2099
}

/**
 * Digit groups with common separators (123-456, 12 34 56, 123.456.789).
 * Collapsed to a plain digit run for scoring.
 */
const FORMATTED_DIGIT_RUN_RE =
  /\b\d{2,4}(?:[\s\u00A0+().-]+\d{2,4}){1,4}\b/g

function normalizedDigits(s) {
  return s.replace(/\D+/g, '')
}

/**
 * Plain + formatted runs (deduped) with start index for context scoring.
 * @param {string} haystack
 * @returns {{ text: string, index: number }[]}
 */
function collectOtpCandidates(haystack) {
  const seen = new Set()
  const out = []

  const push = (text, index) => {
    const key = `${index}:${text}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ text, index })
  }

  OTP_REGEX.lastIndex = 0
  for (const m of haystack.matchAll(OTP_REGEX)) {
    push(m[0], m.index ?? 0)
  }

  FORMATTED_DIGIT_RUN_RE.lastIndex = 0
  for (const m of haystack.matchAll(FORMATTED_DIGIT_RUN_RE)) {
    const raw = m[0]
    const idx = m.index ?? 0
    const digits = normalizedDigits(raw)
    if (digits.length < 4 || digits.length > 8) continue
    push(digits, idx)
  }

  return out
}

/** OTP / MFA language; also used to drop messages that are not OTP mail */
const OTP_CONTEXT_RE =
  /otp|one[\s-]?time|verification|verify|confirm(?:ation)?|password|pin(?!\w)|security code|login code|authentication|passcode|sign[-\s]in(?:\s+code)?|2fa|\bmfa\b|multi[\s-]?factor|two[\s-]?factor|authenticat|securely\s+log|log\s+in|enter\s+(?:the\s+)?(?:code|pin|digits|number|one[\s-]time)/i

const FOOTERISH_RE =
  /\b(tel|phone|whatsapp|contact\s+us|address|unsubscribe|follow\s+us|copyright)\b/i

/**
 * @param {{ text: string, index: number }} o
 * @param {string} haystack
 * @param {import('./otpProfiles.js').OtpExtractionHints | null | undefined} hints
 */
function scoreCandidate(o, haystack, hints) {
  const { text, index } = o
  const len = text.length
  let score = 0

  if (len >= 4 && len <= 8) score += 100
  if (len === 6) score += 10
  else if (len === 8) score += 6
  else if (len === 5) score += 4

  if (hints?.preferredLengths?.includes(len)) score += 26

  const winStart = Math.max(0, index - 120)
  const winEnd = Math.min(haystack.length, index + text.length + 80)
  const ctx = haystack.slice(winStart, winEnd)

  if (OTP_CONTEXT_RE.test(ctx)) score += 85
  if (FOOTERISH_RE.test(ctx)) score -= 65

  if (hints?.extraContextRes) {
    for (const re of hints.extraContextRes) {
      re.lastIndex = 0
      if (re.test(ctx)) {
        score += 36
        break
      }
    }
  }

  const after = haystack.slice(index + text.length, index + text.length + 18)
  const before = haystack.slice(Math.max(0, index - 18), index)
  if (/^[\s+().-]+\d{2,}/.test(after) || /\d{2,}[\s+().-]+$/.test(before)) {
    score -= 35
  }

  score += index / 100000
  return score
}

/**
 * True when nearby text (or platform-specific phrase) suggests this is OTP mail,
 * not a coincidental number. Without this, search hits can still be newsletters, etc.
 * @param {{ text: string, index: number }} o
 * @param {string} haystack
 * @param {import('./otpProfiles.js').OtpExtractionHints | null | undefined} hints
 */
function looksLikeOtpContext(o, haystack, hints) {
  const winStart = Math.max(0, o.index - 160)
  const winEnd = Math.min(haystack.length, o.index + o.text.length + 120)
  const ctx = haystack.slice(winStart, winEnd)

  OTP_CONTEXT_RE.lastIndex = 0
  if (OTP_CONTEXT_RE.test(ctx)) return true

  if (hints?.extraContextRes) {
    for (const re of hints.extraContextRes) {
      re.lastIndex = 0
      if (re.test(ctx)) return true
    }
  }

  return false
}

/**
 * Pick best OTP-like digit run from one haystack string.
 * @param {string} haystack
 * @param {import('./otpProfiles.js').OtpExtractionHints | null | undefined} hints
 */
function pickBestFromHaystack(haystack, hints) {
  if (!haystack?.trim()) return null

  let occurrences = collectOtpCandidates(haystack)
  if (occurrences.length === 0) return null

  if (hints?.minLen != null) {
    occurrences = occurrences.filter((o) => o.text.length >= hints.minLen)
  }
  if (hints?.maxLen != null) {
    occurrences = occurrences.filter((o) => o.text.length <= hints.maxLen)
  }
  if (occurrences.length === 0) return null

  const nonYears = occurrences.filter((o) => !isLikelyCalendarYear(o.text))
  const pool = nonYears.length > 0 ? nonYears : occurrences

  pool.sort(
    (a, b) => scoreCandidate(b, haystack, hints) - scoreCandidate(a, haystack, hints),
  )
  const best = pool[0]
  if (!looksLikeOtpContext(best, haystack, hints)) {
    return null
  }
  return best.text
}

/**
 * Prefer decoded body + snippet; if regex finds nothing (HTML mangling etc.), retry snippet alone.
 * @param {string} plainBody
 * @param {string} [snippet]
 * @param {import('./otpProfiles.js').OtpExtractionHints | null | undefined} [hints]
 * @param {string} [subject] — included so typical OTP wording in the subject counts as context
 */
export function extractBestOtp(plainBody, snippet, hints, subject) {
  const subjectBlock = subject?.trim()
    ? `Subject: ${subject.trim()}\n\n`
    : ''
  const combined =
    subjectBlock + [plainBody, snippet].filter(Boolean).join('\n')
  const fromCombined = pickBestFromHaystack(combined, hints)
  if (fromCombined) return fromCombined

  const snippetOnly =
    subjectBlock + String(snippet ?? '').trim()
  const fromSnippet = pickBestFromHaystack(snippetOnly, hints)
  return fromSnippet
}

export function messageToOtpEntry(message) {
  if (!message?.id) return null

  const headers = headerValues(message.payload?.headers)
  const from = headers.from ?? ''
  const subject = headers.subject ?? ''
  const platform = inferPlatform(from, subject)

  const hints = getOtpExtractionHints(from, subject)

  const plain = collectPlainTextFromPayload(message.payload)
  const code = extractBestOtp(plain, message.snippet, hints, subject)
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
