import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data: leads, error } = await supabaseServer
            .from('leads')
            .select('status, kyc_completed_at, created_at')

        if (error) throw error

        const total_leads = leads.length
        const processing = leads.filter(l => l.status === 'processing').length
        const automating = leads.filter(l => l.status === 'automating').length
        const failed = leads.filter(l => l.status === 'failed' || l.status === 'permanently_failed').length
        const kyc_completed = leads.filter(l => l.status === 'kyc_completed').length

        const today = new Date().toISOString().split('T')[0]

        const leads_today = leads.filter(l => l.created_at && l.created_at.startsWith(today)).length
        const kyc_today = leads.filter(l => l.status === 'kyc_completed' && l.kyc_completed_at && l.kyc_completed_at.startsWith(today)).length

        // Calculate this week / this month
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const kyc_this_week = leads.filter(l => l.status === 'kyc_completed' && l.kyc_completed_at && new Date(l.kyc_completed_at) >= oneWeekAgo).length
        const kyc_this_month = leads.filter(l => l.status === 'kyc_completed' && l.kyc_completed_at && new Date(l.kyc_completed_at) >= firstDayOfMonth).length

        return NextResponse.json({
            total_leads,
            leads_today,
            kyc_completed,
            kyc_today,
            kyc_this_week,
            kyc_this_month,
            failed,
            processing,
            automating
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
