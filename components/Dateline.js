'use client'

import { useEffect, useState } from 'react'
import { formatDateline } from './Masthead'

/**
 * The masthead date. The server value is rendered first so there is no flash
 * and no hydration mismatch; on mount we refresh it, which matters because the
 * layout can be served from a static or revalidated cache whose date is stale.
 */
export default function Dateline({ initial }) {
  const [date, setDate] = useState(initial)

  useEffect(() => {
    setDate(formatDateline(new Date()))
  }, [])

  return <span>{date}</span>
}
