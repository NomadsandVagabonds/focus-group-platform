// API Route: Get Survey Response Counts (Lightweight endpoint for live counters)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;

        // Get counts by status using a single query with grouping
        // This is more efficient than multiple count queries
        const { data, error } = await supabase
            .from('survey_responses')
            .select('status')
            .eq('survey_id', surveyId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate counts from the data
        const counts = {
            total: data.length,
            complete: 0,
            incomplete: 0,
            screened_out: 0
        };

        for (const row of data) {
            switch (row.status) {
                case 'complete':
                    counts.complete++;
                    break;
                case 'incomplete':
                    counts.incomplete++;
                    break;
                case 'screened_out':
                    counts.screened_out++;
                    break;
            }
        }

        // Set cache headers for efficiency (cache for 5 seconds)
        return NextResponse.json(counts, {
            headers: {
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
