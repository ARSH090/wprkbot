import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { pageId, pageAccessToken, pageName } = await request.json();

        if (!pageId || !pageAccessToken || !pageName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const settingsToSave = [
            { key: 'fb_page_access_token', value: pageAccessToken },
            { key: 'fb_page_id', value: pageId },
            { key: 'fb_page_name', value: pageName }
        ];

        for (const setting of settingsToSave) {
            const { error } = await supabase
                .from('bot_settings')
                .upsert({ key: setting.key, value: setting.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

            if (error) {
                console.error("Error saving setting:", setting.key, error);
                return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Facebook pages save error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
