import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    try {
        const { id } = params

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        // Prevent deleting yourself
        if (id === (session.user as any).id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
