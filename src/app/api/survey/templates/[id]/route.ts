// API Route: Single Template Operations
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/survey/templates/[id] - Get single template
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: template, error } = await supabase
            .from('survey_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ template });
    } catch (error: any) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/survey/templates/[id] - Delete template
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('survey_templates')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/survey/templates/[id] - Update template
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, category } = body;

        const { data: template, error } = await supabase
            .from('survey_templates')
            .update({
                name,
                description,
                category,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ template });
    } catch (error: any) {
        console.error('Error updating template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
