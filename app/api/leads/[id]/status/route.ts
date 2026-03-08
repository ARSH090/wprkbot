import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = params

        if (!id) {
            return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
        }

        // Update lead status to failed
        const { data: leadData, error: updateError } = await supabase
            .from('leads')
            .update({ state: 'failed', job_status: 'failed' })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Insert log into automation_logs
        if (leadData?.messenger_id) {
            await supabase.from('automation_logs').insert({
                messenger_id: leadData.messenger_id,
                step: 'Manual Override',
                status: 'error',
                message: 'Lead marked as failed by admin via dashboard.',
            })
        }

        return NextResponse.json({ success: true, data: leadData })
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
