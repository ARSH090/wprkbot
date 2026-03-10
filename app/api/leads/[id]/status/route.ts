import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const { status } = body

        if (!status || !['failed', 'new', 'processing'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Fetch lead messenger id for log
        const { data: lead, error: fetchError } = await supabaseServer
            .from('leads')
            .select('messenger_id')
            .eq('id', params.id)
            .single()

        if (fetchError) throw fetchError

        const { error: updateError } = await supabaseServer
            .from('leads')
            .update({ status })
            .eq('id', params.id)

        if (updateError) throw updateError

        // Log manual status change
        await supabaseServer.from('automation_logs').insert({
            lead_id: parseInt(params.id),
            lead_messenger_id: lead.messenger_id,
            step: 'manual_status_change',
            status: 'info',
            message: `Admin manually updated status to ${status}`
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
