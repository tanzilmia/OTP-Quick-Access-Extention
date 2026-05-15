import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import { OtpCard } from './OtpCard'
import './OtpList.css'

export function OtpList({ otps, loading }) {
  const sectionHead = (
    <div className="otp-section-head">
      <span className="otp-section-label">Recent codes</span>
      <span className="otp-section-count">
        {loading ? '…' : `${otps.length} found`}
      </span>
    </div>
  )

  if (loading) {
    return (
      <section className="otp-section">
        {sectionHead}
        <LoadingState />
      </section>
    )
  }

  if (otps.length === 0) {
    return (
      <section className="otp-section">
        {sectionHead}
        <EmptyState />
      </section>
    )
  }

  return (
    <section className="otp-section">
      {sectionHead}
      <ul className="otp-list">
        {otps.map((otp, index) => (
          <li key={otp.id}>
            <OtpCard
              platform={otp.platform}
              code={otp.code}
              receivedAt={otp.receivedAt}
              isLatest={index === 0}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
