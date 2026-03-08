'use client'

import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLogin = pathname === '/login'

    if (isLogin) {
        return (
            <SessionProvider>
                <div className="flex-1">
                    {children}
                    <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
                </div>
            </SessionProvider>
        )
    }

    return (
        <SessionProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 overflow-auto bg-[#0a0a0c] p-6">
                    {children}
                    <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
                </main>
            </div>
        </SessionProvider>
    )
}
