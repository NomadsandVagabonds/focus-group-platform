// Text Analysis Page for Survey Responses
'use client';

import { use } from 'react';
import Link from 'next/link';
import TextAnalysis from '@/components/survey/analytics/TextAnalysis';

export default function TextAnalysisPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const surveyId = resolvedParams.id;

    return (
        <div className="text-analysis-page">
            <div className="page-nav">
                <Link href={`/admin/surveys/${surveyId}`} className="nav-link">
                    ← Back to Survey
                </Link>
                <Link href={`/admin/surveys/${surveyId}/responses`} className="nav-link">
                    Response List
                </Link>
            </div>
            <TextAnalysis surveyId={surveyId} />
            <style jsx>{`
                .text-analysis-page {
                    min-height: 100vh;
                    background: #f5f3ef;
                }
                .page-nav {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1rem 2rem;
                    background: white;
                    border-bottom: 1px solid #e0ddd8;
                }
                .page-nav :global(.nav-link) {
                    color: #666;
                    text-decoration: none;
                    font-size: 0.875rem;
                    transition: color 0.15s;
                }
                .page-nav :global(.nav-link:hover) {
                    color: #c94a4a;
                }
            `}</style>
        </div>
    );
}
