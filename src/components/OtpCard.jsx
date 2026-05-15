import { useCallback, useState, useSyncExternalStore } from 'react'
import { formatCardTimestamp } from '../utils/formatTime'
import { IconClock, IconShield } from './icons'
import './OtpCard.css'

const DEFAULT_VALID_MS = 5 * 60 * 1000

function computeValidityPercent(receivedAtIso, ttlMs) {
  const t = new Date(receivedAtIso).getTime()
  if (!Number.isFinite(t)) return 0
  const elapsed = Date.now() - t
  return Math.max(0, Math.min(100, 100 - (elapsed / ttlMs) * 100))
}

function useValidityBarPercent(receivedAtIso, ttlMs = DEFAULT_VALID_MS) {
  const subscribe = useCallback((onStoreChange) => {
    const id = window.setInterval(onStoreChange, 6000)
    return () => window.clearInterval(id)
  }, [])

  const getSnapshot = useCallback(
    () => computeValidityPercent(receivedAtIso, ttlMs),
    [receivedAtIso, ttlMs],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () =>
    computeValidityPercent(receivedAtIso, ttlMs),
  )
}

export function OtpCard({ platform, code, receivedAt, isLatest }) {
  const [copied, setCopied] = useState(false)
  const barPct = useValidityBarPercent(receivedAt)

  const spaced = String(code)
    .replace(/\s+/g, '')
    .split('')
    .join(' ')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(code).replace(/\s+/g, ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article
      className={`otp-card ${isLatest ? 'otp-card-latest' : 'otp-card-past'}`}
    >
      <div className="otp-card-head">
        <div className="otp-card-brand">
          <span className="otp-card-shield" aria-hidden>
            <IconShield className="otp-card-shield-icon" />
          </span>
          <h2 className="otp-card-platform">{platform}</h2>
          {isLatest ? (
            <span className="otp-card-badge">NEW</span>
          ) : null}
        </div>
        <button
          type="button"
          className={`otp-card-copy ${isLatest ? '' : 'otp-card-copy-muted'}`}
          onClick={handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p className="otp-card-code">{spaced}</p>

      <p className="otp-card-meta">
        <IconClock className="otp-card-clock" aria-hidden />
        {formatCardTimestamp(receivedAt)}
      </p>

      {isLatest ? (
        <div className="otp-card-bar" aria-hidden>
          <div
            className="otp-card-bar-fill"
            style={{ width: `${barPct}%` }}
          />
        </div>
      ) : null}
    </article>
  )
}
