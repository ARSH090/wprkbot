'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { Search, Download, RefreshCw, XCircle, FileText, Image as ImageIcon } from 'lucide-react'

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [filteredLeads, setFilteredLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modal state for logs
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [currentLogs, setCurrentLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // State for expanded view chat history
  const [expandedLogs, setExpandedLogs] = useState<any[]>([])
  const [loadingExpandedLogs, setLoadingExpandedLogs] = useState(false)

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    setLoadingExpandedLogs(true)
    try {
      const res = await fetch(`/api/leads/${id}/logs`)
      const result = await res.json()
      if (result.success) {
        setExpandedLogs(result.data)
      } else {
        setExpandedLogs([])
      }
    } catch (err) {
      setExpandedLogs([])
    }
    setLoadingExpandedLogs(false)
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    filterData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, search, filter])

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) {
      setLeads(data)
    }
    setLoading(false)
  }

  const filterData = () => {
    let result = leads

    // Status Filter
    if (filter !== 'All') {
      result = result.filter(lead => {
        if (filter === 'Approved') return lead.state === 'completed' && lead.approved_amount
        if (filter === 'Rejected') return lead.state === 'rejected'
        if (filter === 'Failed') return lead.job_status === 'failed'
        if (filter === 'Active') return lead.state !== 'completed' && lead.state !== 'rejected' && lead.job_status !== 'failed'
        return true
      })
    }

    // Search
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(lead =>
        (lead.full_name && lead.full_name.toLowerCase().includes(s)) ||
        (lead.mobile && lead.mobile.includes(s)) ||
        (lead.messenger_id && lead.messenger_id.includes(s))
      )
    }

    setFilteredLeads(result)
  }

  const downloadCsv = () => {
    const csvRows = []
    const headers = ['ID', 'Messenger ID', 'Name', 'Mobile', 'State', 'Job Status', 'Amount', 'Created At']
    csvRows.push(headers.join(','))

    for (const lead of filteredLeads) {
      const row = [
        lead.id,
        lead.messenger_id,
        `"${lead.full_name || ''}"`,
        lead.mobile || '',
        lead.state || '',
        lead.job_status || '',
        lead.approved_amount || '',
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

  const getStatusColor = (state: string, jobStatus: string) => {
    if (state === 'completed') return 'bg-green-500/20 text-green-500 border-green-500/30'
    if (state === 'rejected' || jobStatus === 'failed') return 'bg-red-500/20 text-red-500 border-red-500/30'
    if (state === 'idle') return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
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
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 p-1 bg-[#0d1117] border border-gray-800 rounded-xl overflow-x-auto">
          {['All', 'Active', 'Approved', 'Rejected', 'Failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-[#0d1117] border border-gray-800 rounded-xl">No leads found</div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
              <div
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => handleExpand(lead.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold uppercase">
                    {(lead.full_name || '?')[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{lead.full_name || 'Anonymous Lead'}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      {lead.mobile || 'No mobile'} <span className="text-gray-700">•</span> {lead.messenger_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:justify-end">
                  {lead.approved_amount && (
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="font-bold text-green-500">₹{lead.approved_amount}</div>
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500">Started</div>
                    <div className="text-sm text-gray-300">
                      {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusColor(lead.state, lead.job_status)}`}>
                    {lead.state}
                  </div>
                </div>
              </div>

              {/* EXPANDED VIEW */}
              {expandedId === lead.id && (
                <div className="border-t border-gray-800 bg-[#0a0a0c] p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Col: Details & Actions */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm border-b border-gray-800 pb-2 mb-3 font-semibold text-white tracking-wide">LEAD DETAILS</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Full Name</span> <span className="text-white">{lead.full_name || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Mobile</span> <span className="text-white">{lead.mobile || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Job Status</span> <span className="text-white">{lead.job_status}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Retry Count</span> <span className="text-white">{lead.retry_count || 0}</span></div>
                        {lead.rejection_reason && (
                          <div className="flex flex-col mt-2">
                            <span className="text-gray-500">Rejection Reason</span>
                            <span className="text-red-400 bg-red-500/10 p-2 rounded mt-1 text-xs">{lead.rejection_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm border-b border-gray-800 pb-2 mb-3 font-semibold text-white tracking-wide">ACTIONS</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const loadingToast = toast.loading('Retrying lead...')
                            try {
                              const res = await fetch('/api/retry', { method: 'POST', body: JSON.stringify({ messenger_id: lead.messenger_id }) })
                              if (res.ok) {
                                toast.success('Lead status updated to Retrying!', { id: loadingToast })
                                fetchLeads()
                              } else {
                                toast.error('Failed to retry.', { id: loadingToast })
                              }
                            } catch (err) {
                              toast.error('An error occurred.', { id: loadingToast })
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 rounded text-sm font-medium transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" /> Retry Lead
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm('Mark this lead as failed?')) return;
                            const loadingToast = toast.loading('Marking as failed...')
                            try {
                              const res = await fetch(`/api/leads/${lead.id}/status`, { method: 'POST' })
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
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded text-sm font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Mark Failed
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            setLogsModalOpen(true)
                            setLoadingLogs(true)
                            try {
                              const res = await fetch(`/api/leads/${lead.id}/logs`)
                              const result = await res.json()
                              if (result.success) {
                                setCurrentLogs(result.data)
                              } else {
                                setCurrentLogs([])
                              }
                            } catch (err) {
                              setCurrentLogs([])
                            }
                            setLoadingLogs(false)
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
                        >
                          <FileText className="w-4 h-4" /> Logs
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle Col: Chat Simulation */}
                  <div className="lg:col-span-1">
                    <h3 className="text-sm border-b border-gray-800 pb-2 mb-3 font-semibold text-white tracking-wide">CHAT HISTORY</h3>
                    <div className="bg-[#030305] rounded-lg border border-gray-800 h-64 overflow-y-auto p-3 text-xs flex flex-col gap-2">
                      {loadingExpandedLogs ? (
                        <div className="text-center text-gray-500 my-auto">Loading chat history...</div>
                      ) : expandedLogs.length === 0 ? (
                        <div className="text-center text-gray-500 my-auto">No chat history found.</div>
                      ) : (
                        expandedLogs.filter(l => l.step && l.step.includes('Message')).length > 0 ? (
                          expandedLogs
                            .filter(l => l.step && l.step.includes('Message'))
                            .reverse()
                            .map((msg, i) => {
                              const isBot = msg.step.includes('Sent')
                              return (
                                <div key={i} className={`flex flex-col ${isBot ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-3 py-2 rounded-lg max-w-[85%] ${isBot ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-br-none' : 'bg-gray-800/50 text-gray-200 border border-gray-700 rounded-bl-none'}`}>
                                    {msg.message}
                                  </div>
                                  <span className="text-[10px] text-gray-500 mt-1">{msg.created_at ? formatDistanceToNow(new Date(msg.created_at)) : ''}</span>
                                </div>
                              )
                            })
                        ) : (
                          <div className="text-center text-gray-500 my-auto">No messages recorded. Check Logs.</div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Right Col: Screenshots */}
                  <div className="lg:col-span-1">
                    <h3 className="text-sm border-b border-gray-800 pb-2 mb-3 font-semibold text-white tracking-wide">SCREENSHOTS</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {lead.screenshot_urls && lead.screenshot_urls.length > 0 ? (
                        lead.screenshot_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative aspect-video bg-gray-900 rounded overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Screenshot ${i}`} className="object-cover w-full h-full opacity-70 hover:opacity-100 transition-opacity" />
                          </a>
                        ))
                      ) : (
                        <div className="col-span-2 py-8 flex flex-col items-center justify-center text-gray-600 bg-[#030305] rounded-lg border border-gray-800 border-dashed">
                          <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                          <span>No screenshots yet</span>
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

      {/* Logs Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setLogsModalOpen(false)}>
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0c]">
              <h2 className="font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-gray-400" /> Automation Logs</h2>
              <button onClick={() => setLogsModalOpen(false)} className="text-gray-400 hover:text-white"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[#0a0a0c]">
              {loadingLogs ? (
                <div className="text-center py-8 text-gray-500">Loading logs...</div>
              ) : currentLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No logs found for this lead.</div>
              ) : (
                currentLogs.map((log) => {
                  let colorClass = 'border-gray-800 bg-gray-800/20 text-gray-300'
                  if (log.status === 'success') colorClass = 'border-green-500/30 bg-green-500/10 text-green-400'
                  if (log.status === 'error' || log.status === 'failed') colorClass = 'border-red-500/30 bg-red-500/10 text-red-400'
                  if (log.status === 'info') colorClass = 'border-blue-500/30 bg-blue-500/10 text-blue-400'

                  return (
                    <div key={log.id} className={`p-3 rounded-lg border ${colorClass} text-sm`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold">{log.step}</span>
                        <span className="text-xs opacity-70">
                          {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <div className="opacity-90">{log.message}</div>
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
