// API Route: Survey Autosave - Periodic saving of incomplete responses
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface RouteParams {
    params: Promise<{ id: string }>;
}

interface AutosaveData {
    response_id: string;
    answers: Record<string, any>;
    current_group_index?: number;
    current_question_index?: number;
    timing_data?: Record<string, number>;
}

// POST /api/survey/[id]/autosave - Save current response state
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const body: AutosaveData = await request.json();
        const {
            response_id,
            answers,
            current_group_index,
            current_question_index,
            timing_data,
        } = body;

        if (!response_id) {
            return NextResponse.json(
                { error: 'response_id is required' },
                { status: 400 }
            );
        }

        // Verify response exists and is incomplete
        const { data: response, error: responseError } = await supabase
            .from('survey_responses')
            .select('id, status, metadata')
            .eq('id', response_id)
            .eq('survey_id', surveyId)
            .single();

        if (responseError || !response) {
            return NextResponse.json(
                { error: 'Response not found' },
                { status: 404 }
            );
        }

        if (response.status === 'complete') {
            return NextResponse.json(
                { error: 'Cannot autosave completed response' },
                { status: 400 }
            );
        }

        // Update response metadata with position info
        const updatedMetadata = {
            ...response.metadata,
            last_autosave: new Date().toISOString(),
            current_group_index,
            current_question_index,
            timing_data: timing_data || response.metadata?.timing_data,
        };

        await supabase
            .from('survey_responses')
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString(),
            })
            .eq('id', response_id);

        // Save/update answer data
        // IMPORTANT: answers come in as question CODES (e.g., "Q1", "Q2_SQ001")
        // We need to resolve these to actual UUIDs for the database
        if (answers && Object.keys(answers).length > 0) {
            // First, get all question group IDs for this survey
            const { data: groups, error: groupsError } = await supabase
                .from('question_groups')
                .select('id')
                .eq('survey_id', surveyId);

            if (groupsError || !groups || groups.length === 0) {
                console.error('Error fetching groups for autosave:', groupsError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to resolve question groups',
                }, { status: 500 });
            }

            const groupIds = groups.map(g => g.id);

            // Now get all questions for these groups
            const { data: questions, error: questionsError } = await supabase
                .from('questions')
                .select(`
                    id,
                    code,
                    subquestions (id, code)
                `)
                .in('group_id', groupIds);

            if (questionsError) {
                console.error('Error fetching questions for autosave:', questionsError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to resolve question codes',
                }, { status: 500 });
            }

            // Build lookup maps for code -> id resolution
            const questionCodeToId = new Map<string, string>();
            const subquestionCodeToId = new Map<string, string>(); // key: "questionCode_subquestionCode"

            for (const q of questions || []) {
                questionCodeToId.set(q.code, q.id);
                for (const sq of q.subquestions || []) {
                    subquestionCodeToId.set(`${q.code}_${sq.code}`, sq.id);
                }
            }

            const upsertData: any[] = [];
            const skippedKeys: string[] = [];

            for (const [key, value] of Object.entries(answers)) {
                // Key format: "questionCode" or "questionCode_subquestionCode"
                let questionId: string | undefined;
                let subquestionId: string | null = null;

                // Try to find the key in our subquestion map first (most specific)
                if (subquestionCodeToId.has(key)) {
                    // This is a full "questionCode_subquestionCode" key
                    subquestionId = subquestionCodeToId.get(key)!;
                    // Extract question code and get its ID
                    const parts = key.split('_');
                    const questionCode = parts.slice(0, -1).join('_'); // Handle question codes with underscores
                    questionId = questionCodeToId.get(questionCode);
                } else if (questionCodeToId.has(key)) {
                    // This is just a question code
                    questionId = questionCodeToId.get(key);
                } else {
                    // Try parsing as "questionCode_subquestionCode" manually
                    const lastUnderscoreIndex = key.lastIndexOf('_');
                    if (lastUnderscoreIndex > 0) {
                        const questionCode = key.substring(0, lastUnderscoreIndex);
                        const subquestionCode = key.substring(lastUnderscoreIndex + 1);

                        questionId = questionCodeToId.get(questionCode);
                        if (questionId) {
                            // Look up subquestion ID
                            const sqKey = `${questionCode}_${subquestionCode}`;
                            subquestionId = subquestionCodeToId.get(sqKey) || null;
                        }
                    }
                }

                if (!questionId) {
                    // Skip unknown question codes (might be from a different version or typo)
                    skippedKeys.push(key);
                    continue;
                }

                upsertData.push({
                    response_id,
                    question_id: questionId,
                    subquestion_id: subquestionId,
                    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                    updated_at: new Date().toISOString(),
                });
            }

            if (skippedKeys.length > 0) {
                console.warn(`Autosave: Skipped unknown question codes: ${skippedKeys.join(', ')}`);
            }

            if (upsertData.length > 0) {
                // Use upsert to handle both new and existing answers
                const { error: upsertError } = await supabase
                    .from('response_data')
                    .upsert(upsertData, {
                        onConflict: 'response_id,question_id,subquestion_id',
                        ignoreDuplicates: false,
                    });

                if (upsertError) {
                    console.error('Error saving response data:', upsertError);
                    // Don't fail the whole request if upsert fails - data is backed up on client
                }
            }
        }

        return NextResponse.json({
            success: true,
            saved_at: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error autosaving response:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/survey/[id]/autosave?response_id=xxx - Get last autosave state
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const responseId = request.nextUrl.searchParams.get('response_id');

        if (!responseId) {
            return NextResponse.json(
                { error: 'response_id is required' },
                { status: 400 }
            );
        }

        // Get response with metadata
        const { data: response, error: responseError } = await supabase
            .from('survey_responses')
            .select('id, status, metadata')
            .eq('id', responseId)
            .eq('survey_id', surveyId)
            .single();

        if (responseError || !response) {
            return NextResponse.json(
                { error: 'Response not found' },
                { status: 404 }
            );
        }

        // Get all saved answers
        const { data: savedData, error: dataError } = await supabase
            .from('response_data')
            .select('question_id, subquestion_id, value')
            .eq('response_id', responseId);

        if (dataError) throw dataError;

        // Convert to map format
        const answers: Record<string, any> = {};
        for (const item of savedData || []) {
            const key = item.subquestion_id
                ? `${item.question_id}_${item.subquestion_id}`
                : item.question_id;

            // Try to parse JSON values
            try {
                answers[key] = JSON.parse(item.value);
            } catch {
                answers[key] = item.value;
            }
        }

        return NextResponse.json({
            response_id: response.id,
            status: response.status,
            last_autosave: response.metadata?.last_autosave,
            current_group_index: response.metadata?.current_group_index,
            current_question_index: response.metadata?.current_question_index,
            timing_data: response.metadata?.timing_data,
            answers,
        });
    } catch (error: any) {
        console.error('Error fetching autosave state:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
