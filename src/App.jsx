import { useCallback, useEffect, useState } from 'react'
import {
  clearGoogleSession,
  getInteractiveAuthToken,
  getSilentAuthToken,
  markSessionActive,
  OTP_SESSION_CLEARED_KEY,
} from './auth/googleIdentity'
import { fetchRecentOtps } from './gmail/fetchRecentOtps'
import { ErrorBanner } from './components/ErrorBanner'
import { GmailConnectionCard } from './components/GmailConnectionCard'
import { Header } from './components/Header'
import { OtpList } from './components/OtpList'
import { commitTheme, getStoredTheme } from './theme/themeStorage'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState(() => getStoredTheme())
  const [authToken, setAuthToken] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [otps, setOtps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const gmailConnected = Boolean(authToken)

  const loadOtpsFromGmail = useCallback(async (token) => {
    setLoading(true)
    setError(null)
    try {
      const entries = await fetchRecentOtps(token)
      setOtps(entries)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setOtps([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConnectGmail = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      const token = await getInteractiveAuthToken()
      if (!token) {
        throw new Error('No OAuth token returned.')
      }
      await markSessionActive()
      setAuthToken(token)
      await loadOtpsFromGmail(token)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setAuthToken(null)
      setOtps([])
    } finally {
      setConnecting(false)
    }
  }, [loadOtpsFromGmail])

  const handleDisconnectGmail = useCallback(async () => {
    setError(null)
    const token = authToken
    setAuthToken(null)
    setOtps([])
    try {
      await clearGoogleSession(token ?? undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    }
  }, [authToken])

  const handleSwitchAccount = useCallback(async () => {
    setError(null)
    const token = authToken
    setConnecting(true)
    setAuthToken(null)
    setOtps([])
    try {
      await clearGoogleSession(token ?? undefined)
      const newToken = await getInteractiveAuthToken()
      if (!newToken) {
        throw new Error('No OAuth token returned.')
      }
      await markSessionActive()
      setAuthToken(newToken)
      await loadOtpsFromGmail(newToken)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setAuthToken(null)
      setOtps([])
    } finally {
      setConnecting(false)
    }
  }, [authToken, loadOtpsFromGmail])

  const handleRefreshOtps = useCallback(async () => {
    if (!authToken) {
      setError('Connect Gmail first.')
      return
    }
    await loadOtpsFromGmail(authToken)
  }, [authToken, loadOtpsFromGmail])

  const handleDismissError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    commitTheme(theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stored = await chrome.storage.local.get(OTP_SESSION_CLEARED_KEY)
        if (stored[OTP_SESSION_CLEARED_KEY] || cancelled) {
          return
        }
        const token = await getSilentAuthToken()
        if (!token || cancelled) {
          return
        }
        setAuthToken(token)
        await loadOtpsFromGmail(token)
      } catch {
        /* ignore restore failures */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadOtpsFromGmail])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <GmailConnectionCard
        connected={gmailConnected}
        connecting={connecting}
        loading={loading}
        onConnect={handleConnectGmail}
        onDisconnect={handleDisconnectGmail}
        onSwitchAccount={handleSwitchAccount}
        onRefresh={handleRefreshOtps}
      />
      <div className="app-main">
        <div className="app-alert-slot">
          <ErrorBanner message={error} onDismiss={handleDismissError} />
        </div>
        <OtpList otps={otps} loading={loading} />
      </div>
    </div>
  )
}
