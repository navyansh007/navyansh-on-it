import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="page plate">
      <div className="kicker">Stop Press</div>
      <h1 className="plate__title">No such edition</h1>
      <p>
        This page was never set in type, or has been pulled from circulation.
      </p>
      <p style={{ marginTop: '2rem' }}>
        <Link href="/" style={{ borderBottom: '1px solid var(--rule)' }}>
          Return to the front page
        </Link>
      </p>
    </div>
  )
}
