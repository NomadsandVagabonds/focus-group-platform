// API Route: Get Survey Responses with Pagination
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
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200); // Max 200 per page
        const offset = (page - 1) * limit;

        // Filter parameters
        const status = searchParams.get('status'); // 'complete', 'incomplete', 'screened_out'
        const search = searchParams.get('search'); // Search in response_id, participant_id

        // Build query
        let query = supabase
            .from('survey_responses')
            .select(`
                *,
                response_data (*)
            `, { count: 'exact' })
            .eq('survey_id', id);

        // Apply status filter
        if (status && ['complete', 'incomplete', 'screened_out'].includes(status)) {
            query = query.eq('status', status);
        }

        // Apply search filter (searches response id and participant_id)
        if (search) {
            query = query.or(`id.ilike.%${search}%,participant_id.ilike.%${search}%`);
        }

        // Apply ordering and pagination
        query = query
            .order('started_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: responses, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate pagination metadata
        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return NextResponse.json({
            responses,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
