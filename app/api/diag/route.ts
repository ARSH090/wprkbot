import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const results: any = {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        supabase_service_key: process.env.SUPABASE_SERVICE_KEY ? "Set" : "Missing",
        nextauth_secret: process.env.NEXTAUTH_SECRET ? "Set" : "Missing",
        nextauth_url: process.env.NEXTAUTH_URL || "Not set (local fallback used)",
    }

    try {
        const { data: users, error } = await supabaseServer
            .from('admin_users')
            .select('email, role')
            .limit(5)

        if (error) {
            results.db_error = error.message
        } else {
            results.db_status = "Connected"
            results.users_found = users?.length || 0
            results.admin_exists = users?.some(u => u.email === 'admin@bajaj.com') ? "Yes" : "No"
            results.user_list = users?.map(u => u.email)
        }
    } catch (err: any) {
        results.exception = err.message
    }

    return NextResponse.json(results)
}
