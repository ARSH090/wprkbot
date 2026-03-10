import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { data: lead, error } = await supabaseServer
            .from('leads')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) throw error

        let parsedHistory = []
        if (lead.conversation_history) {
            try {
                parsedHistory = JSON.parse(lead.conversation_history)
            } catch (e) {
                // If it's already a valid array/object or invalid JSON, keep as is
                parsedHistory = Array.isArray(lead.conversation_history) ? lead.conversation_history : []
            }
        }

        return NextResponse.json({
            ...lead,
            conversation_history: parsedHistory
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
