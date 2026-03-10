import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const from = (page - 1) * limit
        const to = from + limit - 1

        // Fetch all leads query
        let query = supabaseServer
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (status && status !== 'All' && status !== 'all') {
            if (status === 'all_failed') {
                query = query.in('status', ['failed', 'permanently_failed'])
            } else {
                query = query.eq('status', status.toLowerCase())
            }
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,full_name.ilike.%${search}%,mobile.ilike.%${search}%,messenger_id.ilike.%${search}%`)
        }

        query = query.range(from, to)
        const { data: leads, error, count } = await query

        if (error) throw error

        // Mask PAN and Aadhaar
        const maskedLeads = leads?.map(lead => {
            const maskedPan = lead.pan ? lead.pan.substring(0, 5) + '****' + lead.pan.substring(9) : null;
            const maskedAadhaar = lead.aadhaar ? lead.aadhaar.substring(0, 4) + '********' : null;
            const secMaskedPan = lead.secondary_pan ? lead.secondary_pan.substring(0, 5) + '****' + lead.secondary_pan.substring(9) : null;

            return {
                ...lead,
                pan: maskedPan,
                aadhaar: maskedAadhaar,
                secondary_pan: secMaskedPan
            }
        });

        return NextResponse.json({
            leads: maskedLeads,
            total: count || 0,
            page,
            limit
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
