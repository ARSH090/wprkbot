'use client'

import { useState, useEffect } from 'react'
import { Facebook, MessageSquare, CheckCircle, Copy, Loader2, AlertCircle } from 'lucide-react'

export default function Connect() {
    const [pageName, setPageName] = useState<string | null>(null)
    const [pageId, setPageId] = useState<string | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'not_connected'>('not_connected')
    const [pagesToSelect, setPagesToSelect] = useState<any[]>([])
    const [wizardStep, setWizardStep] = useState(1)

    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null)
    const [isTesting, setIsTesting] = useState(false)

    useEffect(() => {
        fetchSettings()

        // Check URL params for auth callback results
        const urlParams = new URLSearchParams(window.location.search)
        const encodedPages = urlParams.get('pages')
        const errorMsg = urlParams.get('error')

        if (encodedPages) {
            try {
                const parsedPages = JSON.parse(decodeURIComponent(encodedPages))
                setPagesToSelect(parsedPages)
                setWizardStep(2)
            } catch (e) {
                console.error("Failed to parse pages:", e)
            }
        } else if (errorMsg) {
            setTestResult({ success: false, message: `OAuth Error: ${errorMsg}` })
        }
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            const data = await res.json()
            if (Array.isArray(data)) {
                const tokenSetting = data.find(d => d.key === 'fb_page_access_token')
                const nameSetting = data.find(d => d.key === 'fb_page_name')
                const idSetting = data.find(d => d.key === 'fb_page_id')

                if (tokenSetting?.value) {
                    setAccessToken(tokenSetting.value)
                    setPageName(nameSetting?.value || 'Connected Page')
                    setPageId(idSetting?.value || '')
                    setConnectionStatus('connected')
                    setWizardStep(4) // Move to last step if already connected
                }
            }
        } catch (e) {
            console.error('Failed to fetch settings', e)
        }
        setLoading(false)
    }

    const startOAuth = () => {
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
        const redirectUri = `${window.location.origin}/api/facebook/callback`
        const scopes = 'pages_manage_metadata,pages_messaging,pages_read_engagement'
        window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`
    }

    const selectPage = async (page: any) => {
        setLoading(true)
        try {
            const res = await fetch('/api/facebook/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: page.id,
                    pageAccessToken: page.access_token,
                    pageName: page.name
                })
            })
            if (res.ok) {
                setPageName(page.name)
                setPageId(page.id)
                setAccessToken(page.access_token)
                setConnectionStatus('connected')
                setWizardStep(3) // Advance to token confirmation

                // Clear URL params
                window.history.replaceState({}, document.title, window.location.pathname)
            } else {
                setTestResult({ success: false, message: 'Failed to save page configuration' })
            }
        } catch (e) {
            setTestResult({ success: false, message: 'Failed to save page configuration' })
        }
        setLoading(false)
    }

    const testConnection = async () => {
        setIsTesting(true)
        setTestResult(null)
        try {
            const res = await fetch('/api/facebook/test', {
                method: 'POST'
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setTestResult({ success: true, message: 'Test message sent successfully!' })
            } else {
                setTestResult({ success: false, message: data.error || 'Failed to send test message' })
            }
        } catch (e) {
            setTestResult({ success: false, message: 'Connection to tester failed' })
        }
        setIsTesting(false)
    }

    const disconnectFacebook = async () => {
        try {
            setLoading(true)
            await fetch('/api/facebook/disconnect', { method: 'POST' })
            setPageName(null)
            setPageId(null)
            setAccessToken(null)
            setConnectionStatus('not_connected')
            setWizardStep(1)
        } catch (e) {
            console.error('Failed to disconnect', e)
        }
        setLoading(false)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const maskToken = (token: string) => {
        if (!token) return ''
        if (token.length <= 10) return '*'.repeat(token.length)
        return `${token.substring(0, 5)}...${token.substring(token.length - 5)}`
    }

    if (loading && wizardStep === 1 && connectionStatus === 'not_connected') {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-widest">MESSENGER CONNECT</h1>
                <p className="text-sm text-gray-500 mt-1">Connect your Facebook Page to enable the AI auto-responder.</p>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-lg border flex items-center gap-3 ${connectionStatus === 'connected' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                {connectionStatus === 'connected' ? (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">Connected to Facebook — Page: {pageName}</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">Not Connected — Follow the steps below</span>
                    </>
                )}
            </div>

            {testResult && (
                <div className={`p-4 rounded-lg border text-sm font-medium ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    {testResult.message}
                </div>
            )}

            <div className="space-y-6">

                {/* STEP 1 */}
                <div className={`bg-[#0d1117] border rounded-xl p-6 transition-all ${wizardStep === 1 ? 'border-blue-500 ring-1 ring-blue-500' : wizardStep > 1 ? 'border-green-500/50' : 'border-gray-800 opacity-50'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${wizardStep > 1 ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                            {wizardStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">Connect with Facebook</h3>
                            <p className="text-sm text-gray-400 mb-6">Authorize this dashboard to read and send messages on your behalf.</p>

                            {wizardStep === 1 && (
                                <button onClick={startOAuth} className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#1864D9] text-white rounded-lg font-medium transition-colors">
                                    <Facebook className="w-5 h-5" /> Connect Facebook Page
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* STEP 2 */}
                <div className={`bg-[#0d1117] border rounded-xl p-6 transition-all ${wizardStep === 2 ? 'border-blue-500 ring-1 ring-blue-500' : wizardStep > 2 ? 'border-green-500/50' : 'border-gray-800 opacity-50'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${wizardStep > 2 ? 'bg-green-500 text-white' : wizardStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            {wizardStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">Select Your Page</h3>
                            <p className="text-sm text-gray-400 mb-6">Choose the Facebook Page you want the bot to reply from.</p>

                            {wizardStep === 2 && pagesToSelect.length > 0 && (
                                <div className="space-y-3">
                                    {pagesToSelect.map((page) => (
                                        <div key={page.id} className="flex items-center justify-between p-4 bg-[#0a0a0c] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-lg">
                                                    {page.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{page.name}</div>
                                                    <div className="text-xs text-gray-500">ID: {page.id}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => selectPage(page)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {wizardStep === 2 && pagesToSelect.length === 0 && (
                                <div className="text-sm text-red-400">No pages found on your Facebook account. Please ensure you have an active Facebook Page.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* STEP 3 */}
                <div className={`bg-[#0d1117] border rounded-xl p-6 transition-all ${wizardStep === 3 ? 'border-blue-500 ring-1 ring-blue-500' : wizardStep > 3 ? 'border-green-500/50' : 'border-gray-800 opacity-50'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${wizardStep > 3 ? 'bg-green-500 text-white' : wizardStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            {wizardStep > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">Token Saved</h3>
                            <p className="text-sm text-gray-400 mb-6">A long-lived access token has been generated and securely stored.</p>

                            {wizardStep >= 3 && (
                                <div className="bg-[#030305] border border-gray-800 rounded-lg p-4 font-mono text-sm">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <span className="text-gray-500">Page Name:</span>
                                            <span className="text-white ml-2">{pageName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Page ID:</span>
                                            <span className="text-white ml-2">{pageId}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Access Token:</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded flex-1">
                                                    {maskToken(accessToken || '')}
                                                </code>
                                                <button onClick={() => copyToClipboard(accessToken || '')} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white" title="Copy full token">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {wizardStep === 3 && (
                                        <button onClick={() => setWizardStep(4)} className="w-full mt-6 py-2 bg-white text-black hover:bg-gray-200 rounded-md text-sm font-medium transition-colors">
                                            Continue to Webhook Setup
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* STEP 4 */}
                <div className={`bg-[#0d1117] border rounded-xl p-6 transition-all ${wizardStep === 4 ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-800 opacity-50'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${wizardStep === 4 ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            {wizardStep === 4 ? <CheckCircle className="w-5 h-5" /> : '4'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">Webhook Setup & Testing</h3>
                            <p className="text-sm text-gray-400 mb-6">Configure the webhook in Meta Developer Portal and test the connection.</p>

                            {wizardStep === 4 && (
                                <div className="space-y-6">
                                    <div className="bg-[#030305] border border-gray-800 rounded-lg p-4 font-mono text-sm space-y-4">
                                        <div>
                                            <span className="text-gray-500 mb-1 block">Webhook URL (Callback URL):</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-green-400 bg-green-500/10 px-2 py-1 rounded flex-1 overflow-auto whitespace-nowrap">
                                                    https://n8n-1-zlf1.onrender.com/webhook/bajaj-verify
                                                </code>
                                                <button onClick={() => copyToClipboard('https://n8n-1-zlf1.onrender.com/webhook/bajaj-verify')} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white shrink-0">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 mb-1 block">Verify Token:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded flex-1">
                                                    bajaj123
                                                </code>
                                                <button onClick={() => copyToClipboard('bajaj123')} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white shrink-0">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={testConnection}
                                            disabled={isTesting}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                                            Test Connection
                                        </button>
                                        <button
                                            onClick={disconnectFacebook}
                                            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-medium transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
