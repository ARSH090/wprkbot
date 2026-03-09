import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const id = params.id;

        // Lookup the file so we can delete from storage
        const { data: doc, error: fetchErr } = await supabase
            .from('training_docs')
            .select('file_url')
            .eq('id', id)
            .single();

        if (doc && doc.file_url) {
            // Extract filename from URL (simple heuristic)
            const parts = doc.file_url.split('/');
            const filename = parts[parts.length - 1];
            if (filename) {
                await supabase.storage.from('training-screenshots').remove([filename]);
            }
        }

        // Delete from DB
        const { error } = await supabase
            .from('training_docs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting doc", e);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
