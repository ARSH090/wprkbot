import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bajaj Bot Dashboard',
  description: 'Manage Bajaj EMI Card bot, leads, and settings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-gray-100 min-h-screen flex`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
