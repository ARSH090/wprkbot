'use client'

import { Facebook, Instagram, MessageSquare, Plus, ExternalLink, CheckCircle } from 'lucide-react'

export default function Connect() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-widest">MESSENGER CONNECT</h1>
                <p className="text-sm text-gray-500 mt-1">Connect your social accounts to enable the AI auto-responder.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Facebook */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors">
                    <div className="p-6 text-center border-b border-gray-800">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Facebook className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Facebook Pages</h2>
                        <p className="text-sm text-gray-400 mt-1">Connect to auto-reply to Facebook Page messages and comments.</p>
                    </div>
                    <div className="p-6 bg-[#0a0a0c] flex flex-col items-center justify-center">
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <Plus className="w-5 h-5" /> Connect Facebook
                        </button>
                        <a href="#" className="text-xs text-blue-400 mt-4 flex items-center gap-1 hover:underline">
                            View integration guide <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Instagram */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden hover:border-pink-500/50 transition-colors">
                    <div className="p-6 text-center border-b border-gray-800 relative">
                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3 h-3" /> Connected
                        </div>
                        <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Instagram className="w-8 h-8 text-pink-500" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Instagram DMs</h2>
                        <p className="text-sm text-gray-400 mt-1">Auto-reply to Instagram Direct Messages and Story Mentions.</p>
                    </div>
                    <div className="p-6 bg-[#0a0a0c]">
                        <div className="bg-[#030305] border border-green-500/30 rounded-lg p-4 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold">B</div>
                                <div>
                                    <div className="font-medium text-white text-sm">@bajajfin_official</div>
                                    <div className="text-xs text-green-500">Active and listening</div>
                                </div>
                            </div>
                            <button className="text-xs text-red-500 hover:underline">Disconnect</button>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                            <Plus className="w-4 h-4" /> Add another account
                        </button>
                    </div>
                </div>

                {/* WhatsApp */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition-colors sm:col-span-2">
                    <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                            <MessageSquare className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-lg font-bold text-white">WhatsApp Business API</h2>
                            <p className="text-sm text-gray-400 mt-1">Connect to WhatsApp Business via Meta Cloud API for massive outreach.</p>
                        </div>
                        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap">
                            Connect WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
