// NPS (Net Promoter Score) Analytics Component
// Calculates NPS score and displays promoter/passive/detractor breakdown
'use client';

import { useMemo } from 'react';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

interface ResponseData {
    id: string;
    question_id: string;
    subquestion_id?: string;
    value: string;
}

interface SurveyResponse {
    id: string;
    status: string;
    response_data: ResponseData[];
}

interface NPSAnalyticsProps {
    survey: SurveyWithStructure;
    responses: SurveyResponse[];
}

interface NPSResult {
    questionId: string;
    questionCode: string;
    questionText: string;
    npsScore: number;
    promoters: number;
    passives: number;
    detractors: number;
    promoterPercent: number;
    passivePercent: number;
    detractorPercent: number;
    totalResponses: number;
    distribution: number[]; // Count for each 0-10 value
}

// Calculate NPS category from value
function getNPSCategory(value: number): 'detractor' | 'passive' | 'promoter' {
    if (value <= 6) return 'detractor';
    if (value <= 8) return 'passive';
    return 'promoter';
}

export default function NPSAnalytics({ survey, responses }: NPSAnalyticsProps) {
    const npsResults = useMemo(() => {
        const results: NPSResult[] = [];

        // Find all NPS questions in the survey
        for (const group of survey.question_groups) {
            for (const question of group.questions) {
                if (question.question_type !== 'nps') continue;

                // Collect all responses for this question
                const questionResponses: number[] = [];
                const distribution = new Array(11).fill(0); // 0-10

                for (const response of responses) {
                    if (response.status !== 'complete') continue;

                    const answerData = response.response_data?.find(
                        rd => rd.question_id === question.id
                    );

                    if (answerData?.value !== undefined && answerData.value !== '') {
                        const value = parseInt(answerData.value, 10);
                        if (!isNaN(value) && value >= 0 && value <= 10) {
                            questionResponses.push(value);
                            distribution[value]++;
                        }
                    }
                }

                if (questionResponses.length === 0) continue;

                // Calculate NPS metrics
                let promoters = 0;
                let passives = 0;
                let detractors = 0;

                for (const value of questionResponses) {
                    const category = getNPSCategory(value);
                    if (category === 'promoter') promoters++;
                    else if (category === 'passive') passives++;
                    else detractors++;
                }

                const total = questionResponses.length;
                const promoterPercent = Math.round((promoters / total) * 100);
                const passivePercent = Math.round((passives / total) * 100);
                const detractorPercent = Math.round((detractors / total) * 100);

                // NPS = % Promoters - % Detractors (ranges from -100 to +100)
                const npsScore = promoterPercent - detractorPercent;

                results.push({
                    questionId: question.id,
                    questionCode: question.code,
                    questionText: question.question_text,
                    npsScore,
                    promoters,
                    passives,
                    detractors,
                    promoterPercent,
                    passivePercent,
                    detractorPercent,
                    totalResponses: total,
                    distribution,
                });
            }
        }

        return results;
    }, [survey, responses]);

    if (npsResults.length === 0) {
        return (
            <div className="nps-analytics-empty">
                <p>No NPS questions found in this survey, or no responses yet.</p>
                <style jsx>{`
                    .nps-analytics-empty {
                        padding: 2rem;
                        text-align: center;
                        color: #666;
                        background: #fafaf9;
                        border-radius: 8px;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="nps-analytics">
            {npsResults.map(result => (
                <div key={result.questionId} className="nps-card">
                    <div className="nps-header">
                        <span className="question-code">{result.questionCode}</span>
                        <h3 className="question-text">{result.questionText}</h3>
                    </div>

                    {/* Main NPS Score Display */}
                    <div className="nps-score-section">
                        <div className={`nps-score ${result.npsScore >= 50 ? 'excellent' : result.npsScore >= 0 ? 'good' : 'needs-work'}`}>
                            <span className="score-value">{result.npsScore >= 0 ? '+' : ''}{result.npsScore}</span>
                            <span className="score-label">NPS Score</span>
                        </div>
                        <div className="nps-benchmark">
                            <p className="benchmark-text">
                                {result.npsScore >= 70 ? 'World-class' :
                                 result.npsScore >= 50 ? 'Excellent' :
                                 result.npsScore >= 30 ? 'Great' :
                                 result.npsScore >= 0 ? 'Good' :
                                 result.npsScore >= -10 ? 'Needs improvement' :
                                 'Critical attention needed'}
                            </p>
                            <p className="response-count">{result.totalResponses} responses</p>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="category-breakdown">
                        <div className="category-bar">
                            <div
                                className="bar-segment promoter"
                                style={{ width: `${result.promoterPercent}%` }}
                                title={`Promoters: ${result.promoters} (${result.promoterPercent}%)`}
                            />
                            <div
                                className="bar-segment passive"
                                style={{ width: `${result.passivePercent}%` }}
                                title={`Passives: ${result.passives} (${result.passivePercent}%)`}
                            />
                            <div
                                className="bar-segment detractor"
                                style={{ width: `${result.detractorPercent}%` }}
                                title={`Detractors: ${result.detractors} (${result.detractorPercent}%)`}
                            />
                        </div>
                        <div className="category-labels">
                            <div className="category promoter">
                                <div className="category-dot" />
                                <div className="category-info">
                                    <span className="category-name">Promoters (9-10)</span>
                                    <span className="category-stats">{result.promoters} ({result.promoterPercent}%)</span>
                                </div>
                            </div>
                            <div className="category passive">
                                <div className="category-dot" />
                                <div className="category-info">
                                    <span className="category-name">Passives (7-8)</span>
                                    <span className="category-stats">{result.passives} ({result.passivePercent}%)</span>
                                </div>
                            </div>
                            <div className="category detractor">
                                <div className="category-dot" />
                                <div className="category-info">
                                    <span className="category-name">Detractors (0-6)</span>
                                    <span className="category-stats">{result.detractors} ({result.detractorPercent}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Response Distribution */}
                    <div className="distribution-section">
                        <h4>Response Distribution</h4>
                        <div className="distribution-chart">
                            {result.distribution.map((count, value) => {
                                const maxCount = Math.max(...result.distribution, 1);
                                const height = (count / maxCount) * 100;
                                const category = getNPSCategory(value);
                                return (
                                    <div key={value} className="distribution-bar-container">
                                        <div
                                            className={`distribution-bar ${category}`}
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                            title={`${value}: ${count} responses`}
                                        />
                                        <span className="distribution-value">{value}</span>
                                        <span className="distribution-count">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* NPS Formula Explanation */}
                    <div className="nps-formula">
                        <span className="formula-text">
                            NPS = % Promoters ({result.promoterPercent}%) − % Detractors ({result.detractorPercent}%) = <strong>{result.npsScore >= 0 ? '+' : ''}{result.npsScore}</strong>
                        </span>
                    </div>
                </div>
            ))}

            <style jsx>{`
                .nps-analytics {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .nps-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                }

                .nps-header {
                    margin-bottom: 1.5rem;
                }

                .question-code {
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 0.75rem;
                    color: #888;
                    background: #f5f3ef;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                }

                .question-text {
                    font-family: 'EB Garamond', Georgia, serif;
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #1a1d24;
                    margin: 0.75rem 0 0;
                    line-height: 1.4;
                }

                .nps-score-section {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .nps-score {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    border: 4px solid;
                }

                .nps-score.excellent {
                    border-color: #16a34a;
                    background: #f0fdf4;
                }

                .nps-score.good {
                    border-color: #f59e0b;
                    background: #fffbeb;
                }

                .nps-score.needs-work {
                    border-color: #dc2626;
                    background: #fef2f2;
                }

                .score-value {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .nps-score.excellent .score-value { color: #16a34a; }
                .nps-score.good .score-value { color: #d97706; }
                .nps-score.needs-work .score-value { color: #dc2626; }

                .score-label {
                    font-size: 0.7rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 0.25rem;
                }

                .nps-benchmark {
                    flex: 1;
                }

                .benchmark-text {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1a1d24;
                    margin: 0 0 0.25rem;
                }

                .response-count {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0;
                }

                .category-breakdown {
                    margin-bottom: 1.5rem;
                }

                .category-bar {
                    display: flex;
                    height: 24px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #e5e7eb;
                    margin-bottom: 1rem;
                }

                .bar-segment {
                    height: 100%;
                    transition: width 0.3s ease;
                }

                .bar-segment.promoter { background: #16a34a; }
                .bar-segment.passive { background: #f59e0b; }
                .bar-segment.detractor { background: #dc2626; }

                .category-labels {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .category {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .category-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .category.promoter .category-dot { background: #16a34a; }
                .category.passive .category-dot { background: #f59e0b; }
                .category.detractor .category-dot { background: #dc2626; }

                .category-info {
                    display: flex;
                    flex-direction: column;
                }

                .category-name {
                    font-size: 0.8rem;
                    color: #666;
                }

                .category-stats {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #1a1d24;
                }

                .distribution-section {
                    margin-bottom: 1rem;
                }

                .distribution-section h4 {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #666;
                    margin: 0 0 0.75rem;
                }

                .distribution-chart {
                    display: flex;
                    align-items: flex-end;
                    height: 80px;
                    gap: 4px;
                    padding-bottom: 2.5rem;
                    position: relative;
                }

                .distribution-bar-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    position: relative;
                }

                .distribution-bar {
                    width: 100%;
                    border-radius: 3px 3px 0 0;
                    transition: height 0.3s ease;
                }

                .distribution-bar.promoter { background: #16a34a; }
                .distribution-bar.passive { background: #f59e0b; }
                .distribution-bar.detractor { background: #dc2626; }

                .distribution-value {
                    position: absolute;
                    bottom: -20px;
                    font-size: 0.75rem;
                    color: #666;
                    font-weight: 500;
                }

                .distribution-count {
                    position: absolute;
                    bottom: -36px;
                    font-size: 0.65rem;
                    color: #999;
                }

                .nps-formula {
                    padding-top: 1rem;
                    border-top: 1px solid #e0ddd8;
                }

                .formula-text {
                    font-size: 0.8rem;
                    color: #666;
                }

                .formula-text strong {
                    color: #1a1d24;
                }

                @media (max-width: 640px) {
                    .nps-score-section {
                        flex-direction: column;
                        text-align: center;
                    }

                    .category-labels {
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .distribution-chart {
                        height: 60px;
                    }
                }
            `}</style>
        </div>
    );
}
