import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data, error } = await supabase
        .from('bot_settings')
        .select('*')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    try {
        const settings = await request.json()
        // settings is expected to be an object: { system_prompt: '...', use_voice: 'true', etc }

        for (const [key, value] of Object.entries(settings)) {
            await supabase
                .from('bot_settings')
                .update({ value: String(value) })
                .eq('key', key)
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
