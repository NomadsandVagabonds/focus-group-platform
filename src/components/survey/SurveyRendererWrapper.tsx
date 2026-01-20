'use client';

import dynamic from 'next/dynamic';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

const SurveyRenderer = dynamic(
    () => import('@/components/survey/SurveyRenderer'),
    {
        ssr: false,
        loading: () => (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Loading Survey...</h1>
                <p>Please wait while we prepare your survey.</p>
            </div>
        )
    }
);

interface Props {
    survey: SurveyWithStructure;
    responseId: string;
    completionUrl: string;
    isPreview: boolean;
}

export default function SurveyRendererWrapper({ survey, responseId, completionUrl, isPreview }: Props) {
    return (
        <SurveyRenderer
            survey={survey}
            responseId={responseId}
            completionUrl={completionUrl}
            isPreview={isPreview}
        />
    );
}
