import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const keysToDelete = ['fb_page_access_token', 'fb_page_id', 'fb_page_name'];

        const { error } = await supabase
            .from('bot_settings')
            .delete()
            .in('key', keysToDelete);

        if (error) {
            console.error("Error deleting settings:", error);
            return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Facebook disconnect error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
