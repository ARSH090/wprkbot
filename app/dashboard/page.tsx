'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_leads: 0,
        leads_today: 0,
        kyc_completed: 0,
        kyc_today: 0,
        kyc_this_week: 0,
        kyc_this_month: 0,
        failed: 0,
        processing: 0,
        automating: 0
    })
    const [activity, setActivity] = useState<any[]>([])

    useEffect(() => {
        fetchDashboardData()
        fetchActivityFeed()

        // Realtime subscriptions
        const leadsSub = supabase.channel('leads-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchDashboardData()
            }).subscribe()

        const logsSub = supabase.channel('logs-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automation_logs' }, (payload) => {
                setActivity(prev => [payload.new, ...prev].slice(0, 20))
            }).subscribe()

        return () => {
            supabase.removeChannel(leadsSub)
            supabase.removeChannel(logsSub)
        }
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error("Failed to fetch stats", e)
        }
    }

    const fetchActivityFeed = async () => {
        const { data: logs } = await supabase.from('automation_logs').select('*').order('created_at', { ascending: false }).limit(20)
        if (logs) setActivity(logs)
    }

    const getLogColor = (status: string) => {
        if (status === 'success') return 'text-green-500 bg-green-500/20'
        if (status === 'failure' || status === 'error') return 'text-red-500 bg-red-500/20'
        return 'text-blue-500 bg-blue-500/20'
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-widest">DASHBOARD OVERVIEW</h1>

            {/* TOP ROW STAT CARDS (4 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Leads" value={stats.total_leads} />
                <StatCard title="Leads Today" value={stats.leads_today} />
                <StatCard title="KYC Done Today" value={stats.kyc_today} color="text-green-400" bgColor="bg-green-900/20 border-green-900/50" />
                <StatCard title="Processing Now" value={stats.processing + stats.automating} color="text-blue-400" />
            </div>

            {/* SECOND ROW STAT CARDS (3 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="KYC This Week" value={stats.kyc_this_week} color="text-green-500" />
                <StatCard title="KYC This Month" value={stats.kyc_this_month} color="text-green-500" />
                <StatCard title="Total KYC All Time" value={stats.kyc_completed} color="text-green-500" />
            </div>

            {/* ACTIVITY FEED */}
            <div className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                    <h2 className="font-semibold text-white tracking-wide text-sm">LIVE ACTIVITY FEED (LAST 20 EVENTS)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-500 bg-[#0a0a0c] uppercase border-b border-gray-800">
                            <tr>
                                <th className="px-4 py-3">Lead / Messenger ID</th>
                                <th className="px-4 py-3">Step</th>
                                <th className="px-4 py-3">Message</th>
                                <th className="px-4 py-3 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.map((log) => (
                                <tr key={log.id} className="border-b border-gray-800 hover:bg-[#121820] transition-colors">
                                    <td className="px-4 py-3 font-medium text-white">
                                        {log.lead_messenger_id || log.lead_id || 'System'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : log.status === 'failure' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                            <span className="text-gray-300">{log.step}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 max-w-md truncate">
                                        {log.message}
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                                        {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                                    </td>
                                </tr>
                            ))}
                            {activity.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                        No recent activity
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, color = 'text-white', bgColor = 'bg-[#0d1117] border-gray-800' }: { title: string, value: string | number, color?: string, bgColor?: string }) {
    return (
        <div className={`${bgColor} p-6 rounded-xl border flex flex-col justify-center`}>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</div>
            <div className={`text-4xl font-bold ${color}`}>{value}</div>
        </div>
    )
}
