import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import './globals.css'
import {
  NotificationProvider,
  NotificationToast,
  NotificationBell,
  NotificationSidebar,
} from '@/components/notifications'

export const metadata: Metadata = {
  title: 'CG Kensan',
  description: "L'art d'apprendre",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Instrument+Serif:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#09090a', color: '#eeede8' }}>
        <SessionProvider>
          <NotificationProvider>
            {children}
            <NotificationToast />
            <NotificationBell />
            <NotificationSidebar />
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
