import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await getSupabaseServer()
            .from('session_scripts')
            .select('*')
            .eq('session_id', sessionId)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('[Scripts] Fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ sections: data || [] });
    } catch (error) {
        console.error('[Scripts] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch script' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { sessionId, sections } = await request.json();

        if (!sessionId || !sections) {
            return NextResponse.json({ error: 'sessionId and sections required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Delete existing sections for this session
        await getSupabaseServer()
            .from('session_scripts')
            .delete()
            .eq('session_id', sessionId);

        // Insert new sections with order index
        const sectionsToInsert = sections.map((section: {
            id: string;
            title: string;
            estimatedMinutes: number;
            content: string;
            mediaTag?: string;
        }, index: number) => ({
            session_id: sessionId,
            section_id: section.id,
            title: section.title,
            estimated_minutes: section.estimatedMinutes,
            content: section.content,
            media_tag: section.mediaTag || null,
            order_index: index,
        }));

        const { data, error } = await getSupabaseServer()
            .from('session_scripts')
            .insert(sectionsToInsert)
            .select();

        if (error) {
            console.error('[Scripts] Save error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Scripts] Saved ${sectionsToInsert.length} sections for session ${sessionId}`);
        return NextResponse.json({ success: true, sections: data });
    } catch (error) {
        console.error('[Scripts] Error:', error);
        return NextResponse.json({ error: 'Failed to save script' }, { status: 500 });
    }
}
