// API Route: Label Sets
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/survey/label-sets - List all label sets
export async function GET() {
    try {
        const { data: labelSets, error } = await supabase
            .from('label_sets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Table might not exist yet
            if (error.code === '42P01') {
                return NextResponse.json({ labelSets: [] });
            }
            throw error;
        }

        return NextResponse.json({ labelSets: labelSets || [] });
    } catch (error: any) {
        console.error('Error fetching label sets:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/survey/label-sets - Create a new label set
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, language, labels } = body;

        if (!name || !labels || labels.length < 2) {
            return NextResponse.json(
                { error: 'Name and at least 2 labels are required' },
                { status: 400 }
            );
        }

        const { data: labelSet, error } = await supabase
            .from('label_sets')
            .insert({
                name,
                language: language || 'en',
                labels,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'Label sets table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        return NextResponse.json({ labelSet }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating label set:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
