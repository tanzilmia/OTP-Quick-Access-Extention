import { useCallback, useState } from 'react'
import { formatReceivedTime } from '../utils/formatTime'
import './OtpCard.css'

export function OtpCard({ platform, code, receivedAt }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }, [code])

  return (
    <article className="card">
      <div className="rowTop">
        <h2 className="platform">{platform}</h2>
      </div>
      <div className="codeRow">
        <span className="code">{code}</span>
        <button
          type="button"
          className={`btnCopy ${copied ? 'btnCopyCopied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="meta">Received {formatReceivedTime(receivedAt)}</p>
    </article>
  )
}
