import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('bot_settings')
            .select('key, value')

        if (error) throw error

        // Convert array to object
        const settings: { [key: string]: string } = {}
        data?.forEach(item => {
            // Never return fb_page_access_token (security)
            if (item.key !== 'fb_page_access_token') {
                settings[item.key] = item.value
            }
        })

        return NextResponse.json(settings)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        let settingsToUpdate: { [key: string]: string } = {}

        if (body.key && typeof body.value !== 'undefined') {
            // Single key-value update
            settingsToUpdate[body.key] = String(body.value)
        } else if (body.settings && typeof body.settings === 'object') {
            // Bulk update
            settingsToUpdate = body.settings
        } else {
            return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 })
        }

        // UPSERT into bot_settings table (ON CONFLICT key DO UPDATE)
        const updates = Object.entries(settingsToUpdate).map(([key, value]) => ({
            key,
            value,
            updated_at: new Date().toISOString()
        }))

        for (const update of updates) {
            const { error: upsertError } = await supabaseServer
                .from('bot_settings')
                .upsert(update, { onConflict: 'key' })

            if (upsertError) throw upsertError
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
