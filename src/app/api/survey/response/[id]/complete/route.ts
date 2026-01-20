// API Route: Complete Survey Response
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: responseId } = await params;

        // Mark response as complete
        const { data, error } = await supabase
            .from('survey_responses')
            .update({
                status: 'complete',
                completed_at: new Date().toISOString(),
            })
            .eq('id', responseId)
            .select()
            .single();

        if (error) {
            console.error('Error completing response:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get survey settings for redirect
        const { data: survey } = await supabase
            .from('surveys')
            .select('settings')
            .eq('id', data.survey_id)
            .single();

        const redirectUrl = survey?.settings?.completion_redirect_url;

        return NextResponse.json({
            success: true,
            data,
            redirect_url: redirectUrl,
        });
    } catch (error: any) {
        console.error('Error in complete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
