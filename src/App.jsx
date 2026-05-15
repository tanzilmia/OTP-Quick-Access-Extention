import { useCallback, useState } from 'react'
import { MOCK_OTPS } from './data/mockOtps'
import { ActionButtons } from './components/ActionButtons'
import { ConnectionStatus } from './components/ConnectionStatus'
import { ErrorBanner } from './components/ErrorBanner'
import { Header } from './components/Header'
import { OtpList } from './components/OtpList'
import './App.css'

const LATEST_COUNT = 5

function sliceLatestMockOtps() {
  return MOCK_OTPS.slice(0, LATEST_COUNT)
}

export default function App() {
  const [gmailConnected, setGmailConnected] = useState(false)
  const [otps, setOtps] = useState(sliceLatestMockOtps)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleConnectGmail = useCallback(() => {
    setError(null)
    setGmailConnected((prev) => !prev)
  }, [])

  const handleRefreshOtps = useCallback(() => {
    setError(null)
    setLoading(true)
    window.setTimeout(() => {
      setOtps(sliceLatestMockOtps())
      setLoading(false)
    }, 850)
  }, [])

  const handleDismissError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <div className="app">
      <Header />
      <ConnectionStatus connected={gmailConnected} />
      <div className="app-main">
        <ActionButtons
          onConnectGmail={handleConnectGmail}
          onRefreshOtps={handleRefreshOtps}
          refreshDisabled={loading}
        />
        <ErrorBanner message={error} onDismiss={handleDismissError} />

        <div>
          <h2 className="app-section-title">Recent codes</h2>
          <OtpList otps={otps} loading={loading} />
        </div>
      </div>
    </div>
  )
}
