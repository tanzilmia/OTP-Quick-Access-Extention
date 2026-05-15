import { GoogleMark, IconRefresh } from './icons'
import './GmailConnectionCard.css'

export function GmailConnectionCard({
  connected,
  connecting,
  loading,
  onConnect,
  onDisconnect,
  onRefresh,
}) {
  if (!connected) {
    return (
      <div className="gcard">
        <div className="gcard-inner gcard-inner-muted">
          <div className="gcard-logo-slot">
            <GoogleMark className="gcard-google-svg" />
          </div>
          <div className="gcard-copy">
            <p className="gcard-status-line gcard-status-line-off">
              <span className="gcard-dot gcard-dot-off" aria-hidden />
              Not connected
            </p>
          </div>
          <div className="gcard-actions">
            <button
              type="button"
              className="gcard-connect"
              onClick={onConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting…' : 'Connect Gmail'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gcard gcard-live">
      <div className="gcard-inner">
        <GoogleMark className="gcard-google-svg" />
        <div className="gcard-copy">
          <p className="gcard-status-line gcard-status-line-live">
            <span className="gcard-dot" aria-hidden />
            Connected
          </p>
        </div>
        <div className="gcard-actions">
          <button type="button" className="gbtn-disconnect" onClick={onDisconnect}>
            Disconnect
          </button>
          <button
            type="button"
            className="gbtn-refresh"
            onClick={onRefresh}
            disabled={loading || connecting}
          >
            <IconRefresh className="gbtn-refresh-icon" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
