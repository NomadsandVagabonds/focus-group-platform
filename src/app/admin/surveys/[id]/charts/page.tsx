'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ChartBuilder } from '@/components/survey/analytics/charts';

interface Survey {
    id: string;
    title: string;
    question_groups: QuestionGroup[];
}

interface QuestionGroup {
    id: string;
    title: string;
    sort_order: number;
    questions: Question[];
}

interface Question {
    id: string;
    question_code: string;
    question_text: string;
    question_type: string;
    answer_options?: AnswerOption[];
    subquestions?: Subquestion[];
}

interface AnswerOption {
    id: string;
    option_text: string;
    option_value: string;
}

interface Subquestion {
    id: string;
    subquestion_text: string;
    subquestion_code: string;
}

interface ResponseData {
    question_id: string;
    answer_value: string;
    answer_text?: string;
}

export default function ChartBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const surveyId = resolvedParams.id;

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responseData, setResponseData] = useState<ResponseData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch survey structure
                const surveyRes = await fetch(`/api/survey/surveys/${surveyId}`, {
                    headers: { 'x-admin-request': 'true' }
                });
                const surveyData = await surveyRes.json();

                if (!surveyRes.ok) {
                    throw new Error(surveyData.error || 'Failed to fetch survey');
                }

                setSurvey(surveyData.data);

                // Fetch response data for chart building
                const responsesRes = await fetch(`/api/survey/responses?survey_id=${surveyId}`);
                const responsesData = await responsesRes.json();

                if (responsesRes.ok && responsesData.data) {
                    // Flatten all response data
                    const allResponseData: ResponseData[] = [];

                    for (const response of responsesData.data) {
                        if (response.response_data) {
                            for (const rd of response.response_data) {
                                allResponseData.push({
                                    question_id: rd.question_id,
                                    answer_value: rd.answer_value,
                                    answer_text: rd.answer_text
                                });
                            }
                        }
                    }

                    setResponseData(allResponseData);
                }

                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
    }, [surveyId]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading chart builder...</p>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 400px;
                        gap: 1rem;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid #e0ddd8;
                        border-top-color: #c94a4a;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <Link href={`/admin/surveys/${surveyId}`} className="btn-back">
                    Back to Survey
                </Link>
                <style jsx>{`
                    .error-container {
                        max-width: 600px;
                        margin: 2rem auto;
                        padding: 2rem;
                        background: #fff8f8;
                        border: 1px solid #f8d7da;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .error-container h2 {
                        color: #721c24;
                        margin-bottom: 1rem;
                    }
                    .error-container p {
                        color: #666;
                        margin-bottom: 1.5rem;
                    }
                    .btn-back {
                        display: inline-block;
                        padding: 0.75rem 1.5rem;
                        background: #c94a4a;
                        color: white;
                        border-radius: 4px;
                        text-decoration: none;
                    }
                `}</style>
            </div>
        );
    }

    if (!survey) {
        return null;
    }

    const questionGroups = survey.question_groups?.map(group => ({
        id: group.id,
        title: group.title,
        questions: group.questions?.map(q => ({
            id: q.id,
            question_code: q.question_code,
            question_text: q.question_text,
            question_type: q.question_type,
            answer_options: q.answer_options,
            subquestions: q.subquestions
        })) || []
    })) || [];

    const handleSaveChart = (chartConfig: any) => {
        // In a future iteration, save to database
        console.log('Chart saved:', chartConfig);
        alert('Chart configuration saved! (In future: save to database)');
    };

    return (
        <div className="chart-builder-page">
            <div className="page-header">
                <div className="header-content">
                    <Link href={`/admin/surveys/${surveyId}`} className="back-link">
                        ← Back to Survey
                    </Link>
                    <h1>Chart Builder</h1>
                    <p className="survey-title">{survey.title}</p>
                </div>
                <div className="header-stats">
                    <div className="stat">
                        <span className="stat-value">{questionGroups.length}</span>
                        <span className="stat-label">Question Groups</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {questionGroups.reduce((sum, g) => sum + g.questions.length, 0)}
                        </span>
                        <span className="stat-label">Questions</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {new Set(responseData.map(r => r.question_id)).size > 0
                                ? Math.floor(responseData.length / new Set(responseData.map(r => r.question_id)).size)
                                : 0}
                        </span>
                        <span className="stat-label">Responses</span>
                    </div>
                </div>
            </div>

            <div className="builder-container">
                {responseData.length > 0 ? (
                    <ChartBuilder
                        surveyId={surveyId}
                        questionGroups={questionGroups}
                        responseData={responseData}
                        onSaveChart={handleSaveChart}
                    />
                ) : (
                    <div className="no-data-message">
                        <h2>No Response Data</h2>
                        <p>
                            This survey doesn't have any responses yet. Charts require response data to visualize.
                        </p>
                        <p>
                            Once respondents complete the survey, you'll be able to create beautiful visualizations here.
                        </p>
                        <div className="demo-note">
                            <strong>Tip:</strong> You can still preview chart types and configure options.
                            Add some test responses to see your data come to life!
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .chart-builder-page {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: #f5f3ef;
                    min-height: 100vh;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    background: white;
                    padding: 1.5rem 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .header-content {
                    flex: 1;
                }

                .back-link {
                    display: inline-block;
                    color: #666;
                    text-decoration: none;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                    transition: color 0.15s;
                }

                .back-link:hover {
                    color: #c94a4a;
                }

                .page-header h1 {
                    font-size: 1.75rem;
                    color: #1a1d24;
                    font-family: 'Libre Baskerville', serif;
                    margin: 0 0 0.5rem 0;
                }

                .survey-title {
                    color: #666;
                    font-size: 0.95rem;
                    margin: 0;
                }

                .header-stats {
                    display: flex;
                    gap: 2rem;
                }

                .stat {
                    text-align: center;
                }

                .stat-value {
                    display: block;
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #1a1d24;
                }

                .stat-label {
                    display: block;
                    font-size: 0.75rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .builder-container {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    padding: 2rem;
                }

                .no-data-message {
                    text-align: center;
                    padding: 4rem 2rem;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .no-data-message h2 {
                    color: #1a1d24;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }

                .no-data-message p {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                .demo-note {
                    background: #f8f7f5;
                    padding: 1rem 1.5rem;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    color: #666;
                    margin-top: 2rem;
                }

                .demo-note strong {
                    color: #c94a4a;
                }
            `}</style>
        </div>
    );
}
