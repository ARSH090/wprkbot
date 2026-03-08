import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params

        if (!id) {
            return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
        }

        // First fetch the lead to get the messenger_id
        const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('messenger_id')
            .eq('id', id)
            .single()

        if (leadError || !leadData?.messenger_id) {
            return NextResponse.json({ error: 'Lead or messenger_id not found' }, { status: 404 })
        }

        // Fetch the logs
        const { data: logs, error: logsError } = await supabase
            .from('automation_logs')
            .select('*')
            .eq('messenger_id', leadData.messenger_id)
            .order('created_at', { ascending: false })

        if (logsError) {
            return NextResponse.json({ error: logsError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: logs })
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
