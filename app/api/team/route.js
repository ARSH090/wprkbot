import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from 'crypto';

export async function GET(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: teamMembers, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching team:", error);
            return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
        }

        return NextResponse.json(teamMembers);
    } catch (error) {
        console.error('Fetch team error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}

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

        const { email, role } = await request.json();

        if (!email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['admin', 'operator', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check size limit (max 5)
        const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true });

        if (count && count >= 5) {
            return NextResponse.json({ error: 'Team size limit reached (max 5)' }, { status: 400 });
        }

        // Check if already in team
        const { data: existingUser } = await supabase
            .from('team_members')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({ error: 'User is already in the team or invited' }, { status: 400 });
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');

        // Insert into DB
        const { error: insertError } = await supabase
            .from('team_members')
            .insert({
                email,
                full_name: email.split('@')[0], // Extract name from email roughly
                role,
                invited_by: currentUserEmail,
                invite_token: inviteToken,
                invite_accepted: false
            });

        if (insertError) {
            console.error("Error inserting member:", insertError);
            return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
        }

        // Send invite via Supabase Auth Admin API
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);

        if (inviteError) {
            console.error("Error sending invite email:", inviteError);
            // Delete the row if invite fails to keep it clean
            await supabase.from('team_members').delete().eq('email', email);
            return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Invite team member error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
