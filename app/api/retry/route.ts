import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { messenger_id } = await request.json()

    if (!messenger_id) {
      return NextResponse.json({ error: 'messenger_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ job_status: 'queued' })
      .eq('messenger_id', messenger_id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Call n8n webhook (fire-and-forget or await depending on requirements)
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      try {
        await fetch(`${n8nUrl}/webhook/retry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messenger_id }),
        })
      } catch (err) {
        console.error('Failed to notify n8n', err)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
