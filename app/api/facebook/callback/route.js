import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=NoCodeProvided`);
        }

        // 1. Exchange code for user access token
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;

        const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
        tokenUrl.searchParams.append('client_id', appId);
        tokenUrl.searchParams.append('client_secret', appSecret);
        tokenUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL || ''}/api/facebook/callback`);
        tokenUrl.searchParams.append('code', code);

        const tokenRes = await fetch(tokenUrl.toString());
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Facebook token exchange error:", tokenData.error);
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=${encodeURIComponent(tokenData.error.message)}`);
        }

        const shortLivedToken = tokenData.access_token;

        // 2. Get long-lived user token
        const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
        longLivedUrl.searchParams.append('grant_type', 'fb_exchange_token');
        longLivedUrl.searchParams.append('client_id', appId);
        longLivedUrl.searchParams.append('client_secret', appSecret);
        longLivedUrl.searchParams.append('fb_exchange_token', shortLivedToken);

        const longLivedRes = await fetch(longLivedUrl.toString());
        const longLivedData = await longLivedRes.json();

        if (longLivedData.error) {
            console.error("Facebook long-lived token exchange error:", longLivedData.error);
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=${encodeURIComponent(longLivedData.error.message)}`);
        }

        const userToken = longLivedData.access_token;

        // 3. Get list of pages with their tokens
        const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/accounts');
        pagesUrl.searchParams.append('access_token', userToken);

        const pagesRes = await fetch(pagesUrl.toString());
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            console.error("Facebook get pages error:", pagesData.error);
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=${encodeURIComponent(pagesData.error.message)}`);
        }

        const encodedPages = encodeURIComponent(JSON.stringify(pagesData.data || []));

        // Redirect back to connection wizard with pages data
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?pages=${encodedPages}`);

    } catch (error) {
        console.error('Facebook OAuth callback error:', error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connect?error=SystemError`);
    }
}
