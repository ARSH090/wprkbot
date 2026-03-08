'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BrainCircuit, Save, UploadCloud, Link as LinkIcon, FileText, CheckCircle2, XCircle } from 'lucide-react'

export default function Training() {
    const [systemPrompt, setSystemPrompt] = useState('')
    const [useVoice, setUseVoice] = useState(false)
    const [knowledgeUrls, setKnowledgeUrls] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

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

    const handleSave = async () => {
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-3">
                        <BrainCircuit className="text-green-500 w-8 h-8" />
                        AI TRAINING
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configure bot persona, instructions and knowledge sources.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors uppercase tracking-wider"
                >
                    {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Saving...' : saved ? 'Saved' : 'Save Config'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Prompting */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                System Prompt & Persona
                            </h2>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Instructions for the AI to follow in every conversation
                            </label>
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                rows={12}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors font-mono leading-relaxed"
                                placeholder="You are an expert sales assistant for Bajaj Finance..."
                            />

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setSystemPrompt("You are Bajaj Bot, a highly persuasive and professional sales agent helping users get loan approvals.\\n\\nRULES:\\n1. Always ask for mobile number first.\\n2. Verify their name.\\n3. Check loan eligibility.\\n4. Be polite but pushy.")}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded text-gray-300 transition-colors"
                                >
                                    Use Default Sales Prompt
                                </button>
                                <button
                                    onClick={() => setSystemPrompt("You are Bajaj Bot Support. Your primary goal is to help users resolve issues. Be empathetic and clear in instructions.")}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded text-gray-300 transition-colors"
                                >
                                    Use Support Prompt
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-purple-500" />
                                Voice Flow Configuration
                            </h2>
                        </div>
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <div className="font-medium text-white mb-1">Enable AI Voice Responses</div>
                                <div className="text-sm text-gray-500">Allow the bot to reply with voice notes in Messenger</div>
                            </div>
                            <button
                                onClick={() => setUseVoice(!useVoice)}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${useVoice ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${useVoice ? 'translate-x-8' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Knowledge Base */}
                <div className="space-y-6">
                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <UploadCloud className="w-4 h-4 text-orange-500" />
                                Upload Documents
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/30 transition-colors">
                                <UploadCloud className="w-10 h-10 text-gray-500 mb-3" />
                                <div className="font-medium text-gray-300 mb-1">Click to upload PDFs</div>
                                <div className="text-xs text-gray-600">Max size 20MB per file</div>
                            </div>
                            <div className="mt-4 space-y-2">
                                {/* Dummy uploaded file */}
                                <div className="flex items-center justify-between p-3 bg-[#030305] rounded border border-gray-800 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <FileText className="w-4 h-4 text-red-400" /> Bajaj_Terms.pdf
                                    </div>
                                    <button className="text-gray-600 hover:text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-cyan-500" />
                                Website Crawling
                            </h2>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                URLs to scrape for knowledge (one per line)
                            </label>
                            <textarea
                                value={knowledgeUrls}
                                onChange={(e) => setKnowledgeUrls(e.target.value)}
                                rows={6}
                                className="w-full bg-[#030305] border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="https://bajajfinserv.in/loans..."
                            />
                            <button className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors">
                                Sync URLs Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
