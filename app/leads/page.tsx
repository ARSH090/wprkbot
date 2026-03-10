'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { Search, Download, RefreshCw, XCircle, FileText, Image as ImageIcon, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedLeadDetails, setExpandedLeadDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Modal state for logs
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [currentLogs, setCurrentLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, search])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads?page=${page}&limit=${limit}&status=${filter}&search=${search}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedLeadDetails(null)
      return
    }
    setExpandedId(id)
    setLoadingDetails(true)
    try {
      const res = await fetch(`/api/leads/${id}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedLeadDetails(data)
      }
    } catch (err) {
      console.error(err)
    }
    setLoadingDetails(false)
  }

  const downloadCsv = () => {
    const csvRows = []
    const headers = ['ID', 'Messenger ID', 'Name', 'Mobile', 'Status', 'PAN', 'Created At']
    csvRows.push(headers.join(','))

    for (const lead of leads) {
      const row = [
        lead.id,
        lead.messenger_id,
        `"${lead.name || lead.full_name || ''}"`,
        lead.mobile || '',
        lead.status || '',
        lead.pan || '',
        lead.created_at || ''
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> New</span>
      case 'processing':
        return <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Processing</span>
      case 'automating':
        return <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Automating</span>
      case 'failed':
      case 'permanently_failed':
        return <span className="px-3 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</span>
      case 'kyc_completed':
        return <span className="px-3 py-1 rounded bg-green-500/20 text-green-500 border border-green-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> KYC Done</span>
      default:
        return <span className="px-3 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs font-bold uppercase tracking-wider">{status}</span>
    }
  }

  const getProgressValue = (status: string, state: string) => {
    if (status === 'kyc_completed') return 100
    if (status === 'automating') return 75
    if (status === 'processing') {
      if (state === 'collecting') return 25
      if (state === 'ready_for_automation') return 50
      return 25
    }
    if (status === 'new') return 10
    return 0 // failed
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white tracking-widest">LEADS MANAGER</h1>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96 text-gray-400 focus-within:text-white">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, mobile, messenger ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 p-1 bg-[#0d1117] border border-gray-800 rounded-xl overflow-x-auto">
          {['All', 'New', 'Processing', 'Automating', 'KYC_Completed', 'All_Failed'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-[#0d1117] border border-gray-800 rounded-xl">No leads found</div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700 relative">
              {/* Inner Progress Bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-gray-800 w-full" />
              <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${getProgressValue(lead.status, lead.state)}%` }} />

              <div
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => handleExpand(lead.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold uppercase border border-blue-900/50">
                    {((lead.name || lead.full_name) || '?')[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white tracking-wide">{lead.name || lead.full_name || 'Incomplete Profile'}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      {lead.mobile || 'No mobile'} <span className="text-gray-700">•</span> {lead.messenger_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:justify-end">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Created</div>
                    <div className="text-sm text-gray-300">
                      {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>
              </div>

              {/* EXPANDED VIEW */}
              {expandedId === lead.id && (
                <div className="border-t border-gray-800 bg-[#0a0a0c] p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                  {/* Left Col: Details & Actions */}
                  <div className="space-y-6">
                    {loadingDetails ? <div className="text-gray-500 animate-pulse text-sm">Loading details...</div> : expandedLeadDetails && (
                      <>
                        <div>
                          <h3 className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3 font-bold">LEAD DETAILS</h3>
                          <div className="space-y-2 text-sm bg-gray-900/50 p-4 rounded-xl border border-gray-800/50">
                            <div className="flex justify-between"><span className="text-gray-500">Name</span> <span className="text-white font-medium">{expandedLeadDetails.name || expandedLeadDetails.full_name}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Mobile</span> <span className="text-white font-medium">{expandedLeadDetails.mobile}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">PAN</span> <span className="text-white font-medium">{lead.pan} {/* displayed masked from list query */}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Aadhaar</span> <span className="text-white font-medium">{lead.aadhaar}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">DOB</span> <span className="text-white font-medium">{expandedLeadDetails.dob}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">PIN</span> <span className="text-white font-medium">{expandedLeadDetails.pin_code}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Attempt Count</span> <span className="text-white font-medium">{expandedLeadDetails.attempt_count} / 2</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Internal State</span> <span className="text-white font-medium">{expandedLeadDetails.state}</span></div>
                            {expandedLeadDetails.failure_reason && (
                              <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded text-xs">
                                <span className="font-bold block mb-1">Failure Reason:</span>
                                {expandedLeadDetails.failure_reason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3 font-bold">MANUAL OVERRIDES</h3>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                const loadingToast = toast.loading('Retrying lead...')
                                try {
                                  const res = await fetch('/api/retry', { method: 'POST', body: JSON.stringify({ leadId: lead.id }), headers: { 'Content-Type': 'application/json' } })
                                  if (res.ok) {
                                    toast.success('Retry sequence initiated', { id: loadingToast })
                                    fetchLeads()
                                  } else {
                                    toast.error('Failed to retry.', { id: loadingToast })
                                  }
                                } catch (err) {
                                  toast.error('An error occurred.', { id: loadingToast })
                                }
                              }}
                              disabled={lead.status === 'automating'}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className="w-4 h-4" /> RETRY
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!confirm('Force Mark this lead as failed?')) return;
                                const loadingToast = toast.loading('Marking as failed...')
                                try {
                                  const res = await fetch(`/api/leads/${lead.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'failed' }), headers: { 'Content-Type': 'application/json' } })
                                  if (res.ok) {
                                    toast.success('Lead marked as failed', { id: loadingToast })
                                    fetchLeads()
                                  } else {
                                    toast.error('Failed to update lead', { id: loadingToast })
                                  }
                                } catch (err) {
                                  toast.error('An error occurred', { id: loadingToast })
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <XCircle className="w-4 h-4" /> MARK FAILED
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                setLogsModalOpen(true)
                                setLoadingLogs(true)
                                try {
                                  const res = await fetch(`/api/logs/${lead.id}`)
                                  const result = await res.json()
                                  setCurrentLogs(result)
                                } catch (err) {
                                  setCurrentLogs([])
                                }
                                setLoadingLogs(false)
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <FileText className="w-4 h-4" /> VIEW LOGS
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Middle Col: Chat Simulator */}
                  <div className="lg:col-span-1 border-l border-gray-800/50 pl-6 h-full flex flex-col">
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3 font-bold">CHAT CONVERSATION</h3>
                    <div className="bg-[#030305] rounded-xl border border-gray-800/50 flex-1 overflow-y-auto p-4 text-xs flex flex-col gap-3 max-h-80">
                      {loadingDetails ? (
                        <div className="text-center text-gray-500 my-auto animate-pulse">Loading chat history...</div>
                      ) : expandedLeadDetails?.conversation_history && Array.isArray(expandedLeadDetails.conversation_history) && expandedLeadDetails.conversation_history.length > 0 ? (
                        expandedLeadDetails.conversation_history.map((msg: any, i: number) => {
                          const role = String(msg.role).toLowerCase();
                          const isUser = role === 'user';
                          return (
                            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                              <div className={`px-3 py-2.5 rounded-xl max-w-[85%] ${isUser ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-none' : 'bg-gray-800/50 text-gray-200 border border-gray-700/50 rounded-tl-none'}`}>
                                {msg.content}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center text-gray-500 my-auto">No chat history recorded.</div>
                      )}
                    </div>
                  </div>

                  {/* Right Col: Screenshot */}
                  <div className="lg:col-span-1 border-l border-gray-800/50 pl-6 h-full">
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3 font-bold">FINAL SCREENSHOT</h3>
                    <div className="flex flex-col h-full mt-2">
                      {(expandedLeadDetails?.screenshot_url || lead.screenshot_url) ? (
                        <div className="bg-gray-900 rounded-lg p-1 border border-gray-800">
                          <a href={expandedLeadDetails?.screenshot_url || lead.screenshot_url} target="_blank" rel="noreferrer" className="block relative aspect-[9/16] max-w-xs mx-auto overflow-hidden rounded group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={expandedLeadDetails?.screenshot_url || lead.screenshot_url} alt={`Final Screenshot`} className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                              <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> View Full
                              </div>
                            </div>
                          </a>
                        </div>
                      ) : (
                        <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-gray-600 bg-gray-900/30 rounded-xl border border-gray-800/50 border-dashed">
                          <ImageIcon className="w-8 h-8 mb-3 opacity-30" />
                          <span className="text-sm font-medium">No screenshot captured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && total > limit && (
        <div className="flex justify-between items-center py-4 text-sm text-gray-400">
          <div>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} leads</div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-gray-800 rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-gray-800 rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLogsModalOpen(false)}>
          <div className="bg-[#0a0a0c] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0d1117]">
              <h2 className="font-bold text-white tracking-widest uppercase flex items-center gap-2 text-sm"><FileText className="w-5 h-5 text-blue-500" /> Automation Audit Trail</h2>
              <button onClick={() => setLogsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingLogs ? (
                <div className="text-center py-12 text-gray-500 animate-pulse">Fetching log trace...</div>
              ) : currentLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-900/40 rounded-xl border border-dashed border-gray-800">No telemetry found for this lead.</div>
              ) : (
                currentLogs.map((log) => {
                  let colorClass = 'border-gray-800 bg-[#0d1117]'
                  let dotClass = 'bg-gray-500'

                  if (log.status === 'success') {
                    colorClass = 'border-green-900/50 bg-green-900/10'
                    dotClass = 'bg-green-500'
                  } else if (log.status === 'error' || log.status === 'failed') {
                    colorClass = 'border-red-900/50 bg-red-900/10'
                    dotClass = 'bg-red-500'
                  } else if (log.status === 'info') {
                    colorClass = 'border-blue-900/50 bg-blue-900/10'
                    dotClass = 'bg-blue-500'
                  }

                  return (
                    <div key={log.id} className={`p-4 rounded-xl border ${colorClass} text-sm flex gap-4`}>
                      <div className="pt-1"><div className={`w-2.5 h-2.5 rounded-full ${dotClass} shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-${dotClass.split('-')[1]}-500/50`} /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-bold text-gray-200 tracking-wide">{log.step}</span>
                          <span className="text-[10px] text-gray-500 font-mono tracking-tighter">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs leading-relaxed">{log.message}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
