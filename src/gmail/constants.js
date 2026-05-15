/** Gmail query from product requirements */
export const OTP_SEARCH_QUERY =
  'newer_than:1d (otp OR verification OR "login code" OR "security code")'

export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1'

export const OTP_REGEX = /\b\d{4,8}\b/g

export const SEARCH_MAX_RESULTS = 10

export const DISPLAY_MAX_OTPS = 5
