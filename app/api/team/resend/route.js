import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const currentUserEmail = session.user.email;

        // Check if current user is admin
        const { data: adminCheck } = await supabase
            .from('team_members')
            .select('role')
            .eq('email', currentUserEmail)
            .single();

        if (adminCheck?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const { memberId } = await request.json();

        if (!memberId) {
            return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
        }

        const { data: member } = await supabase
            .from('team_members')
            .select('email')
            .eq('id', memberId)
            .single();

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Send invite via Supabase Auth Admin API
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(member.email);

        if (inviteError) {
            console.error("Error resending invite email:", inviteError);
            return NextResponse.json({ error: 'Failed to resend invite email' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Resend invite error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
