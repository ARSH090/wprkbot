'use client'

import { useState, useEffect } from 'react'
import { Save, Key, Settings as SettingsIcon, Bell, Cpu, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
    const [settings, setSettings] = useState<{ [key: string]: string | boolean }>({
        openai_api_key: '',
        system_prompt: '',
        use_voice: false,
        n8n_webhook_url: '',
        n8n_auth_token: '',
        admin_email: '',
        admin_messenger_id: '',
        headless_mode: true,
        max_concurrent_users: '3'
    })

    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) {
                const data = await res.json()
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    use_voice: data.use_voice === 'true' || data.use_voice === true,
                    headless_mode: data.headless_mode !== 'false' && data.headless_mode !== false,
                    max_concurrent_users: data.max_concurrent_users || '3'
                }))
            }
        } catch (error) {
            console.error("Failed to fetch settings", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        const loadingToast = toast.loading('Saving settings...')
        try {
            // Convert booleans back to string for DB storage if needed
            const payload = {
                ...settings,
                use_voice: String(settings.use_voice),
                headless_mode: String(settings.headless_mode)
            }

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: payload })
            })

            if (res.ok) {
                toast.success('Settings saved successfully', { id: loadingToast })
            } else {
                toast.error('Failed to save settings', { id: loadingToast })
            }
        } catch (error) {
            toast.error('An error occurred', { id: loadingToast })
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="p-12 text-center text-gray-500">Loading Configuration...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest">SYSTEM SETTINGS</h1>
                    <p className="text-sm text-gray-400 mt-1">Configure global parameters for the Bot, AI, and Automation engine.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors uppercase tracking-wider"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Config'}
                </button>
            </div>

            <div className="space-y-6">
                {/* SECTION 1: AI Config */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                        <h2 className="font-semibold text-white flex items-center gap-2 tracking-wide text-sm">
                            <Cpu className="w-4 h-4 text-purple-500" />
                            SECTION 1: AI CONFIGURATION
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">OpenAI API Key</label>
                                <input
                                    type="password"
                                    value={settings.openai_api_key as string}
                                    onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="sk-..."
                                />
                            </div>
                            <div className="flex items-center h-full pt-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.use_voice ? 'bg-blue-500' : 'bg-gray-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.use_voice ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={settings.use_voice as boolean}
                                        onChange={(e) => setSettings({ ...settings, use_voice: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Enable Voice AI Responses</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">System Prompt</label>
                            <textarea
                                value={settings.system_prompt as string}
                                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:border-blue-500 focus:outline-none transition-colors h-32 focus:text-white"
                                placeholder="You are a helpful assistant..."
                            />
                            <p className="text-xs text-gray-500 mt-2">This prompt dictates the behavior of the OpenAI integration in the n8n workflow.</p>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: N8N Config */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                        <h2 className="font-semibold text-white flex items-center gap-2 tracking-wide text-sm">
                            <SettingsIcon className="w-4 h-4 text-blue-500" />
                            SECTION 2: N8N WORKFLOW INTEGRATION
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">n8n Webhook URL</label>
                            <input
                                type="url"
                                value={settings.n8n_webhook_url as string}
                                onChange={(e) => setSettings({ ...settings, n8n_webhook_url: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="https://your-n8n.com/webhook/..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">n8n Auth Token (Optional)</label>
                            <input
                                type="password"
                                value={settings.n8n_auth_token as string}
                                onChange={(e) => setSettings({ ...settings, n8n_auth_token: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Admin Notifications */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                        <h2 className="font-semibold text-white flex items-center gap-2 tracking-wide text-sm">
                            <Bell className="w-4 h-4 text-yellow-500" />
                            SECTION 3: ADMIN NOTIFICATIONS
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Target Email Address</label>
                            <input
                                type="email"
                                value={settings.admin_email as string}
                                onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="admin@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Admin Messenger ID</label>
                            <input
                                type="text"
                                value={settings.admin_messenger_id as string}
                                onChange={(e) => setSettings({ ...settings, admin_messenger_id: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="Facebook PSID"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Automation Settings */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                        <h2 className="font-semibold text-white flex items-center gap-2 tracking-wide text-sm">
                            <Cpu className="w-4 h-4 text-green-500" />
                            SECTION 4: AUTOMATION ENGINE
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Max Concurrent Browsers</label>
                            <select
                                value={settings.max_concurrent_users as string}
                                onChange={(e) => setSettings({ ...settings, max_concurrent_users: e.target.value })}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                            >
                                <option value="1">1 (Safe)</option>
                                <option value="2">2 (Balanced)</option>
                                <option value="3">3 (Maximum)</option>
                                <option value="4">4 (Extremely Unsafe)</option>
                            </select>
                        </div>
                        <div className="flex items-center h-full pt-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.headless_mode ? 'bg-blue-500' : 'bg-gray-800'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.headless_mode ? 'left-7' : 'left-1'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={settings.headless_mode as boolean}
                                    onChange={(e) => setSettings({ ...settings, headless_mode: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Run Automation Headless (Hidden Browser)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-400">
                    <p className="font-bold mb-1">Important Note:</p>
                    <p className="opacity-80">Settings changed here will be immediately read by the n8n workflows and the Node.js automation microservice on their next execution. Restarting those services is not required.</p>
                </div>
            </div>
        </div>
    )
}
