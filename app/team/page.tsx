'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, UserPlus, Shield, Mail, Trash2, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Team() {
    const { data: session } = useSession()
    const isAdmin = (session?.user as any)?.role === 'admin'
    const currentUserEmail = session?.user?.email

    const [team, setTeam] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newRole, setNewRole] = useState('viewer')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchTeam()
    }, [])

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/team')
            if (res.ok) {
                const data = await res.json()
                setTeam(data)
            }
        } catch (e) {
            console.error('Failed to fetch team')
        }
        setLoading(false)
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
            })
            if (res.ok) {
                alert('Agent invited successfully')
                setInviteModalOpen(false)
                setNewEmail('')
                setNewPassword('')
                setNewRole('viewer')
                fetchTeam()
            } else {
                const data = await res.json()
                alert(`Error: ${data.error}`)
            }
        } catch (err) {
            alert('An error occurred while inviting the agent.')
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to remove ${email}?`)) return

        try {
            const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
            if (res.ok) {
                alert('Agent removed')
                fetchTeam()
            } else {
                const data = await res.json()
                alert(`Error: ${data.error}`)
            }
        } catch (err) {
            alert('Failed to remove agent')
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest">TEAM MANAGEMENT</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage agent access, roles, and view performance.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setInviteModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors uppercase tracking-wider"
                    >
                        <UserPlus className="w-5 h-5" />
                        Invite Agent
                    </button>
                )}
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-blue-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Total Agents</div>
                        <div className="text-2xl font-bold text-white">{team.length}</div>
                    </div>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-green-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Admins</div>
                        <div className="text-2xl font-bold text-white">{team.filter(t => t.role === 'admin').length}</div>
                    </div>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-[#0a0a0c]">
                    <h2 className="font-semibold text-white">Team Members</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-500 bg-[#0a0a0c] uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Email</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Role</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Status</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Joined</th>
                                {isAdmin && <th className="px-6 py-4 font-medium border-b border-gray-800 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading team...</td>
                                </tr>
                            ) : team.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No agents found</td>
                                </tr>
                            ) : team.map((member) => (
                                <tr key={member.id} className="border-b border-gray-800 hover:bg-[#121820] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                                                {member.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white flex items-center gap-2">
                                                    {member.email}
                                                    {member.email === currentUserEmail && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">YOU</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${member.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                                            {member.role?.toUpperCase() || 'VIEWER'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-green-500 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                            Active
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {member.created_at ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true }) : ''}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            {member.email !== currentUserEmail && (
                                                <button
                                                    onClick={() => handleDelete(member.id, member.email)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Remove Agent"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {inviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !submitting && setInviteModalOpen(false)}>
                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl w-full max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0c]">
                            <h2 className="font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-500" /> Invite Agent</h2>
                            <button disabled={submitting} onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-white"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="agent@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Temporary Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Role</label>
                                <select
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
                                >
                                    {submitting ? 'Sending...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
