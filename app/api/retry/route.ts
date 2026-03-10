import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    // 1 & 2. Fetch lead from Supabase
    const { data: lead, error: fetchError } = await supabaseServer
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 3. Reset lead: status=processing, state=collecting, attempt_count stays same
    const { error: resetError } = await supabaseServer
      .from('leads')
      .update({
        status: 'processing',
        state: 'collecting'
        // attempt_count stays the same as per spec
      })
      .eq('id', leadId)

    if (resetError) throw resetError

    // 4. POST to N8N_WEBHOOK_URL env variable
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'retry',
            leadId: leadId,
            senderId: lead.messenger_id,
            lead: lead
          })
        })
      } catch (fetchErr) {
        console.error("Failed to call n8n webhook", fetchErr)
        // Continue execution even if webhook fails (or should we throw?)
      }
    }

    // 5. Insert in automation_logs
    await supabaseServer.from('automation_logs').insert({
      lead_id: parseInt(leadId),
      lead_messenger_id: lead.messenger_id,
      step: 'manual_retry',
      status: 'info',
      message: 'Manual retry triggered from dashboard'
    })

    return NextResponse.json({ success: true, message: 'Retry triggered' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
