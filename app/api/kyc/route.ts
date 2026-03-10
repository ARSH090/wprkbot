import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: leads, error, count } = await supabaseServer
            .from('leads')
            .select('id, name:full_name, secondary_name, mobile, secondary_mobile, kyc_completed_at, attempt_count, screenshot_url, created_at, status', { count: 'exact' })
            .eq('status', 'kyc_completed')
            .order('kyc_completed_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        // For stats, we need all kyc completed leads
        const { data: allKyc, error: statError } = await supabaseServer
            .from('leads')
            .select('kyc_completed_at')
            .eq('status', 'kyc_completed')

        if (statError) throw statError

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        let kycToday = 0
        let kycWeek = 0
        let kycMonth = 0

        allKyc.forEach(l => {
            if (!l.kyc_completed_at) return
            const d = new Date(l.kyc_completed_at)
            if (l.kyc_completed_at.startsWith(today)) kycToday++
            if (d >= oneWeekAgo) kycWeek++
            if (d >= firstDayOfMonth) kycMonth++
        })

        // Format names as per the DB structure (name is mapped to full_name or name)
        // I will just return the raw data and let the frontend format it
        return NextResponse.json({
            leads,
            stats: {
                today: kycToday,
                this_week: kycWeek,
                this_month: kycMonth,
                total: count || 0
            },
            total: count || 0,
            page,
            limit
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
