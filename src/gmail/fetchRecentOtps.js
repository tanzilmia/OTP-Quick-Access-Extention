import { DISPLAY_MAX_OTPS } from './constants'
import { getMessageFull, searchOtpMessages } from './gmailClient'
import { messageToOtpEntry } from './parseMessage'

export async function fetchRecentOtps(token) {
  const searchJson = await searchOtpMessages(token)
  console.log('[OTP Quick Access] Gmail messages response:', searchJson)

  const stubs = searchJson.messages ?? []
  if (stubs.length === 0) {
    console.log('[OTP Quick Access] Extracted OTP list:', [])
    return []
  }

  const detailPromises = stubs.map(({ id }) => getMessageFull(token, id))
  const messages = await Promise.all(detailPromises)

  console.log(
    '[OTP Quick Access] All fetched emails (full message objects):',
    messages,
  )

  const entries = messages
    .map(messageToOtpEntry)
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    )
    .slice(0, DISPLAY_MAX_OTPS)

  console.log('[OTP Quick Access] Extracted OTP list:', entries)
  return entries
}
