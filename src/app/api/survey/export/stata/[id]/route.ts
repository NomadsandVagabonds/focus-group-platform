// API Route: Export Survey to Stata format
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { generateStataDoFile, generateStataData } from '@/lib/export';
import type { SurveyWithStructure, ResponseWithData } from '@/lib/supabase/survey-types';
import JSZip from 'jszip';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const fileType = searchParams.get('type') || 'both'; // 'dofile', 'data', or 'both'
        const version = parseInt(searchParams.get('version') || '16') as 14 | 15 | 16 | 17;

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

        // Generate Stata files
        const dofileContent = generateStataDoFile(surveyData, {
            dataFilename: `${safeName}_data.csv`,
            version,
        });
        const dataContent = generateStataData(surveyData, responseData);

        if (fileType === 'dofile') {
            return new NextResponse(dofileContent, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename="${safeName}.do"`,
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
        zip.file(`${safeName}.do`, dofileContent);
        zip.file(`${safeName}_data.csv`, dataContent);
        zip.file('README.txt', `Stata Export for: ${survey.title}
Generated: ${new Date().toISOString()}
Responses: ${responseData.length}
Stata Version: ${version}

Instructions:
1. Place both files in the same directory
2. Open Stata
3. Set your working directory: cd "path/to/files"
4. Run the do-file: do "${safeName}.do"

The do-file will:
- Import the CSV data
- Convert string variables to numeric where appropriate
- Define and apply value labels
- Apply variable labels
- Compress the data
- Save as ${safeName}.dta

Note: If you get errors about variable types, try running:
  set maxvar 10000
before importing (for surveys with many questions).
`);

        const zipContent = await zip.generateAsync({ type: 'blob' });

        return new NextResponse(zipContent, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeName}_stata.zip"`,
            },
        });

    } catch (error: any) {
        console.error('Stata export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
