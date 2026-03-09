'use client'

import { useState, useEffect, useRef } from 'react'
import { BrainCircuit, Save, UploadCloud, Link as LinkIcon, FileText, CheckCircle2, XCircle, ArrowRight, Bot, User, Send, Loader2, RefreshCw } from 'lucide-react'

interface AnalysisResult {
    state?: string;
    botMessage?: string;
    customerMessage?: string;
    idealResponse?: string;
    suggestedPromptUpdate?: string;
    error?: string;
}

interface TrainingDoc {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    analysis: AnalysisResult;
    applied: boolean;
    created_at: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function Training() {
    // Tab 1: Configuration
    const [systemPrompt, setSystemPrompt] = useState('')
    const [useVoice, setUseVoice] = useState(false)
    const [knowledgeUrls, setKnowledgeUrls] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Tab 2: Document Upload
    const [docs, setDocs] = useState<TrainingDoc[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Tab 3: Simulator
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Hi there! I am the Bajaj EMI Card Bot. How can I help you?' }])
    const [newMessage, setNewMessage] = useState('')
    const [isSimulating, setIsSimulating] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // General
    const [activeTab, setActiveTab] = useState<'prompt' | 'upload' | 'simulate'>('prompt')

    useEffect(() => {
        fetchSettings()
        fetchDocs()
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatHistory, isSimulating])

    const fetchSettings = async () => {
        const response = await fetch('/api/settings')
        const data = await response.json()

        if (Array.isArray(data)) {
            const promptObj = data.find(s => s.key === 'system_prompt')
            const voiceObj = data.find(s => s.key === 'use_voice')
            const urlsObj = data.find(s => s.key === 'knowledge_urls')

            if (promptObj) setSystemPrompt(promptObj.value)
            if (voiceObj) setUseVoice(voiceObj.value === 'true')
            if (urlsObj) setKnowledgeUrls(urlsObj.value)
        }
    }

    const fetchDocs = async () => {
        try {
            const res = await fetch('/api/training/analyze')
            if (res.ok) {
                const data = await res.json()
                setDocs(data || [])
            }
        } catch (e) {
            console.error("Failed to fetch training docs", e)
        }
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_prompt: systemPrompt,
                use_voice: useVoice,
                knowledge_urls: knowledgeUrls
            })
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    // --- UPLOAD LOGIC ---

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => {
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files)
        }
    }

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(e.target.files)
        }
    }

    const handleUploadFiles = async (files: FileList) => {
        setUploadError('')
        setUploading(true)
        setUploadProgress(10)

        // Take just the first 10 files if they drop a lot
        const filesArray = Array.from(files).slice(0, 10)

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i]

            // Validate type and size (5MB)
            if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
                setUploadError('Only PNG, JPG, and PDF are supported.')
                continue
            }
            if (file.size > 5 * 1024 * 1024) {
                setUploadError(`File ${file.name} is too large (max 5MB).`)
                continue
            }

            try {
                const formData = new FormData()
                formData.append('file', file)

                // Simulate upload progress
                const interval = setInterval(() => {
                    setUploadProgress(prev => Math.min(prev + 15, 90))
                }, 500)

                const res = await fetch('/api/training/analyze', {
                    method: 'POST',
                    body: formData
                })

                clearInterval(interval)
                setUploadProgress(100)

                if (res.ok) {
                    await fetchDocs() // Refresh list
                } else {
                    const data = await res.json()
                    setUploadError(data.error || 'Upload failed.')
                }
            } catch (e) {
                setUploadError('Network error during upload.')
            }
        }

        setTimeout(() => {
            setUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }, 1000)
    }

    const handleDeleteDoc = async (id: string) => {
        if (!confirm("Are you sure you want to delete this training data?")) return
        try {
            await fetch(`/api/training/analyze/${id}`, { method: 'DELETE' })
            setDocs(docs.filter(d => d.id !== id))
        } catch (e) {
            console.error(e)
        }
    }

    const applyAnalysisToPrompt = (suggestion: string | undefined, id: string) => {
        if (!suggestion) return
        setSystemPrompt(prev => prev + '\n\n' + suggestion)
        setActiveTab('prompt')
        // Automatically save new prompt
        setTimeout(() => {
            handleSaveSettings()
            // Mark as applied in UI (would need an API route in production, simulating here for UI snappiness)
            setDocs(docs.map(d => d.id === id ? { ...d, applied: true } : d))
        }, 100)
    }

    // --- SIMULATOR LOGIC ---

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSimulating) return

        const userMsg = newMessage.trim()
        setNewMessage('')

        const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMsg }]
        setChatHistory(updatedHistory)
        setIsSimulating(true)

        try {
            const res = await fetch('/api/training/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: updatedHistory.slice(-10) // Only send last 10 messages for context window
                })
            })

            const data = await res.json()

            if (res.ok && data.reply) {
                setChatHistory([...updatedHistory, { role: 'assistant', content: data.reply }])
            } else {
                setChatHistory([...updatedHistory, { role: 'assistant', content: '⚠️ Simulation Error: ' + (data.error || 'Failed to get bot reply.') }])
            }
        } catch (err) {
            setChatHistory([...updatedHistory, { role: 'assistant', content: '⚠️ Network Error: Could not reach simulator API.' }])
        }
        setIsSimulating(false)
    }

    const resetChat = () => {
        setChatHistory([{ role: 'assistant', content: 'Hi there! Chat history cleared. How can I help you?' }])
    }

    const quickTest = (msg: string) => {
        setNewMessage(msg)
        // Note: setting state is async, we can't reliably trigger submit right after in this simple pattern.
        // User will have to click send.
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-3">
                        <BrainCircuit className="text-purple-500 w-8 h-8" />
                        AI TRAINING STUDIO
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configure bot persona, analyze past chats, and test live.</p>
                </div>

                <div className="flex bg-[#0d1117] rounded-lg p-1 border border-gray-800">
                    <button
                        onClick={() => setActiveTab('prompt')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'prompt' ? 'bg-[#1a212e] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Config
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-[#1a212e] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Learn
                    </button>
                    <button
                        onClick={() => setActiveTab('simulate')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'simulate' ? 'bg-[#1a212e] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Test
                    </button>
                </div>
            </div>

            {/* TAB 1: SYSTEM PROMPT & CONFIG */}
            {activeTab === 'prompt' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-gray-800 bg-[#0a0a0c] flex justify-between items-center">
                                <h2 className="font-semibold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    System Prompt & Persona
                                </h2>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors uppercase tracking-wider"
                                >
                                    {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saving ? 'Saving...' : saved ? 'Saved' : 'Save Config'}
                                </button>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Instructions for the AI to follow in every conversation
                                </label>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    rows={18}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-colors font-mono leading-relaxed"
                                    placeholder="You are an expert sales assistant for Bajaj Finance..."
                                />

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSystemPrompt("You are Bajaj Bot, a highly persuasive and professional sales agent helping users get loan approvals.\n\nRULES:\n1. Always ask for mobile number first.\n2. Verify their name.\n3. Check loan eligibility.\n4. Be polite but pushy.")}
                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded text-gray-300 transition-colors"
                                    >
                                        Template: Default Sales
                                    </button>
                                    <button
                                        onClick={() => setSystemPrompt("You are Bajaj Bot Support. Your primary goal is to help users resolve issues regarding their processing applications. Be empathetic, use Hinglish, and provide clear step-by-step instructions. Do NOT make up OTP processes.")}
                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded text-gray-300 transition-colors"
                                    >
                                        Template: Support Only
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                                <h2 className="font-semibold text-white flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-purple-500" />
                                    Voice Configuration
                                </h2>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-white mb-1">Enable Voice Processing</div>
                                    <div className="text-xs text-gray-500">Allow bot to listen to voice notes</div>
                                </div>
                                <button
                                    onClick={() => setUseVoice(!useVoice)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useVoice ? 'bg-green-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useVoice ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                                <h2 className="font-semibold text-white flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-cyan-500" />
                                    Website Crawling
                                </h2>
                            </div>
                            <div className="p-6">
                                <label className="block textText-xs font-medium text-gray-400 mb-2">
                                    URLs to scrape (One per line)
                                </label>
                                <textarea
                                    value={knowledgeUrls}
                                    onChange={(e) => setKnowledgeUrls(e.target.value)}
                                    rows={5}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="https://bajajfinserv.in/..."
                                />
                                <button className="mt-4 w-full py-2 bg-[#1a212e] hover:bg-[#252f40] text-gray-300 text-xs font-medium rounded transition-colors" onClick={handleSaveSettings}>
                                    Save Base Config
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: UPLOAD & LEARN */}
            {activeTab === 'upload' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-orange-500" />
                                Train with Messenger Chat Screenshots
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Upload screenshots of bad AI conversations to analyze and automatically improve the prompt.</p>
                        </div>
                        <div className="p-8">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, application/pdf"
                                multiple
                                onChange={onFileSelect}
                            />

                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${isDragging ? 'border-orange-500 bg-orange-500/10' :
                                        uploading ? 'border-gray-600 bg-[#0a0a0c] cursor-not-allowed' :
                                            'border-gray-700 hover:border-gray-500 hover:bg-[#121820] cursor-pointer'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                                        <div className="font-medium text-white mb-2">Analyzing Document with AI...</div>
                                        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                                            <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400 group-hover:text-white transition-colors">
                                            <UploadCloud className="w-8 h-8" />
                                        </div>
                                        <div className="font-medium text-white text-lg mb-1">Drag & Drop visual context</div>
                                        <div className="text-sm text-gray-500">Supports PNG, JPG, and PDFs up to 5MB</div>
                                        <div className="mt-6 px-4 py-2 bg-gray-800 rounded-md text-sm font-medium text-white hover:bg-gray-700 transition-colors">Browse Files</div>
                                    </>
                                )}
                            </div>

                            {uploadError && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> {uploadError}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-white px-2">Knowledge Base History ({docs.length})</h3>
                        {docs.length === 0 ? (
                            <div className="p-8 text-center bg-[#0d1117] border border-gray-800 rounded-xl text-gray-500 text-sm">
                                No training documents uploaded yet. Upload a screenshot to begin analysis.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {docs.map((doc) => (
                                    <div key={doc.id} className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors flex flex-col">
                                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c] flex items-center justify-between">
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                {doc.file_type === 'application/pdf' ? <FileText className="w-5 h-5 text-red-400 shrink-0" /> : <UploadCloud className="w-5 h-5 text-blue-400 shrink-0" />}
                                                <div className="truncate">
                                                    <div className="font-medium text-sm text-white truncate">{doc.file_name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{new Date(doc.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDoc(doc.id)} className="text-gray-500 hover:text-red-500 bg-gray-800 hover:bg-red-500/10 p-1.5 rounded-md transition-colors shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            {doc.analysis?.error ? (
                                                <div className="text-sm text-red-400 p-2 bg-red-500/10 rounded border border-red-500/20">{doc.analysis.error}</div>
                                            ) : (
                                                <div className="space-y-3 flex-1">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Detected Issue / State</span>
                                                        <div className="text-sm text-orange-400 font-medium bg-orange-500/10 inline-block px-2 py-0.5 rounded border border-orange-500/20">
                                                            {doc.analysis?.state || 'General Context'}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-800">
                                                        <div className="bg-[#030305] rounded border border-gray-800 p-2">
                                                            <span className="text-[10px] font-bold text-gray-600 block mb-1">USER SAID</span>
                                                            <span className="text-xs text-blue-300 italic">"{doc.analysis?.customerMessage || 'N/A'}"</span>
                                                        </div>
                                                        <div className="bg-[#030305] rounded border border-gray-800 p-2">
                                                            <span className="text-[10px] font-bold text-gray-600 block mb-1">BOT PRODUCED</span>
                                                            <span className="text-xs text-red-300 italic">"{doc.analysis?.botMessage || 'N/A'}"</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Suggested System Prompt Patch</span>
                                                        <div className="text-xs text-gray-300 font-mono bg-[#030305] p-2 rounded border border-gray-800 whitespace-pre-wrap">
                                                            {doc.analysis?.suggestedPromptUpdate || 'No patch suggested.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-gray-800">
                                                {doc.applied ? (
                                                    <div className="flex items-center justify-center gap-2 py-2 text-green-500 text-sm font-medium w-full bg-green-500/5 rounded-lg border border-green-500/10">
                                                        <CheckCircle2 className="w-4 h-4" /> Applied to System Prompt
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => applyAnalysisToPrompt(doc.analysis?.suggestedPromptUpdate, doc.id)}
                                                        disabled={!doc.analysis?.suggestedPromptUpdate}
                                                        className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        <ArrowRight className="w-4 h-4" /> Append to System Prompt
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: SIMULATOR */}
            {activeTab === 'simulate' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-left-4 h-[600px]">
                    <div className="lg:col-span-3 bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-white text-sm">Test Chat Simulator</h2>
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                                        Claude-3-Haiku
                                    </p>
                                </div>
                            </div>
                            <button onClick={resetChat} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 bg-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors">
                                <RefreshCw className="w-3 h-3" /> Clear History
                            </button>
                        </div>

                        {/* Chat History Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0a0a0c] to-[#0d1117]">
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-gray-800/80 text-gray-200 border border-gray-700 rounded-tl-none whitespace-pre-wrap shadow-inner'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isSimulating && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-800/80 border border-gray-700 rounded-tl-none flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-800 bg-[#0a0a0c]">
                            <form onSubmit={handleSendMessage} className="flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message to test the bot..."
                                    className="flex-1 bg-[#030305] border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-colors"
                                    disabled={isSimulating}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSimulating}
                                    className="px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                >
                                    {isSimulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5 shadow-lg h-fit">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Tests</h3>
                        <div className="space-y-3">
                            <button onClick={() => quickTest("bajaj card chahiye")} className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0a0a0c] hover:border-gray-600 hover:bg-[#121820] transition-colors text-sm text-gray-300">
                                <span className="block text-white font-medium mb-1">Normal flow</span>
                                "bajaj card chahiye"
                            </button>
                            <button onClick={() => quickTest("12345")} className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0a0a0c] hover:border-gray-600 hover:bg-[#121820] transition-colors text-sm text-gray-300">
                                <span className="block text-white font-medium mb-1">OTP wrong/format error</span>
                                "12345"
                            </button>
                            <button onClick={() => quickTest("Mera loan reject ho gaya, kya problem hai?")} className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0a0a0c] hover:border-gray-600 hover:bg-[#121820] transition-colors text-sm text-gray-300">
                                <span className="block text-white font-medium mb-1">Rejected Scenario</span>
                                "Mera loan reject ho gaya..."
                            </button>
                            <button onClick={() => quickTest("Abhi tak processing hi dikha raha hai, kitna time? ")} className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0a0a0c] hover:border-gray-600 hover:bg-[#121820] transition-colors text-sm text-gray-300">
                                <span className="block text-white font-medium mb-1">Stuck in Processing</span>
                                "Abhi tak processing hi dikha raha..."
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
