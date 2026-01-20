// API Route: Question Groups CRUD
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from('question_groups')
            .insert(body)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
