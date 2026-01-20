// API Route: Export Survey to R format
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRScript, generateRData } from '@/lib/export';
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
        const fileType = searchParams.get('type') || 'both'; // 'script', 'data', or 'both'

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

        // Generate R files
        const scriptContent = generateRScript(surveyData, {
            dataFilename: `${safeName}_data.csv`,
            useHaven: true,
        });
        const dataContent = generateRData(surveyData, responseData);

        if (fileType === 'script') {
            return new NextResponse(scriptContent, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename="${safeName}.R"`,
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
        zip.file(`${safeName}.R`, scriptContent);
        zip.file(`${safeName}_data.csv`, dataContent);
        zip.file('README.txt', `R Export for: ${survey.title}
Generated: ${new Date().toISOString()}
Responses: ${responseData.length}

Instructions:
1. Place both files in the same directory
2. Open ${safeName}.R in RStudio or R
3. Set your working directory to the folder containing the files
4. Run the script to import and process the data

Requirements:
- R 4.0 or later
- haven package (for SPSS export, installed automatically)

The script will:
- Import the CSV data
- Set variable types and labels
- Convert categorical variables to factors with proper labels
- Save as .rds file (native R format)
- Optionally save as .sav file (SPSS format)
`);

        const zipContent = await zip.generateAsync({ type: 'blob' });

        return new NextResponse(zipContent, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeName}_r.zip"`,
            },
        });

    } catch (error: any) {
        console.error('R export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
