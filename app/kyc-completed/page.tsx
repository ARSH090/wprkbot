'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { Search, Download, Image as ImageIcon, Copy, CheckCircle2 } from 'lucide-react'

export default function KycCompleted() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [stats, setStats] = useState({ today: 0, this_week: 0, this_month: 0, total: 0 })
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        fetchKycLeads()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    const fetchKycLeads = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/kyc?page=${page}&limit=50`)
            if (res.ok) {
                const data = await res.json()
                setLeads(data.leads || [])
                setStats(data.stats || { today: 0, this_week: 0, this_month: 0, total: 0 })
            }
        } catch (error) {
            console.error("Failed to fetch KYC leads", error)
            toast.error("Failed to load leads")
        } finally {
            setLoading(false)
        }
    }

    const downloadCsv = () => {
        const csvRows = []
        const headers = ['ID', 'Name', 'Mobile', 'Attempt Count', 'KYC Completed At', 'Days Since KYC']
        csvRows.push(headers.join(','))

        for (const lead of leads) {
            const kycDate = lead.kyc_completed_at ? new Date(lead.kyc_completed_at) : new Date();
            const daysSince = differenceInDays(new Date(), kycDate);
            const name = lead.attempt_count > 1 ? lead.secondary_name : lead.name;
            const mobile = lead.attempt_count > 1 ? lead.secondary_mobile : lead.mobile;

            const row = [
                lead.id,
                `"${name || ''}"`,
                mobile || '',
                lead.attempt_count || 1,
                lead.kyc_completed_at || '',
                daysSince
            ]
            csvRows.push(row.join(','))
        }

        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kyc-completed-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Mobile copied to clipboard");
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="text-green-500 w-6 h-6" /> KYC COMPLETED
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Successfully verified leads ready for next steps.</p>
                </div>
                <button
                    onClick={downloadCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Today" value={stats.today} color="text-green-400" />
                <StatCard title="This Week" value={stats.this_week} color="text-green-500" />
                <StatCard title="This Month" value={stats.this_month} color="text-blue-400" />
                <StatCard title="All Time" value={stats.total} color="text-white" />
            </div>

            {/* Leads List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading KYC leads...</div>
                ) : leads.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-[#0d1117] border border-gray-800 rounded-xl">No completed KYC records found.</div>
                ) : (
                    leads.map((lead) => {
                        const kycDate = lead.kyc_completed_at ? new Date(lead.kyc_completed_at) : new Date();
                        const daysSince = differenceInDays(new Date(), kycDate);
                        const attempt = lead.attempt_count || 1;
                        const isSecondary = attempt > 1;

                        const displayName = isSecondary && lead.secondary_name ? lead.secondary_name : lead.name;
                        const displayMobile = isSecondary && lead.secondary_mobile ? lead.secondary_mobile : lead.mobile;

                        return (
                            <div key={lead.id} className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
                                <div
                                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 font-bold uppercase">
                                            {(displayName || '?')[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white flex items-center gap-2">
                                                {displayName || 'Anonymous Lead'}
                                                {isSecondary && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-wider">Attempt 2</span>}
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                                {displayMobile || 'No mobile'}
                                                <button onClick={(e) => { e.stopPropagation(); handleCopy(displayMobile); }} className="hover:text-white p-1 rounded hover:bg-gray-800 transition-colors">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 sm:justify-end">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs text-gray-500">Days Since</div>
                                            <div className={`font-bold ${daysSince === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                                {daysSince === 0 ? 'Today' : `${daysSince} days`}
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs text-gray-500">Completed</div>
                                            <div className="text-sm text-gray-300">
                                                {lead.kyc_completed_at ? formatDistanceToNow(new Date(lead.kyc_completed_at), { addSuffix: true }) : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* EXPANDED VIEW */}
                                {expandedId === lead.id && (
                                    <div className="border-t border-gray-800 bg-[#0a0a0c] p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Details */}
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-sm border-b border-gray-800 pb-2 mb-3 font-semibold text-white tracking-wide">LEAD DETAILS (ATTEMPT {attempt})</h3>
                                                <div className="space-y-2 text-sm bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                                                    <div className="flex justify-between"><span className="text-gray-500">Full Name</span> <span className="text-white font-medium">{displayName}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Mobile</span> <span className="text-white font-medium">{displayMobile}</span></div>
                                                    {isSecondary && (
                                                        <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                                                            This KYC was completed using secondary details provided after the primary details failed. Primary Name: {lead.name}.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Screenshot */}
                                        <div className="lg:col-span-1 border-l border-gray-800 pl-6 border-t-0 pt-0">
                                            <h3 className="text-sm border-b border-gray-800 pb-2 mb-3 font-semibold text-white tracking-wide">COMPLETION SCREENSHOT</h3>
                                            <div className="flex flex-col gap-2">
                                                {lead.screenshot_url ? (
                                                    <>
                                                        <a href={lead.screenshot_url} target="_blank" rel="noreferrer" className="block relative aspect-[9/16] max-w-xs mx-auto bg-gray-900 rounded overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={lead.screenshot_url} alt={`Screenshot`} className="object-cover w-full h-full" />
                                                        </a>
                                                        <a href={lead.screenshot_url} target="_blank" rel="noreferrer" className="text-center text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center justify-center gap-1">
                                                            <ImageIcon className="w-3 h-3" /> View Full Image
                                                        </a>
                                                    </>
                                                ) : (
                                                    <div className="py-12 flex flex-col items-center justify-center text-gray-600 bg-[#030305] rounded-lg border border-gray-800 border-dashed">
                                                        <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                                                        <span>No screenshot available</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

function StatCard({ title, value, color = 'text-white' }: { title: string, value: string | number, color?: string }) {
    return (
        <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800 flex flex-col justify-center text-center">
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">{title}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    )
}
