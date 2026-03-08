'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0, successRate: 0 })
    const [recentLeads, setRecentLeads] = useState<any[]>([])
    const [activity, setActivity] = useState<any[]>([])

    useEffect(() => {
        fetchDashboardData()

        // Realtime subscriptions
        const leadsSub = supabase.channel('leads-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchDashboardData()
            }).subscribe()

        const logsSub = supabase.channel('logs-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automation_logs' }, () => {
                fetchActivityFeed()
            }).subscribe()

        return () => {
            supabase.removeChannel(leadsSub)
            supabase.removeChannel(logsSub)
        }
    }, [])

    const fetchDashboardData = async () => {
        const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
        if (!leads) return

        setRecentLeads(leads.slice(0, 10))

        const total = leads.length
        const approved = leads.filter(l => l.state === 'completed' && l.approved_amount).length
        const rejected = leads.filter(l => l.state === 'rejected' || l.job_status === 'failed').length
        const pending = leads.filter(l => l.state !== 'completed' && l.state !== 'rejected' && l.state !== 'failed').length
        const successRate = total > 0 ? Math.round((approved / total) * 100) : 0

        setStats({ total, approved, rejected, pending, successRate })
    }

    const fetchActivityFeed = async () => {
        const { data: logs } = await supabase.from('automation_logs').select('*').order('created_at', { ascending: false }).limit(10)
        if (logs) setActivity(logs)
    }

    const getStatusColor = (state: string, jobStatus: string) => {
        if (state === 'completed') return 'bg-green-500/20 text-green-500'
        if (state === 'rejected' || jobStatus === 'failed') return 'bg-red-500/20 text-red-500'
        if (state === 'idle') return 'bg-gray-500/20 text-gray-400'
        return 'bg-orange-500/20 text-orange-500'
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard title="Total Leads" value={stats.total} />
                <StatCard title="Approved Today" value={stats.approved} color="text-green-500" />
                <StatCard title="Rejected Today" value={stats.rejected} color="text-red-500" />
                <StatCard title="Pending" value={stats.pending} color="text-orange-500" />
                <StatCard title="Success Rate" value={`${stats.successRate}%`} color="text-blue-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Leads */}
                <div className="lg:col-span-2 bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="font-semibold text-white">Recent Leads</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-500 bg-[#0a0a0c] uppercase">
                                <tr>
                                    <th className="px-4 py-3 border-b border-gray-800">Name / Mobile</th>
                                    <th className="px-4 py-3 border-b border-gray-800">Status</th>
                                    <th className="px-4 py-3 border-b border-gray-800">Time</th>
                                    <th className="px-4 py-3 border-b border-gray-800 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.map((lead) => (
                                    <tr key={lead.id} className="border-b border-gray-800 hover:bg-[#121820]">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{lead.full_name || 'Unknown'}</div>
                                            <div className="text-xs">{lead.mobile || lead.messenger_id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(lead.state, lead.job_status)}`}>
                                                {lead.state}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : ''}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/leads?id=${lead.id}`} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {recentLeads.length === 0 && <div className="p-8 text-center text-gray-500">No leads yet</div>}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-[#0d1117] rounded-xl border border-gray-800 flex flex-col h-[500px]">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="font-semibold text-white">Live Activity Feed</h2>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                        {activity.map((log) => (
                            <div key={log.id} className="flex gap-3 text-sm">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                                <div>
                                    <div className="text-gray-300">
                                        <span className="font-medium text-white">{log.messenger_id}</span> - {log.step}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-0.5">{log.message}</div>
                                    <div className="text-gray-600 text-[10px] mt-1">
                                        {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activity.length === 0 && <div className="text-center text-gray-500 mt-10">No recent activity</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, color = 'text-white' }: { title: string, value: string | number, color?: string }) {
    return (
        <div className="bg-[#0d1117] p-5 rounded-xl border border-gray-800 flex flex-col justify-center">
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">{title}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    )
}
