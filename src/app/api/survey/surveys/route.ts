// API Route: Create New Survey
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
    try {
        const { title, description } = await request.json();

        const { data: survey, error } = await supabase
            .from('surveys')
            .insert({
                title,
                description,
                status: 'draft',
                settings: {
                    format: 'group_by_group',
                    theme: 'editorial_academic',
                    show_progress_bar: true,
                    allow_backward_navigation: false,
                    save_incomplete_responses: true,
                },
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, survey });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { data: surveys, error } = await supabase
            .from('surveys')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ surveys });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
