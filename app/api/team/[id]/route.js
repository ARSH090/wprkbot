import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request, { params }) {
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

        const memberId = params.id;
        const { role } = await request.json();

        if (!role || !['admin', 'operator', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const { error } = await supabase
            .from('team_members')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', memberId);

        if (error) {
            console.error("Error updating team role:", error);
            return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update role error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
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

        const memberId = params.id;

        // Fetch the target member to check rules
        const { data: targetMember } = await supabase
            .from('team_members')
            .select('email, role')
            .eq('id', memberId)
            .single();

        if (!targetMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Rules: Cannot remove self
        if (targetMember.email === currentUserEmail) {
            return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
        }

        // Rules: Cannot remove last admin
        if (targetMember.role === 'admin') {
            const { count: adminCount } = await supabase
                .from('team_members')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'admin');

            if (adminCount && adminCount <= 1) {
                return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
            }
        }

        // Delete member
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error("Error deleting team member:", error);
            return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
        }

        // Attempt to delete from Auth as well (fail silently if auth delete fails)
        // Note: Depends on whether service key has permission, which it usually does.
        if (targetMember.email) {
            // Lookup user ID by email first... this can be complex with standard Supabase JS client
            // Often it's enough to just remove them from the custom table and rely on RLS/App logic.
            // We'll skip the auth.admin.deleteUser here to avoid complexity unless user ID is known.
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete team member error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
