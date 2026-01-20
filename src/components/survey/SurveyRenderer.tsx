'use client';

import { useState } from 'react';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

interface SurveyRendererProps {
    survey: SurveyWithStructure;
    responseId: string;
    completionUrl: string;
    isPreview?: boolean;
}

export default function SurveyRenderer({ survey, responseId, completionUrl, isPreview = false }: SurveyRendererProps) {
    const [started, setStarted] = useState(false);

    if (!started) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <h1>{survey.title}</h1>
                <p>{survey.description || 'Welcome to this survey'}</p>
                <button
                    onClick={() => setStarted(true)}
                    style={{ padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    Start Survey
                </button>
                {isPreview && <p style={{ color: 'orange', marginTop: '1rem' }}>Preview Mode</p>}
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>{survey.title}</h1>
            <p>Survey started! Response ID: {responseId}</p>
            <p>Questions: {survey.question_groups?.reduce((acc, g) => acc + (g.questions?.length || 0), 0) || 0}</p>
            <p style={{ marginTop: '2rem', color: 'green' }}>
                Build successful! Full survey renderer temporarily disabled for debugging.
            </p>
            <a href={completionUrl}>Complete Survey</a>
        </div>
    );
}
