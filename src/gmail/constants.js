/** Gmail query from product requirements */
export const OTP_SEARCH_QUERY =
  'newer_than:1d (otp OR verification OR "login code" OR "security code")'

export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1'

/** OTP codes we support: 4, 5, or 6 digits (not 7–8, to reduce false positives). */
export const OTP_REGEX = /\b\d{4,6}\b/g

export const SEARCH_MAX_RESULTS = 10

export const DISPLAY_MAX_OTPS = 5
