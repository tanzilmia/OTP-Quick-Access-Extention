import './ErrorBanner.css'

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="root" role="alert">
      <p className="message">{message}</p>
      <button type="button" className="dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}
