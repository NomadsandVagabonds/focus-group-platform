import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET: List all tags
export async function GET() {
    try {
        const supabase = getSupabase();
        const { data: tags, error } = await getSupabaseServer()
            .from('tags')
            .select('*')
            .order('name');

        if (error) throw error;

        return NextResponse.json(tags || []);
    } catch (error) {
        console.error('Error fetching tags:', error);
        return NextResponse.json([], { status: 200 }); // Return empty on error, table may not exist
    }
}

// POST: Create a new tag
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { name, color } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
        }

        const { data: tag, error } = await getSupabaseServer()
            .from('tags')
            .insert({
                name: name.trim(),
                color: color || '#6B7280'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        console.error('Error creating tag:', error);
        return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }
}

