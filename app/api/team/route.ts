import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    // Check if user is logged in and is an Admin
    if (!session?.user || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    try {
        const { email, password, role } = await request.json()

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10)

        const { data, error } = await supabase
            .from('admin_users')
            .insert({ email, password_hash, role })
            .select('id, email, role, created_at')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
