import './ActionButtons.css'

export function ActionButtons({
  gmailConnected,
  connecting,
  onConnectGmail,
  onDisconnectGmail,
  onRefreshOtps,
  refreshDisabled,
}) {
  return (
    <div className="root">
      {!gmailConnected ? (
        <button
          type="button"
          className="btnPrimary"
          onClick={onConnectGmail}
          disabled={connecting}
        >
          {connecting ? 'Connecting…' : 'Connect Gmail'}
        </button>
      ) : (
        <button
          type="button"
          className="btnDisconnect"
          onClick={onDisconnectGmail}
        >
          Disconnect Gmail
        </button>
      )}
      <button
        type="button"
        className="btnSecondary"
        onClick={onRefreshOtps}
        disabled={refreshDisabled}
      >
        Refresh OTPs
      </button>
    </div>
  )
}
