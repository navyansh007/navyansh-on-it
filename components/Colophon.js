import Link from 'next/link'

export default function Colophon() {
  return (
    <footer className="colophon">
      <div className="page">
        <div>
          Navyansh On It &nbsp;·&nbsp; Written, set and printed by{' '}
          <strong>Navyansh Kesarwani</strong>
        </div>
        <div>
          <Link href="/">Front Page</Link> &nbsp;·&nbsp;{' '}
          <Link href="/archive">Archive</Link> &nbsp;·&nbsp;{' '}
          <Link href="/write">Compose</Link>
        </div>
        <div>All rights reserved, &copy; {new Date().getFullYear()}</div>
      </div>
    </footer>
  )
}
