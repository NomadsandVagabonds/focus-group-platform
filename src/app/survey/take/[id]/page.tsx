// Survey Take Page - Public survey taking interface
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import SurveyRenderer from '@/components/survey/SurveyRenderer';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SurveyTakePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { id: surveyId } = await params;
    const resolvedSearchParams = await searchParams;

    const isPreview = resolvedSearchParams.preview === 'true';
    const PROLIFIC_PID = resolvedSearchParams.PROLIFIC_PID as string;
    const SESSION_ID = resolvedSearchParams.SESSION_ID as string;
    const STUDY_ID = resolvedSearchParams.STUDY_ID as string;

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
        .eq('id', surveyId)
        .single();

    if (error || !survey) {
        return (
            <div className="error-page">
                <h1>Survey Not Found</h1>
                <p>This survey is not currently available.</p>
            </div>
        );
    }

    if (!isPreview && survey.status !== 'active') {
        if (survey.status === 'draft') {
            return (
                <div className="error-page">
                    <h1>Survey Not Yet Available</h1>
                    <p>This survey is still being prepared.</p>
                </div>
            );
        } else if (survey.status === 'closed') {
            return (
                <div className="error-page">
                    <h1>Survey Closed</h1>
                    <p>This survey is no longer accepting responses.</p>
                </div>
            );
        }
    }

    let responseId: string;

    if (isPreview) {
        responseId = `preview-${surveyId}-${Date.now()}`;
    } else if (PROLIFIC_PID) {
        const { data: response, error: upsertError } = await supabase
            .from('survey_responses')
            .upsert({
                survey_id: surveyId,
                participant_id: PROLIFIC_PID,
                session_id: SESSION_ID,
                study_id: STUDY_ID,
                status: 'incomplete',
                randomization_seed: `${PROLIFIC_PID}-${Date.now()}`,
            }, {
                onConflict: 'survey_id,participant_id',
                ignoreDuplicates: false,
            })
            .select('id, status')
            .single();

        if (upsertError) {
            return (
                <div className="error-page">
                    <h1>Error Starting Survey</h1>
                    <p>Error: {upsertError.message}</p>
                </div>
            );
        }

        if (response.status === 'complete') {
            const completionUrl = survey.settings?.completion_redirect_url || '/survey/complete';
            redirect(completionUrl);
        }

        responseId = response.id;
    } else {
        const { data: newResponse } = await supabase
            .from('survey_responses')
            .insert({
                survey_id: surveyId,
                status: 'incomplete',
                randomization_seed: `anon-${Date.now()}`,
            })
            .select()
            .single();

        responseId = newResponse!.id;
    }

    let completionUrl = '/survey/complete';
    if (survey.settings?.prolific_integration?.enabled && survey.settings.prolific_integration.completion_code) {
        completionUrl = `https://app.prolific.com/submissions/complete?cc=${survey.settings.prolific_integration.completion_code}`;
    }

    return (
        <SurveyRenderer
            survey={survey as SurveyWithStructure}
            responseId={responseId}
            completionUrl={completionUrl}
            isPreview={isPreview}
        />
    );
}
