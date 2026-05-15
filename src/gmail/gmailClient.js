import {
  GMAIL_API_BASE,
  OTP_SEARCH_QUERY,
  SEARCH_MAX_RESULTS,
} from './constants'

export async function gmailFetchJson(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }

  if (!res.ok) {
    const msg =
      body?.error?.message ||
      (typeof body === 'string' ? body : null) ||
      `${res.status} ${res.statusText}`
    throw new Error(msg)
  }

  return body
}

export function buildMessagesSearchUrl() {
  const params = new URLSearchParams({
    q: OTP_SEARCH_QUERY,
    maxResults: String(SEARCH_MAX_RESULTS),
  })
  return `${GMAIL_API_BASE}/users/me/messages?${params.toString()}`
}

export function buildMessageGetUrl(messageId) {
  const params = new URLSearchParams({ format: 'full' })
  return `${GMAIL_API_BASE}/users/me/messages/${encodeURIComponent(messageId)}?${params.toString()}`
}

export function searchOtpMessages(token) {
  return gmailFetchJson(buildMessagesSearchUrl(), token)
}

export function getMessageFull(token, messageId) {
  return gmailFetchJson(buildMessageGetUrl(messageId), token)
}
