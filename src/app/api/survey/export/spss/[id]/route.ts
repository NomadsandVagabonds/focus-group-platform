// API Route: Export Survey to SPSS format
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSPSSSyntax, generateSPSSData } from '@/lib/export';
import type { SurveyWithStructure, ResponseWithData } from '@/lib/supabase/survey-types';
import JSZip from 'jszip';

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
        const fileType = searchParams.get('type') || 'both'; // 'syntax', 'data', or 'both'

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
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select(`*, response_data (*)`)
            .eq('survey_id', id)
            .eq('status', 'complete');

        if (responsesError) {
            return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
        }

        const surveyData = survey as SurveyWithStructure;
        const responseData = (responses || []) as ResponseWithData[];
        const safeName = survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Generate SPSS files
        const syntaxContent = generateSPSSSyntax(surveyData, {
            dataFilename: `${safeName}_data.csv`,
        });
        const dataContent = generateSPSSData(surveyData, responseData);

        if (fileType === 'syntax') {
            return new NextResponse(syntaxContent, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename="${safeName}_syntax.sps"`,
                },
            });
        }

        if (fileType === 'data') {
            return new NextResponse(dataContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${safeName}_data.csv"`,
                },
            });
        }

        // Create ZIP with both files
        const zip = new JSZip();
        zip.file(`${safeName}_syntax.sps`, syntaxContent);
        zip.file(`${safeName}_data.csv`, dataContent);
        zip.file('README.txt', `SPSS Export for: ${survey.title}
Generated: ${new Date().toISOString()}
Responses: ${responseData.length}

Instructions:
1. Open ${safeName}_syntax.sps in SPSS
2. Edit the FILE= path to point to ${safeName}_data.csv
3. Run the syntax file to import the data

Note: The syntax file expects the data file to be in the same directory.
`);

        const zipContent = await zip.generateAsync({ type: 'blob' });

        return new NextResponse(zipContent, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeName}_spss.zip"`,
            },
        });

    } catch (error: any) {
        console.error('SPSS export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
