import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch token and page ID from DB
        const { data: settingsData, error } = await supabaseServer
            .from('bot_settings')
            .select('key, value')
            .in('key', ['fb_page_access_token', 'fb_page_id', 'admin_messenger_id']);

        if (error || !settingsData) {
            return NextResponse.json({ error: 'Failed to fetch settings from DB' }, { status: 500 });
        }

        const tokenRow = settingsData.find(s => s.key === 'fb_page_access_token');
        const pageIdRow = settingsData.find(s => s.key === 'fb_page_id');
        const adminIdRow = settingsData.find(s => s.key === 'admin_messenger_id');

        if (!adminIdRow?.value) {
            return NextResponse.json({
                success: false,
                error: 'Admin Messenger ID missing. Please go to Settings and enter your Facebook PSID to receive the test message.'
            }, { status: 400 });
        }

        const recipientId = adminIdRow.value;

        // 2. Call Facebook Graph API to send test message
        const fbUrl = `https://graph.facebook.com/v18.0/me/messages?access_token=${tokenRow.value}`;
        const fbBody = {
            recipient: {
                id: recipientId
            },
            message: {
                text: "✅ Bot connection test successful from the Dashboard!"
            },
            messaging_type: 'RESPONSE'
        };

        const fbRes = await fetch(fbUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fbBody)
        });

        const fbData = await fbRes.json();

        if (fbData.error) {
            console.error('Facebook test message error:', fbData.error);
            return NextResponse.json({ success: false, error: fbData.error.message });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Facebook test connection error:', error);
        return NextResponse.json({ success: false, error: 'SystemError' }, { status: 500 });
    }
}
