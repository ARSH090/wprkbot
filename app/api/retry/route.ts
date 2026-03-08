import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { messenger_id } = await request.json()

    if (!messenger_id) {
      return NextResponse.json({ error: 'messenger_id required' }, { status: 400 })
    }

    // Update lead status to "retrying"
    const { data: leadData, error: updateError } = await supabase
      .from('leads')
      .update({ state: 'retrying', job_status: 'retrying' })
      .eq('messenger_id', messenger_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Fetch n8n Webhook URL from bot_settings
    const { data: settings } = await supabase
      .from('bot_settings')
      .select('value')
      .eq('key', 'n8n_webhook_url')
      .single()

    // Fallback to Env variable if not in DB
    const n8nUrl = settings?.value || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'retry', lead: leadData }),
        })
      } catch (err) {
        console.error('Failed to notify n8n', err)
      }
    } else {
      console.warn('No n8n webhook URL configured')
    }

    return NextResponse.json({ success: true, data: leadData })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
