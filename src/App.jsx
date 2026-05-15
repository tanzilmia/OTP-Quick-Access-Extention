import { useCallback, useState } from 'react'
import { getInteractiveAuthToken, removeCachedAuthToken } from './auth/googleIdentity'
import { fetchRecentOtps } from './gmail/fetchRecentOtps'
import { ErrorBanner } from './components/ErrorBanner'
import { GmailConnectionCard } from './components/GmailConnectionCard'
import { Header } from './components/Header'
import { OtpList } from './components/OtpList'
import './App.css'

export default function App() {
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
      console.error('[OTP Quick Access] Failed to load OTPs from Gmail:', err)
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
      console.log('[OTP Quick Access] Gmail auth token:', token)
      setAuthToken(token)
      await loadOtpsFromGmail(token)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setAuthToken(null)
    } finally {
      setConnecting(false)
    }
  }, [loadOtpsFromGmail])

  const handleDisconnectGmail = useCallback(async () => {
    setError(null)
    try {
      await removeCachedAuthToken(authToken)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      return
    }
    setAuthToken(null)
    setOtps([])
  }, [authToken])

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

  return (
    <div className="app">
      <Header />
      <GmailConnectionCard
        connected={gmailConnected}
        connecting={connecting}
        loading={loading}
        onConnect={handleConnectGmail}
        onDisconnect={handleDisconnectGmail}
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
