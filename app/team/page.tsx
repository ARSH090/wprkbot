'use client'

import { useState } from 'react'
import { Users, UserPlus, Shield, Mail, MoreVertical } from 'lucide-react'

const dummyTeam = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@bajajbot.com', role: 'Admin', status: 'Active', joined: 'Oct 24, 2025' },
    { id: 2, name: 'Priya Patel', email: 'priya@bajajbot.com', role: 'Sales Agent', status: 'Active', joined: 'Nov 02, 2025' },
    { id: 3, name: 'Amit Kumar', email: 'amit@bajajbot.com', role: 'Sales Agent', status: 'Offline', joined: 'Nov 15, 2025' },
]

export default function Team() {
    const [team] = useState(dummyTeam)

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest">TEAM MANAGEMENT</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage agent access, roles, and view performance.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors uppercase tracking-wider">
                    <UserPlus className="w-5 h-5" />
                    Invite Agent
                </button>
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-blue-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Total Agents</div>
                        <div className="text-2xl font-bold text-white">3</div>
                    </div>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-green-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Active Now</div>
                        <div className="text-2xl font-bold text-white">2</div>
                    </div>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-purple-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Invites Pending</div>
                        <div className="text-2xl font-bold text-white">0</div>
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
                                <th className="px-6 py-4 font-medium border-b border-gray-800">User</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Role</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Status</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800">Joined</th>
                                <th className="px-6 py-4 font-medium border-b border-gray-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map((member) => (
                                <tr key={member.id} className="border-b border-gray-800 hover:bg-[#121820] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                                                {member.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{member.name}</div>
                                                <div className="text-xs text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${member.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                            {member.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{member.joined}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}
