'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Front Page' },
  { href: '/archive', label: 'Archive' },
  { href: '/write', label: 'Compose' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Sections">
      {LINKS.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
