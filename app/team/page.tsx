'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, UserPlus, Shield, Mail, Trash2, XCircle, AlertTriangle, Send, CheckCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TeamMember {
    id: string;
    email: string;
    full_name: string;
    role: string;
    invited_by: string | null;
    invite_accepted: boolean;
    created_at: string;
}

export default function Team() {
    const { data: session } = useSession()

    // In a real app we would decode from JWT or fetch user details, 
    // relying on DB fetch inside fetchTeam for exact permissions.
    // Assuming UI optimistically checks admin role if needed
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserRole, setCurrentUserRole] = useState<string>('viewer')
    const currentUserEmail = session?.user?.email

    // Modal state
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [newRole, setNewRole] = useState('viewer')
    const [submitting, setSubmitting] = useState(false)
    const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        if (session) {
            fetchTeam()
        }
    }, [session])

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/team')
            if (res.ok) {
                const data = await res.json()
                setTeam(data || [])

                // Set current user role based on DB data
                if (currentUserEmail) {
                    const me = data.find((m: TeamMember) => m.email === currentUserEmail)
                    if (me) setCurrentUserRole(me.role)
                }
            }
        } catch (e) {
            console.error('Failed to fetch team')
        }
        setLoading(false)
    }

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ message, type })
        setTimeout(() => setToastMessage(null), 3000)
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, role: newRole })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                showToast(`Invite sent to ${newEmail}`)
                setInviteModalOpen(false)
                setNewEmail('')
                setNewRole('viewer')
                fetchTeam()
            } else {
                showToast(data.error || 'Failed to send invite', 'error')
            }
        } catch (err) {
            showToast('An error occurred while inviting the agent.', 'error')
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to remove ${email}?`)) return

        try {
            const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok && data.success) {
                showToast('Agent removed from team')
                fetchTeam()
            } else {
                showToast(data.error || 'Failed to remove agent', 'error')
            }
        } catch (err) {
            showToast('Failed to remove agent', 'error')
        }
    }

    const handleRoleChange = async (id: string, newRole: string) => {
        try {
            const res = await fetch(`/api/team/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            })
            if (res.ok) {
                showToast('Role updated successfully')
                fetchTeam() // Refresh list
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to update role', 'error')
            }
        } catch (e) {
            showToast('Failed to update role', 'error')
        }
    }

    const handleResendInvite = async (id: string, email: string) => {
        try {
            const res = await fetch('/api/team/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: id })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                showToast(`Invite resent to ${email}`)
            } else {
                showToast(data.error || 'Failed to resend invite', 'error')
            }
        } catch (e) {
            showToast('Failed to resend invite', 'error')
        }
    }

    const isAdmin = currentUserRole === 'admin';
    const activeMembers = team.filter(m => m.invite_accepted)
    const pendingMembers = team.filter(m => !m.invite_accepted)
    const adminsCount = team.filter(m => m.role === 'admin').length
    const operatorsCount = team.filter(m => m.role === 'operator').length

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {toastMessage && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl z-50 text-white font-medium flex items-center gap-3 animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toastMessage.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toastMessage.message}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest">TEAM MANAGEMENT</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage agent access, roles, and pending invitations.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setInviteModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors uppercase tracking-wider disabled:opacity-50"
                        disabled={team.length >= 5}
                    >
                        <UserPlus className="w-5 h-5" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0d1117] p-5 rounded-xl border border-gray-800">
                    <div className="text-sm text-gray-500 font-medium mb-1">Total Members</div>
                    <div className="text-3xl font-bold text-white flex items-center gap-2">
                        {team.length} <span className="text-sm font-normal text-gray-600">/ 5</span>
                    </div>
                </div>
                <div className="bg-[#0d1117] p-5 rounded-xl border border-gray-800">
                    <div className="text-sm text-gray-500 font-medium mb-1">Admins</div>
                    <div className="text-3xl font-bold text-purple-400">{adminsCount}</div>
                </div>
                <div className="bg-[#0d1117] p-5 rounded-xl border border-gray-800">
                    <div className="text-sm text-gray-500 font-medium mb-1">Operators</div>
                    <div className="text-3xl font-bold text-blue-400">{operatorsCount}</div>
                </div>
                <div className="bg-[#0d1117] p-5 rounded-xl border border-gray-800 border-dashed">
                    <div className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-2">
                        {team.length >= 5 ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : null}
                        Available Slots
                    </div>
                    <div className={`text-3xl font-bold ${team.length >= 5 ? 'text-orange-500' : 'text-green-400'}`}>
                        {Math.max(0, 5 - team.length)}
                    </div>
                </div>
            </div>

            {/* Current Members */}
            <div className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 bg-[#0a0a0c] flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-white">Current Members</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-500 bg-[#0a0a0c] uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">User</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Role</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Status</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Joined</th>
                                {isAdmin && <th className="px-6 py-4 font-medium border-b border-gray-800 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            Loading team data...
                                        </div>
                                    </td>
                                </tr>
                            ) : team.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No members found in database</td>
                                </tr>
                            ) : team.map((member) => (
                                <tr key={member.id} className="border-b border-gray-800 hover:bg-[#121820] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold shadow-md">
                                                {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white flex items-center gap-2">
                                                    {member.full_name || member.email.split('@')[0]}
                                                    {member.email === currentUserEmail && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest font-bold">You</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isAdmin && member.email !== currentUserEmail ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                className={`text-xs font-semibold rounded-md border px-2 py-1 outline-none transition-colors appearance-none cursor-pointer pr-6 ${member.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 w-[80px]' :
                                                    member.role === 'operator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 w-[90px]' :
                                                        'bg-gray-800 text-gray-300 border-gray-700 w-[80px]'
                                                    }`}
                                                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .5rem top 50%', backgroundSize: '.65rem auto' }}
                                            >
                                                <option value="admin" className="bg-[#0d1117] text-white">ADMIN</option>
                                                <option value="operator" className="bg-[#0d1117] text-white">OPERATOR</option>
                                                <option value="viewer" className="bg-[#0d1117] text-white">VIEWER</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-md border inline-block ${member.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                member.role === 'operator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                    'bg-gray-800 text-gray-300 border-gray-700'
                                                }`}>
                                                {member.role?.toUpperCase()}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {member.invite_accepted ? (
                                            <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                                                <div className="w-2 h-2 rounded-full bg-green-500" /> Active
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-medium">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500" /> Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {member.created_at ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true }) : 'Unknown'}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            {member.email !== currentUserEmail && (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!member.invite_accepted && (
                                                        <button
                                                            onClick={() => handleResendInvite(member.id, member.email)}
                                                            className="p-1.5 bg-[#1E293B] hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded transition-colors"
                                                            title="Resend Invite"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(member.id, member.email)}
                                                        className="p-1.5 bg-[#1E293B] hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pending Invites Section - If there are any */}
            {pendingMembers.length > 0 && (
                <div className="bg-[#0d1117] rounded-xl border border-dashed border-gray-700 p-5 mt-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Pending Invitations ({pendingMembers.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingMembers.map((member) => (
                            <div key={`pending-${member.id}`} className="flex items-center justify-between p-3 bg-[#0a0a0c] border border-gray-800 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{member.email}</span>
                                    <span className="text-xs text-gray-500">Invited by: {member.invited_by || 'Admin'} • {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 text-[10px] font-semibold rounded bg-gray-800 text-gray-400 border border-gray-700 uppercase">
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {inviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => !submitting && setInviteModalOpen(false)}>
                    <div className="bg-[#0d1117] border border-gray-800 rounded-xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0c]">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-500" /> Invite New Member
                            </h2>
                            <button disabled={submitting} onClick={() => setInviteModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                                    placeholder="colleague@company.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Team Role</label>
                                <select
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value)}
                                    className="w-full bg-[#030305] border border-gray-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer font-medium"
                                >
                                    <option value="admin">Admin — Full System Access</option>
                                    <option value="operator">Operator — Manage Leads & Automation</option>
                                    <option value="viewer">Viewer — Read Only Dashboard</option>
                                </select>
                            </div>

                            {/* Role Helper Text */}
                            <div className="bg-[#0a0a0c] border border-gray-800 rounded-lg p-4 text-xs text-gray-400 space-y-2">
                                <div className={`${newRole === 'admin' ? 'text-purple-400' : ''}`}>
                                    <strong className="block text-white mb-0.5">Admin</strong>
                                    Can change all settings, prompts, connect API integrations, and manage the team.
                                </div>
                                <div className={`${newRole === 'operator' ? 'text-blue-400' : ''}`}>
                                    <strong className="block text-white mb-0.5 mt-2">Operator</strong>
                                    Can view leads and retry failed applications. Cannot change bot settings.
                                </div>
                                <div className={`${newRole === 'viewer' ? 'text-gray-300' : ''}`}>
                                    <strong className="block text-white mb-0.5 mt-2">Viewer</strong>
                                    Read-only access to dashboard statistics and leads.
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending Invite...</>
                                    ) : (
                                        'Send Invitation via Email'
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-gray-500 mt-3">An email will be sent automatically via Supabase Auth</p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
