'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BrainCircuit, Settings, MessageSquare } from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'AI Training', href: '/training', icon: BrainCircuit },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Connect Messenger', href: '/connect', icon: MessageSquare },
  { name: 'Team', href: '/team', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white tracking-widest">BAJAJ BOT</h1>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 transition-colors ${isActive ? 'text-white bg-gray-800 border-r-4 border-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-6 border-t border-gray-800 text-xs text-gray-600">
        &copy; 2026 Bajaj Bot Dashboard
      </div>
    </div >
  )
}
