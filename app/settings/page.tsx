'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Key, Globe, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Settings() {
    const [keys, setKeys] = useState<{ [key: string]: string }>({
        openai_api_key: '',
        n8n_webhook_url: '',
        n8n_auth_token: '',
        timezone: 'Asia/Kolkata',
    })
    const [links, setLinks] = useState<any[]>([])
    const [newLink, setNewLink] = useState({ name: '', url: '' })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetchSettings()
        fetchLinks()
    }, [])

    const fetchSettings = async () => {
        const { data } = await supabase.from('bot_settings').select('*')
        if (data) {
            const newKeys = { ...keys }
            data.forEach(item => {
                if (item.key in newKeys) {
                    newKeys[item.key] = item.value
                }
            })
            setKeys(newKeys)
        }
    }

    const fetchLinks = async () => {
        const { data } = await supabase.from('affiliate_links').select('*').order('created_at', { ascending: false })
        if (data) setLinks(data)
    }

    const handleSaveKeys = async () => {
        setSaving(true)
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(keys)
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLink.name || !newLink.url) return

        const { data, error } = await supabase.from('affiliate_links').insert([newLink]).select()
        if (!error && data) {
            setLinks([data[0], ...links])
            setNewLink({ name: '', url: '' })
        }
    }

    const handleDeleteLink = async (id: string) => {
        await supabase.from('affiliate_links').delete().eq('id', id)
        setLinks(links.filter(l => l.id !== id))
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest">SYSTEM SETTINGS</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage API keys, integrations, and affiliate links</p>
                </div>
                <button
                    onClick={handleSaveKeys}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors uppercase tracking-wider"
                >
                    {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Saving...' : saved ? 'Saved' : 'Save Config'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Keys */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden self-start">
                    <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <Key className="w-4 h-4 text-yellow-500" />
                            API & Integrations
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">OpenAI API Key</label>
                            <input
                                type="password"
                                value={keys.openai_api_key}
                                onChange={(e) => setKeys({ ...keys, openai_api_key: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:border-green-500 focus:outline-none transition-colors"
                                placeholder="sk-..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">n8n Webhook URL</label>
                            <input
                                type="url"
                                value={keys.n8n_webhook_url}
                                onChange={(e) => setKeys({ ...keys, n8n_webhook_url: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:border-green-500 focus:outline-none transition-colors"
                                placeholder="https://your-n8n-instance.railway.app/webhook/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">n8n Auth Token (Optional)</label>
                            <input
                                type="password"
                                value={keys.n8n_auth_token}
                                onChange={(e) => setKeys({ ...keys, n8n_auth_token: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:border-green-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="pt-2">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 text-blue-400 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>These keys are stored securely in Supabase and accessed only by your server-side n8n workflows.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Settings */}
                <div className="space-y-6">
                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-500" />
                                Localization
                            </h2>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-400 mb-1">System Timezone</label>
                            <select
                                value={keys.timezone}
                                onChange={(e) => setKeys({ ...keys, timezone: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:border-green-500 focus:outline-none transition-colors"
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New_York (EST)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-purple-500" />
                                Affiliate Link Manager
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Links the bot will send to users.</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddLink} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    placeholder="Link Name (e.g. Loan Apply)"
                                    value={newLink.name}
                                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                                    className="flex-1 bg-[#030305] border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-green-500 focus:outline-none"
                                    required
                                />
                                <input
                                    type="url"
                                    placeholder="URL"
                                    value={newLink.url}
                                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                    className="flex-1 bg-[#030305] border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-green-500 focus:outline-none"
                                    required
                                />
                                <button type="submit" className="px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    Add
                                </button>
                            </form>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {links.map((link) => (
                                    <div key={link.id} className="flex items-center justify-between p-3 bg-[#030305] rounded-lg border border-gray-800 text-sm group hover:border-gray-700 transition-colors">
                                        <div className="truncate pr-4">
                                            <div className="font-medium text-white">{link.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{link.url}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteLink(link.id)}
                                            className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                {links.length === 0 && <div className="text-center text-gray-500 py-4 text-sm">No links added</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
