import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'
import AuthProvider from '@/components/layout/AuthProvider'

export const metadata: Metadata = {
  title: 'CrossCourt – Ko je sledeći?',
  description: 'Pronađi gde se danas igra pikap basket u Beogradu',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/icon-192.png' },
  openGraph: {
    title: 'CrossCourt',
    description: 'Ko je sledeći? Pronađi pikap basket u Beogradu.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom is intentionally left enabled (no maximumScale/userScalable lock) —
  // disabling pinch-to-zoom is an accessibility anti-pattern.
  themeColor: '#0C0C0E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body className="bg-court-bg text-white font-body antialiased">
        <AuthProvider>
          <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
            <TopBar />
            <main className="flex-1 pb-20 pt-14">
              {children}
            </main>
            <BottomNav />
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#161618',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#FF6B00', secondary: '#161618' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
