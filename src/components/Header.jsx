import { IconGear, IconKey } from './icons'
import './Header.css'

export function Header() {
  return (
    <header className="hdr">
      <div className="hdr-brand">
        <span className="hdr-key-badge" aria-hidden>
          <IconKey className="hdr-key-icon" />
        </span>
        <div className="hdr-titles">
          <h1 className="hdr-title">OTP Quick Access</h1>
          <p className="hdr-sub">Gmail Authenticator</p>
        </div>
      </div>
      <button
        type="button"
        className="hdr-settings"
        aria-label="Settings"
        title="Coming soon"
        onClick={() => {}}
      >
        <IconGear className="hdr-settings-icon" />
      </button>
    </header>
  )
}
