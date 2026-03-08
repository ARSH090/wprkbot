'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
    const [botEnabled, setBotEnabled] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStatus = async () => {
            const { data } = await supabase
                .from('bot_settings')
                .select('value')
                .eq('key', 'bot_enabled')
                .single()

            if (data) {
                setBotEnabled(data.value === 'true')
            }
            setLoading(false)
        }
        fetchStatus()
    }, [])

    const toggleBot = async () => {
        const newState = !botEnabled
        setBotEnabled(newState)

        try {
            await fetch('/api/bot-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState })
            })
        } catch (e) {
            // revert on error
            setBotEnabled(!newState)
        }
    }

    if (loading) return <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6" />

    return (
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6">
            <div className="flex items-center text-sm text-gray-400">
                <span>Master Bot Status</span>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase ${botEnabled ? 'text-green-500' : 'text-red-500'}`}>
                    {botEnabled ? 'Running' : 'Stopped'}
                </span>
                <button
                    onClick={toggleBot}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${botEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${botEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
            </div >
        </header >
    )
}
