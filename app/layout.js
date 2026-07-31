import { EB_Garamond, Playfair_Display } from 'next/font/google'
import Masthead from '../components/Masthead'
import Colophon from '../components/Colophon'
import Journal from '../components/Journal'
import './globals.css'

const garamond = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://navyanshonit.com'),
  title: {
    default: 'Navyansh On It',
    template: '%s — Navyansh On It',
  },
  description:
    'A journal of notes on software, systems and the working life of a coder — set in the manner of an old broadsheet.',
  keywords: [
    'navyansh kesarwani',
    'navyansh on it',
    'blog',
    'journal',
    'software',
    'engineering',
  ],
  openGraph: {
    title: 'Navyansh On It',
    description:
      'A journal of notes on software, systems and the working life of a coder.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  themeColor: '#f3eee2',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${garamond.variable} ${playfair.variable}`}>
      <body>
        <Masthead />
        <main>{children}</main>
        <Colophon />
        <Journal />
      </body>
    </html>
  )
}
