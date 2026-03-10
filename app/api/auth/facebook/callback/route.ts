import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    // Construct redirect URI based on NEXTAUTH_URL
    const redirectUri = `${process.env.NEXTAUTH_URL || ''}/api/auth/facebook/callback`

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=no_code`)
    }

    try {
        // 1. Exchange code for short-lived user token
        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`)
        const tokenData = await tokenRes.json()

        if (tokenData.error || !tokenData.access_token) {
            console.error('Meta OAuth Token Error:', tokenData.error)
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=token_exchange_failed`)
        }

        const shortLivedToken = tokenData.access_token

        // 2. Exchange short-lived token for long-lived user token
        const longLivedRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`)
        const longLivedData = await longLivedRes.json()
        const longLivedToken = longLivedData.access_token || shortLivedToken

        // 3. Get user's pages and their access tokens
        const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`)
        const pagesData = await pagesRes.json()

        if (!pagesData.data || pagesData.data.length === 0) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=no_pages_found`)
        }

        // For simplicity, we just use the first page's access token and name
        const page = pagesData.data[0]
        const pageAccessToken = page.access_token
        const pageName = page.name

        // 4. Save Page Access Token and Page Name to Supabase bot_settings
        await supabase.from('bot_settings').upsert([
            { key: 'fb_page_access_token', value: pageAccessToken },
            { key: 'fb_page_name', value: pageName }
        ], { onConflict: 'key' })

        // Redirect back to connection page with success
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?success=true`)
    } catch (err) {
        console.error('FB Callback Error:', err)
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=system_error`)
    }
}
