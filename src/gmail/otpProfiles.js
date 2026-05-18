/**
 * Platform-aware hints for OTP extraction. Matched against sender email domain
 * and subject so we can bias scoring without trusting the From name alone.
 */

/**
 * @typedef {Object} OtpExtractionHints
 * @property {number[]} [preferredLengths] — bonus score when length matches
 * @property {RegExp[]} [extraContextRes] — extra weight if nearby window matches
 * @property {number} [minLen] — optional inclusive min digit length (filter)
 * @property {number} [maxLen] — optional inclusive max digit length (filter)
 */

export function senderEmailFromFromHeader(fromHeader) {
  const from = (fromHeader || '').trim()
  const angle = from.match(/<([^>]+)>/)
  if (angle) return angle[1].trim().toLowerCase()
  const bare = from.match(/([\w.+-]+@[\w.-]+\.[a-z]{2,})/i)
  return bare ? bare[1].toLowerCase() : ''
}

function domainFromEmail(email) {
  const i = email.lastIndexOf('@')
  return i >= 0 ? email.slice(i + 1) : ''
}

/**
 * Heuristic profiles: first match wins (order = specificity).
 * @type {Array<{ test: (args: { email: string, domain: string, subject: string }) => boolean, hints: OtpExtractionHints }>}
 */
const PROFILES = [
  {
    test: ({ email, domain, subject }) =>
      /(?:^|\.)google\.com$/i.test(domain) ||
      /(?:^|\.)googlemail\.com$/i.test(domain) ||
      /@gmail\.com$/i.test(email) ||
      /\bgoogle\s*(?:account|verification|sign[- ]?in|authenticator)\b/i.test(
        subject,
      ),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/g-\d{6}/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.apple\.com$/i.test(domain) ||
      /\.icloud\.com$/i.test(domain) ||
      /\.appleid\.com$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\bapple\s*id\b/i, /\bverification\s+code\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /(?:^|\.)microsoft\.com$/i.test(domain) ||
      /(?:^|\.)outlook\.com$/i.test(domain) ||
      /(?:^|\.)live\.com$/i.test(domain) ||
      /(?:^|\.)hotmail\.com$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [/\bsecurity\s+info\b/i, /\bmicrosoft\s+account\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.amazon\./i.test(domain) || /\.amazonpayments\./i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\bone[- ]time\s+password\b/i, /\botp\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /(?:^|\.)facebookmail\.com$/i.test(domain) ||
      /(?:^|\.)whatsapp\.com$/i.test(domain) ||
      /(?:^|\.)instagram\.com$/i.test(domain) ||
      /(?:^|\.)messenger\.com$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [/\bmeta\b/i, /\bwhatsapp\b/i, /\bconfirmation\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:discord|discordapp)\.com$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [/\bdiscord\b/i, /\bsecurity\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:github|gitlab)\.com$/i.test(domain) ||
      /\.bitbucket\.org$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [/\bgithub\b/i, /\bgitlab\b/i, /\bbitbucket\b/i],
    },
  },
  {
    test: ({ domain }) => /\.slack\.com$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\bslack\b/i],
    },
  },
  {
    test: ({ domain }) => /\.linkedin\.com$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\blinkedin\b/i, /\bsecurity\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:twitter|redditmail)\.com$/i.test(domain) ||
      /(?:^|\.)x\.com$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [/\btwitter\b/i, /\breddit\b/i, /\bconfirmation\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:tiktok|snapchat)\.com$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/tiktok/i, /snapchat/i],
    },
  },
  {
    test: ({ domain }) => /\.zoom\.us$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\bzoom\b/i],
    },
  },
  {
    test: ({ domain }) => /\.dropbox\.com$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\bdropbox\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.notion\.(?:so|id)$/i.test(domain) || /\.mails\.notion\.so$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\bnotion\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:uber|ubereats|lyft|doordash)\.(?:com|io)$/i.test(domain),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\buber\b/i, /\blyft\b/i, /\bdoordash\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:netflix|spotify|hulu)\.com$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [/\bnetflix\b/i, /\bspotify\b/i, /\bhulu\b/i],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:coinbase|kraken|binance)\.(?:com|us)$/i.test(domain) ||
      /\.(?:wise|revolut|chime|venmo)\.(?:com|co\.uk|eu)$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [
        /\bcoinbase\b/i,
        /\bkraken\b/i,
        /\bbinance\b/i,
        /\bwise\b/i,
        /\brevolut\b/i,
        /\bchime\b/i,
        /\bvenmo\b/i,
      ],
    },
  },
  {
    test: ({ domain }) =>
      /\.(?:okta|auth0|twilio|duosecurity)\.com$/i.test(domain),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [
        /\bokta\b/i,
        /\bauth0\b/i,
        /\btwilio\b/i,
        /\bduo\b/i,
      ],
    },
  },
  {
    test: ({ domain, subject }) =>
      /(?:^|\.)stripe\.com$/i.test(domain) ||
      /(?:^|\.)paypal\.com$/i.test(domain) ||
      /\b(payment|transaction|stripe|paypal)\b/i.test(subject),
    hints: {
      preferredLengths: [6],
      extraContextRes: [/\b(?:payment|transaction|charge)\b/i],
    },
  },
  {
    test: ({ subject }) =>
      /\b(bank|zelle|wire\s+transfer|ach|swift|routing|account\s+alert)\b/i.test(
        subject,
      ),
    hints: {
      preferredLengths: [6, 8],
      extraContextRes: [
        /\b(?:authorize|authorisation|secure|verify)\b/i,
        /\bcode\s*:/i,
      ],
    },
  },
]

/**
 * @param {string} fromHeader
 * @param {string} subject
 * @returns {OtpExtractionHints | null}
 */
export function getOtpExtractionHints(fromHeader, subject) {
  const email = senderEmailFromFromHeader(fromHeader)
  const domain = domainFromEmail(email)
  const sub = (subject || '').trim()
  const args = { email, domain, subject: sub }

  for (const p of PROFILES) {
    if (p.test(args)) {
      return p.hints
    }
  }
  return null
}
