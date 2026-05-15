import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import { OtpCard } from './OtpCard'
import './OtpList.css'

export function OtpList({ otps, loading }) {
  if (loading) {
    return <LoadingState />
  }

  if (otps.length === 0) {
    return <EmptyState />
  }

  return (
    <ul className="list">
      {otps.map((otp) => (
        <li key={otp.id}>
          <OtpCard
            platform={otp.platform}
            code={otp.code}
            receivedAt={otp.receivedAt}
          />
        </li>
      ))}
    </ul>
  )
}
