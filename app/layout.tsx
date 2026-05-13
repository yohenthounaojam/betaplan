import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BetaPlan — Find dates your whole crew can do',
  description: 'The easiest way to find dates that work for your entire crew. Built for outdoor sports outings.',
  metadataBase: new URL('https://betaplan.ca'),
  openGraph: {
    title: 'BetaPlan',
    description: 'Find dates your whole crew can do',
    url: 'https://betaplan.ca',
    siteName: 'BetaPlan',
    locale: 'en_CA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
