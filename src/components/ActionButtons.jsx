import './ActionButtons.css'

export function ActionButtons({
  onConnectGmail,
  onRefreshOtps,
  refreshDisabled,
}) {
  return (
    <div className="root">
      <button
        type="button"
        className="btnPrimary"
        onClick={onConnectGmail}
      >
        Connect Gmail
      </button>
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
