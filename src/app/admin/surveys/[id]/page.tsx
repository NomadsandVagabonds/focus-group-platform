// Survey Builder - Main Editor Page
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import SurveyBuilderLayout from '@/components/survey/builder/SurveyBuilderLayout';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default async function SurveyBuilderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: surveyId } = await params;

    // Fetch survey with full structure, ordered by order_index
    const { data: survey, error } = await getSupabase()
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
        .order('order_index', { referencedTable: 'question_groups', ascending: true })
        .order('order_index', { referencedTable: 'question_groups.questions', ascending: true })
        .order('order_index', { referencedTable: 'question_groups.questions.subquestions', ascending: true })
        .order('order_index', { referencedTable: 'question_groups.questions.answer_options', ascending: true })
        .single();

    if (error || !survey) {
        return (
            <div className="error-page">
                <h1>Survey Not Found</h1>
                <p>This survey does not exist or you don't have permission to edit it.</p>
            </div>
        );
    }

    return <SurveyBuilderLayout survey={survey as SurveyWithStructure} />;
}
