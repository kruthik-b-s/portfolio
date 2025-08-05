import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Kruthik BS',
    template: '%s | Kruthik BS'
  },
  description: 'Kruthik\'s Database',
  metadataBase: new URL('https://www.kruthikbs.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.kruthikbs.dev',
    title: 'Kruthik BS',
    description: 'Personal website of Kruthik BS - Software Developer',
    siteName: 'Kruthik BS'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kruthik BS',
    creator: '@kruthikbs'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
