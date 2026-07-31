import Link from 'next/link'
import Nav from './Nav'
import Dateline from './Dateline'

const FOUNDED = 2022

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function romanVolume(date = new Date()) {
  const index = date.getFullYear() - FOUNDED
  return ROMAN[index] ?? String(index + 1)
}

export default function Masthead() {
  const now = new Date()

  return (
    <header className="masthead">
      <div className="page">
        <div className="masthead__ears">
          <span className="masthead__ear--left">
            Vol. {romanVolume(now)} &nbsp;·&nbsp; No. {now.getMonth() + 1}
          </span>
          <span className="masthead__ear--right">
            Est. {FOUNDED} &nbsp;·&nbsp; Price: Nothing at all
          </span>
        </div>

        <div className="rule-double" />

        <h1 className="masthead__title">
          <Link href="/">Navyansh On It</Link>
        </h1>

        <p className="masthead__motto">
          &ldquo;Notes on software, systems, and the working life of a coder.&rdquo;
        </p>

        <div className="dateline">
          <Dateline initial={formatDateline(now)} />
          <Nav />
        </div>
      </div>
    </header>
  )
}

export function formatDateline(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}
