import { IconKey, IconLogout, IconMoon, IconSun } from './icons'
import './Header.css'

export function Header({ theme, onToggleTheme, connected, onDisconnect }) {
  const isDark = theme === 'dark'
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
      <div className="hdr-actions">
        <button
          type="button"
          className="hdr-settings"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
        >
          {isDark ? (
            <IconSun className="hdr-settings-icon" />
          ) : (
            <IconMoon className="hdr-settings-icon" />
          )}
        </button>
        {connected && (
          <button
            type="button"
            className="hdr-settings hdr-signout"
            onClick={onDisconnect}
            title="Sign out and remove Gmail access for this extension"
            aria-label="Sign out"
          >
            <IconLogout className="hdr-settings-icon" />
          </button>
        )}
      </div>
    </header>
  )
}
