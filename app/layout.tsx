import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'
import AuthProvider from '@/components/layout/AuthProvider'

export const metadata: Metadata = {
  title: 'BasketBG – Gde se danas igra basket?',
  description: 'Pronađi gde se danas igra pikap basket u Beogradu',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'BasketBG',
    description: 'Gde se danas igra basket u Beogradu?',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
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
                background: '#111',
                color: '#fff',
                border: '1px solid #1E1E1E',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#F97316', secondary: '#111' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
