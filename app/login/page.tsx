'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, AlertCircle } from 'lucide-react'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password
        })

        if (!res?.error) {
            router.push('/dashboard')
            router.refresh()
        } else {
            setError('Invalid email or password')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4 font-sans text-gray-200">
            <div className="w-full max-w-md bg-[#0d1117] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-wider text-white">BAJAJ BOT</h1>
                        <p className="text-sm text-gray-500 mt-2">Sign in to access the dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500 text-sm font-medium">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1">Email</label>
                            <div className="relative text-gray-400 focus-within:text-white transition-colors">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1">Password</label>
                            <div className="relative text-gray-400 focus-within:text-white transition-colors">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold tracking-wide transition-all mt-4 flex justify-center items-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'SIGN IN'}
                        </button>
                    </form>
                </div>
                <div className="p-4 bg-[#0a0a0c] border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-600">Secure AI Admin Portal</p>
                </div>
            </div>
        </div>
    )
}
