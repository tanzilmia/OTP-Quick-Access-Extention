/** Broad query so matching mail actually appears in results */
export const OTP_SEARCH_QUERY =
  'newer_than:7d (otp OR verification OR "verification code" OR "security code" OR "login code" OR "one-time password" OR passcode OR 2fa OR "two-factor" OR "authentication code")'

export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1'

/** 4–8 digits (banks/apps often use 7–8); scoring reduces junk */
export const OTP_REGEX = /\b\d{4,8}\b/g

export const SEARCH_MAX_RESULTS = 15

export const DISPLAY_MAX_OTPS = 5
