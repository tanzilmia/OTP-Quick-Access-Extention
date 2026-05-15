import './ConnectionStatus.css'

export function ConnectionStatus({ connected }) {
  return (
    <div className="root" role="status">
      <span
        className={`dot ${connected ? 'dotConnected' : 'dotDisconnected'}`}
        aria-hidden
      />
      <p className="label">
        <strong>{connected ? 'Gmail connected' : 'Gmail not connected'}</strong>
      </p>
    </div>
  )
}
