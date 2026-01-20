// API Route: Get Single Survey with Structure
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


/**
 * Check if survey is available based on start/expiry dates
 * Returns: { available: boolean, reason?: 'not_started' | 'expired' }
 */
function checkSurveyAvailability(settings: any): { available: boolean; reason?: 'not_started' | 'expired' } {
    const now = new Date();

    // Check start date
    if (settings?.start_date) {
        const startDate = new Date(settings.start_date);
        if (now < startDate) {
            return { available: false, reason: 'not_started' };
        }
    }

    // Check expiry date
    if (settings?.expiry_date) {
        const expiryDate = new Date(settings.expiry_date);
        if (now > expiryDate) {
            return { available: false, reason: 'expired' };
        }
    }

    return { available: true };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const isAdmin = request.headers.get('x-admin-request') === 'true';

        const { data: survey, error } = await supabase
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

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // For non-admin requests, check date availability
        if (!isAdmin && survey.status === 'active') {
            const availability = checkSurveyAvailability(survey.settings);

            if (!availability.available) {
                // Return survey with availability info but without question data
                return NextResponse.json({
                    data: {
                        id: survey.id,
                        title: survey.title,
                        description: survey.description,
                        status: survey.status,
                        settings: survey.settings,
                    },
                    availability: {
                        available: false,
                        reason: availability.reason,
                        start_date: survey.settings?.start_date,
                        expiry_date: survey.settings?.expiry_date,
                    }
                });
            }
        }

        return NextResponse.json({
            data: survey,
            availability: { available: true }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, status, settings } = body;

        const { data, error } = await supabase
            .from('surveys')
            .update({ title, description, status, settings })
            .eq('id', id)
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

/**
 * DELETE /api/survey/surveys/[id]
 * Deletes a survey and all related data (cascade delete)
 *
 * Related tables deleted in order:
 * 1. response_data (depends on survey_responses and questions)
 * 2. survey_responses (depends on surveys)
 * 3. subquestions (depends on questions)
 * 4. answer_options (depends on questions)
 * 5. questions (depends on question_groups)
 * 6. question_groups (depends on surveys)
 * 7. quotas (depends on surveys)
 * 8. surveys
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verify survey exists
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('id, title')
            .eq('id', id)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            );
        }

        // Get all question groups for this survey
        const { data: groups } = await supabase
            .from('question_groups')
            .select('id')
            .eq('survey_id', id);

        const groupIds = groups?.map(g => g.id) || [];

        // Get all questions for these groups
        const { data: questions } = await supabase
            .from('questions')
            .select('id')
            .in('group_id', groupIds.length > 0 ? groupIds : ['00000000-0000-0000-0000-000000000000']);

        const questionIds = questions?.map(q => q.id) || [];

        // Get all responses for this survey
        const { data: responses } = await supabase
            .from('survey_responses')
            .select('id')
            .eq('survey_id', id);

        const responseIds = responses?.map(r => r.id) || [];

        // Delete in order (respecting foreign key constraints)

        // 1. Delete response_data (references both responses and questions)
        if (responseIds.length > 0) {
            const { error: responseDataError } = await supabase
                .from('response_data')
                .delete()
                .in('response_id', responseIds);

            if (responseDataError) {
                console.error('Error deleting response_data:', responseDataError);
            }
        }

        // 2. Delete survey_responses
        const { error: responsesError } = await supabase
            .from('survey_responses')
            .delete()
            .eq('survey_id', id);

        if (responsesError) {
            console.error('Error deleting survey_responses:', responsesError);
        }

        // 3. Delete subquestions (references questions)
        if (questionIds.length > 0) {
            const { error: subquestionsError } = await supabase
                .from('subquestions')
                .delete()
                .in('question_id', questionIds);

            if (subquestionsError) {
                console.error('Error deleting subquestions:', subquestionsError);
            }
        }

        // 4. Delete answer_options (references questions)
        if (questionIds.length > 0) {
            const { error: answerOptionsError } = await supabase
                .from('answer_options')
                .delete()
                .in('question_id', questionIds);

            if (answerOptionsError) {
                console.error('Error deleting answer_options:', answerOptionsError);
            }
        }

        // 5. Delete questions (references question_groups)
        if (groupIds.length > 0) {
            const { error: questionsError } = await supabase
                .from('questions')
                .delete()
                .in('group_id', groupIds);

            if (questionsError) {
                console.error('Error deleting questions:', questionsError);
            }
        }

        // 6. Delete question_groups (references surveys)
        const { error: groupsError } = await supabase
            .from('question_groups')
            .delete()
            .eq('survey_id', id);

        if (groupsError) {
            console.error('Error deleting question_groups:', groupsError);
        }

        // 7. Delete quotas (references surveys)
        const { error: quotasError } = await supabase
            .from('quotas')
            .delete()
            .eq('survey_id', id);

        if (quotasError) {
            console.error('Error deleting quotas:', quotasError);
        }

        // 8. Finally, delete the survey itself
        const { error: deleteError } = await supabase
            .from('surveys')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json(
                { error: `Failed to delete survey: ${deleteError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Survey "${survey.title}" and all related data have been deleted`
        });

    } catch (error: any) {
        console.error('Delete survey error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete survey' },
            { status: 500 }
        );
    }
}
