import './LoadingState.css'

export function LoadingState() {
  return (
    <div className="root" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      <span>Refreshing OTPs…</span>
    </div>
  )
}
