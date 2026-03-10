import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { leadId: string } }) {
    try {
        const { data, error } = await supabaseServer
            .from('automation_logs')
            .select('*')
            .eq('lead_id', params.leadId)
            .order('created_at', { ascending: true })

        if (error) throw error

        return NextResponse.json(data || [])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
