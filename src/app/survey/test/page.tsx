// Simple test page for debugging - testing CSS imports
import { createClient } from '@supabase/supabase-js';
import SurveyRenderer from '@/components/survey/SurveyRenderer';
import '@/app/survey.css';
import '@/app/survey-mobile.css';

export default async function TestPage() {
    console.log('[TestPage] Starting with CSS imports');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase.from('surveys').select('id,title').limit(1);
    console.log('[TestPage] Query done, count:', data?.length);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Test Page - With CSS Imports</h1>
            <p>Surveys: {data?.length || 0}</p>
        </div>
    );
}
