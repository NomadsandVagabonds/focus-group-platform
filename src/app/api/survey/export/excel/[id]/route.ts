// API Route: Export Survey to Excel format (.xlsx)
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { generateExcelBuffer } from '@/lib/export';
import type { SurveyWithStructure, ResponseWithData } from '@/lib/supabase/survey-types';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        // Options from query params
        const includeTimestamps = searchParams.get('timestamps') === 'true';
        const includeMetadata = searchParams.get('metadata') === 'true';
        const includeValueLabels = searchParams.get('labels') !== 'false';
        const statusFilter = searchParams.get('status') || 'complete'; // 'complete', 'all', 'incomplete'

        // Fetch survey with full structure
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select(`
                *,
                question_groups (
                    *,
                    questions (
                        *,
                        subquestions (*),
                        answer_options (*)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        // Fetch responses with data
        let responsesQuery = supabase
            .from('survey_responses')
            .select(`*, response_data (*)`)
            .eq('survey_id', id);

        if (statusFilter === 'complete') {
            responsesQuery = responsesQuery.eq('status', 'complete');
        } else if (statusFilter === 'incomplete') {
            responsesQuery = responsesQuery.eq('status', 'incomplete');
        }
        // 'all' doesn't add a filter

        const { data: responses, error: responsesError } = await responsesQuery;

        if (responsesError) {
            return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
        }

        const surveyData = survey as SurveyWithStructure;
        const responseData = (responses || []) as ResponseWithData[];
        const safeName = survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Generate Excel buffer
        const excelBuffer = generateExcelBuffer(surveyData, responseData, {
            includeResponseId: true,
            includeTimestamps,
            includeMetadata,
            includeValueLabelsSheet: includeValueLabels,
            sheetName: 'Survey Data',
        });

        // Return as downloadable file
        // Convert Buffer to Uint8Array for NextResponse compatibility
        const uint8Array = new Uint8Array(excelBuffer);
        return new NextResponse(uint8Array, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${safeName}_data.xlsx"`,
            },
        });

    } catch (error: any) {
        console.error('Excel export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
