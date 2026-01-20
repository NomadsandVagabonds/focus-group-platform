'use client';

import { useState, useEffect, useRef } from 'react';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';
import ChartExportButton from './ChartExportButton';

interface ResponseChartsProps {
    surveyId: string;
}

interface ResponseSummary {
    total: number;
    completed: number;
    incomplete: number;
    screenedOut: number;
    completionRate: number;
    avgCompletionTime?: number; // in seconds
}

interface TimelineDataPoint {
    date: string;
    count: number;
    cumulative: number;
}

interface ResponseData {
    id: string;
    question_id: string;
    subquestion_id?: string;
    value: string;
}

interface SurveyResponseWithData {
    id: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    response_data: ResponseData[];
}

interface QuestionDistribution {
    questionId: string;
    questionCode: string;
    questionText: string;
    questionType: string;
    options: {
        code: string;
        label: string;
        count: number;
        percentage: number;
    }[];
    totalResponses: number;
}

interface DropOffPoint {
    questionId: string;
    questionCode: string;
    questionText: string;
    groupTitle: string;
    dropOffCount: number;
    percentage: number;
    cumulativeDropOff: number;
    cumulativePercentage: number;
}

type ChartType = 'bar' | 'pie';

// Editorial Academic theme colors for pie chart segments
const PIE_COLORS = [
    '#c94a4a', // Primary red
    '#4a7c9b', // Blue
    '#6b8e5e', // Green
    '#b8860b', // Gold
    '#8b5a7c', // Purple
    '#cc7a3e', // Orange
    '#5a8b8b', // Teal
    '#9b6b4a', // Brown
    '#7c7c8b', // Gray
    '#4a6b8b', // Navy
];

// Pie Chart SVG Component
function PieChart({ options, size = 200 }: {
    options: { code: string; label: string; count: number; percentage: number }[];
    size?: number;
}) {
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    // Filter out zero-count options for the chart
    const nonZeroOptions = options.filter(opt => opt.count > 0);

    if (nonZeroOptions.length === 0) {
        return (
            <div className="pie-chart-empty">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        fill="#e0ddd8"
                    />
                    <text
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#666"
                        fontSize="14"
                    >
                        No data
                    </text>
                </svg>
            </div>
        );
    }

    // Calculate segments
    let currentAngle = -90; // Start from top
    const segments: { path: string; color: string; option: typeof options[0] }[] = [];

    for (let i = 0; i < nonZeroOptions.length; i++) {
        const option = nonZeroOptions[i];
        const angle = (option.percentage / 100) * 360;

        // Handle full circle case (100%)
        if (angle >= 359.99) {
            segments.push({
                path: `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.01} ${centerY - radius} Z`,
                color: PIE_COLORS[i % PIE_COLORS.length],
                option
            });
            continue;
        }

        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        segments.push({
            path,
            color: PIE_COLORS[i % PIE_COLORS.length],
            option
        });

        currentAngle = endAngle;
    }

    return (
        <div className="pie-chart-container">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.map((segment) => (
                    <path
                        key={segment.option.code}
                        d={segment.path}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="2"
                        className="pie-segment"
                    >
                        <title>{segment.option.label}: {segment.option.count} ({segment.option.percentage}%)</title>
                    </path>
                ))}
            </svg>
            <style jsx>{`
                .pie-chart-container {
                    display: flex;
                    justify-content: center;
                }
                .pie-segment {
                    transition: transform 0.2s ease, opacity 0.2s ease;
                    transform-origin: center;
                }
                .pie-segment:hover {
                    opacity: 0.85;
                    filter: brightness(1.1);
                }
            `}</style>
        </div>
    );
}

// Legend Component for Pie Chart
function PieLegend({ options }: {
    options: { code: string; label: string; count: number; percentage: number }[];
}) {
    return (
        <div className="pie-legend">
            {options.map((option, index) => (
                <div key={option.code} className="legend-item">
                    <span
                        className="legend-color"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="legend-label">{option.label}</span>
                    <span className="legend-stats">
                        <span className="legend-count">{option.count}</span>
                        <span className="legend-percentage">({option.percentage}%)</span>
                    </span>
                </div>
            ))}
            <style jsx>{`
                .pie-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }
                .legend-color {
                    width: 14px;
                    height: 14px;
                    border-radius: 3px;
                    flex-shrink: 0;
                }
                .legend-label {
                    color: #1a1d24;
                    flex: 1;
                    word-break: break-word;
                }
                .legend-stats {
                    display: flex;
                    gap: 0.25rem;
                    flex-shrink: 0;
                }
                .legend-count {
                    font-weight: 600;
                    color: #1a1d24;
                }
                .legend-percentage {
                    color: #666;
                }
            `}</style>
        </div>
    );
}

// Helper to check if a question type supports pie chart (single-choice questions)
function supportsPieChart(questionType: string): boolean {
    return ['multiple_choice_single', 'yes_no', 'dropdown'].includes(questionType);
}

// Response Timeline Chart - shows responses over time
function ResponseTimeline({ data, height = 200 }: { data: TimelineDataPoint[]; height?: number }) {
    if (data.length === 0) {
        return (
            <div className="timeline-empty">
                <p>No timeline data available</p>
                <style jsx>{`
                    .timeline-empty {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: ${height}px;
                        background: #fafaf9;
                        border-radius: 4px;
                        color: #666;
                        font-size: 0.875rem;
                    }
                `}</style>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const maxCumulative = Math.max(...data.map(d => d.cumulative), 1);
    const padding = { top: 20, right: 60, bottom: 40, left: 40 };
    const chartWidth = 100; // percentage
    const chartHeight = height - padding.top - padding.bottom;

    return (
        <div className="timeline-chart">
            <svg width="100%" height={height} viewBox={`0 0 600 ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
                    <line
                        key={fraction}
                        x1={padding.left}
                        y1={padding.top + chartHeight * (1 - fraction)}
                        x2={600 - padding.right}
                        y2={padding.top + chartHeight * (1 - fraction)}
                        stroke="#e0ddd8"
                        strokeDasharray="4,4"
                    />
                ))}

                {/* Daily bars */}
                {data.map((point, index) => {
                    const barWidth = (600 - padding.left - padding.right) / data.length * 0.7;
                    const x = padding.left + (index / data.length) * (600 - padding.left - padding.right) + barWidth * 0.15;
                    const barHeight = (point.count / maxCount) * chartHeight;
                    const y = padding.top + chartHeight - barHeight;

                    return (
                        <g key={point.date}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill="#c94a4a"
                                opacity={0.7}
                                rx={2}
                            >
                                <title>{point.date}: {point.count} response{point.count !== 1 ? 's' : ''}</title>
                            </rect>
                        </g>
                    );
                })}

                {/* Cumulative line */}
                <path
                    d={data.map((point, index) => {
                        const x = padding.left + (index / (data.length - 1 || 1)) * (600 - padding.left - padding.right);
                        const y = padding.top + chartHeight - (point.cumulative / maxCumulative) * chartHeight;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#4a7c9b"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Cumulative dots */}
                {data.map((point, index) => {
                    const x = padding.left + (index / (data.length - 1 || 1)) * (600 - padding.left - padding.right);
                    const y = padding.top + chartHeight - (point.cumulative / maxCumulative) * chartHeight;
                    return (
                        <circle
                            key={`dot-${point.date}`}
                            cx={x}
                            cy={y}
                            r={4}
                            fill="#4a7c9b"
                        >
                            <title>{point.date}: {point.cumulative} total</title>
                        </circle>
                    );
                })}

                {/* X-axis labels (show first, middle, last) */}
                {data.length > 0 && (
                    <>
                        <text
                            x={padding.left}
                            y={height - 10}
                            fontSize="11"
                            fill="#666"
                            textAnchor="start"
                        >
                            {data[0].date}
                        </text>
                        {data.length > 2 && (
                            <text
                                x={300}
                                y={height - 10}
                                fontSize="11"
                                fill="#666"
                                textAnchor="middle"
                            >
                                {data[Math.floor(data.length / 2)].date}
                            </text>
                        )}
                        <text
                            x={600 - padding.right}
                            y={height - 10}
                            fontSize="11"
                            fill="#666"
                            textAnchor="end"
                        >
                            {data[data.length - 1].date}
                        </text>
                    </>
                )}

                {/* Y-axis labels (left: daily, right: cumulative) */}
                <text x={padding.left - 5} y={padding.top + 5} fontSize="11" fill="#c94a4a" textAnchor="end">{maxCount}</text>
                <text x={padding.left - 5} y={padding.top + chartHeight} fontSize="11" fill="#c94a4a" textAnchor="end">0</text>
                <text x={600 - padding.right + 5} y={padding.top + 5} fontSize="11" fill="#4a7c9b" textAnchor="start">{maxCumulative}</text>
                <text x={600 - padding.right + 5} y={padding.top + chartHeight} fontSize="11" fill="#4a7c9b" textAnchor="start">0</text>
            </svg>
            <div className="timeline-legend">
                <span className="legend-item"><span className="dot bar" /> Daily responses</span>
                <span className="legend-item"><span className="dot line" /> Cumulative total</span>
            </div>
            <style jsx>{`
                .timeline-chart {
                    width: 100%;
                }
                .timeline-legend {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: #666;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }
                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
                .dot.bar {
                    background: #c94a4a;
                    opacity: 0.7;
                }
                .dot.line {
                    background: #4a7c9b;
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
}

// Helper to format duration in human-readable form
function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Calculate timeline data from responses
function calculateTimelineData(responses: SurveyResponseWithData[]): TimelineDataPoint[] {
    // Group responses by date
    const dateMap = new Map<string, number>();

    for (const response of responses) {
        const timestamp = response.completed_at || response.started_at;
        if (!timestamp) continue;

        const date = new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }

    // Sort by date and calculate cumulative
    const entries = Array.from(dateMap.entries());

    // Sort entries by actual date
    entries.sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
    });

    let cumulative = 0;
    return entries.map(([date, count]) => {
        cumulative += count;
        return { date, count, cumulative };
    });
}

// Calculate average completion time
function calculateAvgCompletionTime(responses: SurveyResponseWithData[]): number | null {
    const completedResponses = responses.filter(r =>
        r.status === 'complete' && r.started_at && r.completed_at
    );

    if (completedResponses.length === 0) return null;

    const totalSeconds = completedResponses.reduce((sum, r) => {
        const start = new Date(r.started_at!).getTime();
        const end = new Date(r.completed_at!).getTime();
        return sum + (end - start) / 1000;
    }, 0);

    return totalSeconds / completedResponses.length;
}

// Drop-off Analysis Chart - shows where respondents abandon the survey
function DropOffChart({ data, height = 220 }: { data: DropOffPoint[]; height?: number }) {
    if (data.length === 0) {
        return (
            <div className="dropoff-empty">
                <p>No drop-off data available</p>
                <span>Drop-off analysis requires incomplete responses</span>
                <style jsx>{`
                    .dropoff-empty {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: ${height}px;
                        background: #fafaf9;
                        border-radius: 4px;
                        color: #666;
                        font-size: 0.875rem;
                        gap: 0.25rem;
                    }
                    .dropoff-empty p {
                        margin: 0;
                        font-weight: 500;
                    }
                    .dropoff-empty span {
                        font-size: 0.8rem;
                        color: #999;
                    }
                `}</style>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.dropOffCount), 1);
    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = 600;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = Math.min(40, (chartWidth - padding.left - padding.right) / data.length - 8);

    return (
        <div className="dropoff-chart">
            <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
                    <line
                        key={fraction}
                        x1={padding.left}
                        y1={padding.top + chartHeight * (1 - fraction)}
                        x2={chartWidth - padding.right}
                        y2={padding.top + chartHeight * (1 - fraction)}
                        stroke="#e0ddd8"
                        strokeDasharray="4,4"
                    />
                ))}

                {/* Bars */}
                {data.map((point, index) => {
                    const x = padding.left + (index / data.length) * (chartWidth - padding.left - padding.right) +
                              ((chartWidth - padding.left - padding.right) / data.length - barWidth) / 2;
                    const barHeight = (point.dropOffCount / maxCount) * chartHeight;
                    const y = padding.top + chartHeight - barHeight;

                    // Color intensity based on percentage
                    const intensity = Math.min(1, point.percentage / 30);
                    const color = `rgb(${201 - intensity * 20}, ${74 - intensity * 30}, ${74})`;

                    return (
                        <g key={point.questionId}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(2, barHeight)}
                                fill={color}
                                rx={2}
                                className="dropoff-bar"
                            >
                                <title>
                                    {point.questionCode}: {point.questionText.substring(0, 50)}...
                                    {'\n'}Drop-offs: {point.dropOffCount} ({point.percentage}%)
                                    {'\n'}Group: {point.groupTitle}
                                </title>
                            </rect>
                            {/* X-axis label - question code */}
                            <text
                                x={x + barWidth / 2}
                                y={height - padding.bottom + 15}
                                fontSize="10"
                                fill="#666"
                                textAnchor="middle"
                                transform={`rotate(-45, ${x + barWidth / 2}, ${height - padding.bottom + 15})`}
                            >
                                {point.questionCode.substring(0, 8)}
                            </text>
                        </g>
                    );
                })}

                {/* Y-axis labels */}
                <text x={padding.left - 10} y={padding.top + 5} fontSize="11" fill="#666" textAnchor="end">{maxCount}</text>
                <text x={padding.left - 10} y={padding.top + chartHeight / 2} fontSize="11" fill="#666" textAnchor="end">{Math.round(maxCount / 2)}</text>
                <text x={padding.left - 10} y={padding.top + chartHeight} fontSize="11" fill="#666" textAnchor="end">0</text>

                {/* Y-axis label */}
                <text
                    x={15}
                    y={padding.top + chartHeight / 2}
                    fontSize="11"
                    fill="#666"
                    textAnchor="middle"
                    transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
                >
                    Drop-offs
                </text>
            </svg>
            <style jsx>{`
                .dropoff-chart {
                    width: 100%;
                }
                .dropoff-chart :global(.dropoff-bar) {
                    transition: opacity 0.2s ease;
                    cursor: pointer;
                }
                .dropoff-chart :global(.dropoff-bar:hover) {
                    opacity: 0.8;
                }
            `}</style>
        </div>
    );
}

// Distribution Export Button - wrapper for dynamic refs
function DistributionExportButton({
    questionId,
    questionCode,
    chartRefs
}: {
    questionId: string;
    questionCode: string;
    chartRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
    const chartRef = useRef<HTMLDivElement | null>(null);

    // Update ref when the map changes
    useEffect(() => {
        chartRef.current = chartRefs.current.get(questionId) || null;
    });

    // Create a ref-like object for ChartExportButton
    const refObject = useRef<HTMLDivElement>(null);

    return (
        <ChartExportButton
            chartRef={{ current: chartRefs.current.get(questionId) || null } as React.RefObject<HTMLDivElement>}
            title={`Question ${questionCode}`}
        />
    );
}

// Calculate drop-off data from incomplete responses
function calculateDropOffData(
    survey: SurveyWithStructure,
    responses: SurveyResponseWithData[]
): DropOffPoint[] {
    // Get incomplete responses only
    const incompleteResponses = responses.filter(r => r.status === 'incomplete');
    if (incompleteResponses.length === 0) return [];

    // Build ordered list of questions
    const orderedQuestions: {
        id: string;
        code: string;
        text: string;
        groupTitle: string;
    }[] = [];

    for (const group of survey.question_groups.sort((a, b) => a.order_index - b.order_index)) {
        for (const question of group.questions.sort((a, b) => a.order_index - b.order_index)) {
            // Skip display-only questions
            if (question.question_type === 'text_display' || question.question_type === 'equation') {
                continue;
            }
            orderedQuestions.push({
                id: question.id,
                code: question.code,
                text: question.question_text,
                groupTitle: group.title || `Group ${group.order_index + 1}`
            });
        }
    }

    // For each incomplete response, find the last answered question
    const dropOffCounts = new Map<string, number>();

    for (const response of incompleteResponses) {
        // Find all question IDs that have answers
        const answeredQuestionIds = new Set(
            (response.response_data || []).map(rd => rd.question_id)
        );

        // Find the last answered question in order
        let lastAnsweredIndex = -1;
        for (let i = 0; i < orderedQuestions.length; i++) {
            if (answeredQuestionIds.has(orderedQuestions[i].id)) {
                lastAnsweredIndex = i;
            }
        }

        // The drop-off point is the question AFTER the last answered
        // (where they would have been when they quit)
        const dropOffIndex = lastAnsweredIndex + 1;
        if (dropOffIndex < orderedQuestions.length) {
            const dropOffQuestion = orderedQuestions[dropOffIndex];
            dropOffCounts.set(dropOffQuestion.id, (dropOffCounts.get(dropOffQuestion.id) || 0) + 1);
        } else if (lastAnsweredIndex >= 0) {
            // They answered the last question but didn't complete - count at last question
            const lastQuestion = orderedQuestions[lastAnsweredIndex];
            dropOffCounts.set(lastQuestion.id, (dropOffCounts.get(lastQuestion.id) || 0) + 1);
        } else if (orderedQuestions.length > 0) {
            // No answers at all - dropped off at first question
            const firstQuestion = orderedQuestions[0];
            dropOffCounts.set(firstQuestion.id, (dropOffCounts.get(firstQuestion.id) || 0) + 1);
        }
    }

    // Build drop-off data with percentages
    const totalIncomplete = incompleteResponses.length;
    let cumulativeDropOff = 0;

    return orderedQuestions.map(q => {
        const count = dropOffCounts.get(q.id) || 0;
        cumulativeDropOff += count;
        return {
            questionId: q.id,
            questionCode: q.code,
            questionText: q.text,
            groupTitle: q.groupTitle,
            dropOffCount: count,
            percentage: totalIncomplete > 0 ? Math.round((count / totalIncomplete) * 100) : 0,
            cumulativeDropOff,
            cumulativePercentage: totalIncomplete > 0 ? Math.round((cumulativeDropOff / totalIncomplete) * 100) : 0
        };
    }).filter(d => d.dropOffCount > 0); // Only show questions with drop-offs
}

export default function ResponseCharts({ surveyId }: ResponseChartsProps) {
    const [survey, setSurvey] = useState<SurveyWithStructure | null>(null);
    const [responses, setResponses] = useState<SurveyResponseWithData[]>([]);
    const [summary, setSummary] = useState<ResponseSummary | null>(null);
    const [distributions, setDistributions] = useState<QuestionDistribution[]>([]);
    const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
    const [avgCompletionTime, setAvgCompletionTime] = useState<number | null>(null);
    const [dropOffData, setDropOffData] = useState<DropOffPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs for chart export
    const timelineChartRef = useRef<HTMLDivElement>(null);
    const dropOffChartRef = useRef<HTMLDivElement>(null);
    const distributionChartRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Chart type preference - stored per question and globally
    const [globalChartType, setGlobalChartType] = useState<ChartType>('bar');
    const [questionChartTypes, setQuestionChartTypes] = useState<Record<string, ChartType>>({});

    // Load chart type preference from localStorage
    useEffect(() => {
        const savedGlobalType = localStorage.getItem('survey-chart-type');
        if (savedGlobalType === 'bar' || savedGlobalType === 'pie') {
            setGlobalChartType(savedGlobalType);
        }
        const savedQuestionTypes = localStorage.getItem(`survey-chart-types-${surveyId}`);
        if (savedQuestionTypes) {
            try {
                setQuestionChartTypes(JSON.parse(savedQuestionTypes));
            } catch {
                // Ignore parse errors
            }
        }
    }, [surveyId]);

    // Save global chart type preference
    const handleGlobalChartTypeChange = (type: ChartType) => {
        setGlobalChartType(type);
        localStorage.setItem('survey-chart-type', type);
    };

    // Get chart type for a specific question
    const getChartType = (questionId: string, questionType: string): ChartType => {
        // Only single-choice questions can use pie charts
        if (!supportsPieChart(questionType)) {
            return 'bar';
        }
        return questionChartTypes[questionId] ?? globalChartType;
    };

    // Set chart type for a specific question
    const setQuestionChartType = (questionId: string, type: ChartType) => {
        const newTypes = { ...questionChartTypes, [questionId]: type };
        setQuestionChartTypes(newTypes);
        localStorage.setItem(`survey-chart-types-${surveyId}`, JSON.stringify(newTypes));
    };

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                // Fetch survey structure and responses in parallel
                const [surveyRes, responsesRes] = await Promise.all([
                    fetch(`/api/survey/surveys/${surveyId}`),
                    fetch(`/api/survey/responses/${surveyId}`)
                ]);

                if (!surveyRes.ok) {
                    throw new Error('Failed to fetch survey');
                }
                if (!responsesRes.ok) {
                    throw new Error('Failed to fetch responses');
                }

                const surveyData = await surveyRes.json();
                const responsesData = await responsesRes.json();

                setSurvey(surveyData.data);
                const responsesList = responsesData.data.responses || [];
                setResponses(responsesList);
                setSummary(responsesData.data.summary);

                // Calculate timeline data
                const timeline = calculateTimelineData(responsesList);
                setTimelineData(timeline);

                // Calculate average completion time
                const avgTime = calculateAvgCompletionTime(responsesList);
                setAvgCompletionTime(avgTime);

                // Calculate distributions for multiple choice questions
                if (surveyData.data && responsesData.data.responses) {
                    const dists = calculateDistributions(
                        surveyData.data,
                        responsesData.data.responses
                    );
                    setDistributions(dists);

                    // Calculate drop-off data
                    const dropOff = calculateDropOffData(surveyData.data, responsesList);
                    setDropOffData(dropOff);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [surveyId]);

    // Calculate response distributions for multiple choice questions
    function calculateDistributions(
        surveyData: SurveyWithStructure,
        responseData: SurveyResponseWithData[]
    ): QuestionDistribution[] {
        const distributions: QuestionDistribution[] = [];

        // Flatten all questions from groups
        const allQuestions = surveyData.question_groups
            .flatMap(group => group.questions)
            .filter(q =>
                q.question_type === 'multiple_choice_single' ||
                q.question_type === 'multiple_choice_multiple' ||
                q.question_type === 'yes_no' ||
                q.question_type === 'dropdown'
            );

        for (const question of allQuestions) {
            // Get all response values for this question
            const questionResponses: string[] = [];

            for (const response of responseData) {
                if (response.status !== 'complete') continue;

                const responseValue = response.response_data?.find(
                    rd => rd.question_id === question.id && !rd.subquestion_id
                );

                if (responseValue?.value) {
                    // Handle multiple choice multiple (array of values)
                    try {
                        const parsed = JSON.parse(responseValue.value);
                        if (Array.isArray(parsed)) {
                            questionResponses.push(...parsed);
                        } else {
                            questionResponses.push(responseValue.value);
                        }
                    } catch {
                        questionResponses.push(responseValue.value);
                    }
                }
            }

            // Count occurrences for each option
            const optionCounts = new Map<string, number>();
            for (const value of questionResponses) {
                optionCounts.set(value, (optionCounts.get(value) || 0) + 1);
            }

            // Build options with counts and percentages
            const totalForQuestion = question.question_type === 'multiple_choice_multiple'
                ? questionResponses.length // Total selections for multi-select
                : responseData.filter(r => r.status === 'complete').length;

            // Use answer_options if available, otherwise use counted values
            let options: { code: string; label: string; count: number; percentage: number }[];

            if (question.answer_options && question.answer_options.length > 0) {
                options = question.answer_options
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(opt => ({
                        code: opt.code,
                        label: opt.label,
                        count: optionCounts.get(opt.code) || 0,
                        percentage: totalForQuestion > 0
                            ? Math.round(((optionCounts.get(opt.code) || 0) / totalForQuestion) * 100)
                            : 0
                    }));
            } else if (question.question_type === 'yes_no') {
                options = [
                    { code: 'Y', label: 'Yes', count: optionCounts.get('Y') || 0, percentage: 0 },
                    { code: 'N', label: 'No', count: optionCounts.get('N') || 0, percentage: 0 }
                ];
                options = options.map(opt => ({
                    ...opt,
                    percentage: totalForQuestion > 0
                        ? Math.round((opt.count / totalForQuestion) * 100)
                        : 0
                }));
            } else {
                // Fallback: use the values we found
                options = Array.from(optionCounts.entries()).map(([code, count]) => ({
                    code,
                    label: code,
                    count,
                    percentage: totalForQuestion > 0
                        ? Math.round((count / totalForQuestion) * 100)
                        : 0
                }));
            }

            distributions.push({
                questionId: question.id,
                questionCode: question.code,
                questionText: question.question_text,
                questionType: question.question_type,
                options,
                totalResponses: totalForQuestion
            });
        }

        return distributions;
    }

    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="loading-spinner" />
                <p>Loading analytics...</p>
                <style jsx>{`
                    .analytics-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 4rem;
                        color: #1a1d24;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid #e0ddd8;
                        border-top-color: #c94a4a;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 1rem;
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
            <div className="analytics-error">
                <p>Error: {error}</p>
                <style jsx>{`
                    .analytics-error {
                        padding: 2rem;
                        background: #fff5f5;
                        border: 1px solid #c94a4a;
                        border-radius: 8px;
                        color: #c94a4a;
                        text-align: center;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="response-analytics">
            {/* Summary Cards */}
            <div className="summary-section">
                <h2>Response Summary</h2>
                <div className="summary-cards">
                    <div className="summary-card">
                        <div className="card-value">{summary?.total || 0}</div>
                        <div className="card-label">Total Responses</div>
                    </div>
                    <div className="summary-card highlight">
                        <div className="card-value">{summary?.completed || 0}</div>
                        <div className="card-label">Completed</div>
                    </div>
                    <div className="summary-card">
                        <div className="card-value">{summary?.incomplete || 0}</div>
                        <div className="card-label">Incomplete</div>
                    </div>
                    <div className="summary-card">
                        <div className="card-value">{summary?.completionRate || 0}%</div>
                        <div className="card-label">Completion Rate</div>
                    </div>
                    {avgCompletionTime !== null && (
                        <div className="summary-card">
                            <div className="card-value">{formatDuration(avgCompletionTime)}</div>
                            <div className="card-label">Avg. Completion Time</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Response Timeline */}
            {timelineData.length > 0 && (
                <div className="timeline-section">
                    <div className="section-header">
                        <h3>Response Timeline</h3>
                        <ChartExportButton
                            chartRef={timelineChartRef}
                            title="Response Timeline"
                        />
                    </div>
                    <div ref={timelineChartRef}>
                        <ResponseTimeline data={timelineData} height={220} />
                    </div>
                </div>
            )}

            {/* Completion Rate Visual */}
            <div className="completion-visual">
                <h3>Completion Rate</h3>
                <div className="completion-bar-container">
                    <div
                        className="completion-bar-fill"
                        style={{ width: `${summary?.completionRate || 0}%` }}
                    />
                    <span className="completion-bar-label">
                        {summary?.completionRate || 0}%
                    </span>
                </div>
            </div>

            {/* Drop-off Analysis */}
            {summary && summary.incomplete > 0 && (
                <div className="dropoff-section">
                    <div className="section-header">
                        <h3>Drop-off Analysis</h3>
                        <ChartExportButton
                            chartRef={dropOffChartRef}
                            title="Drop-off Analysis"
                        />
                    </div>
                    <p className="section-description">
                        Shows where respondents abandoned the survey. Higher bars indicate questions where more people quit.
                    </p>
                    <div ref={dropOffChartRef}>
                        <DropOffChart data={dropOffData} height={250} />
                    </div>
                    {dropOffData.length > 0 && (
                        <div className="dropoff-table">
                            <h4>Top Drop-off Points</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Question</th>
                                        <th>Group</th>
                                        <th>Drop-offs</th>
                                        <th>% of Incomplete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dropOffData
                                        .sort((a, b) => b.dropOffCount - a.dropOffCount)
                                        .slice(0, 5)
                                        .map(point => (
                                            <tr key={point.questionId}>
                                                <td>
                                                    <span className="q-code">{point.questionCode}</span>
                                                    <span className="q-text">{point.questionText.substring(0, 60)}{point.questionText.length > 60 ? '...' : ''}</span>
                                                </td>
                                                <td>{point.groupTitle}</td>
                                                <td className="count">{point.dropOffCount}</td>
                                                <td className="percentage">{point.percentage}%</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Question Distribution Charts */}
            {distributions.length > 0 && (
                <div className="distributions-section">
                    <div className="distributions-header">
                        <h2>Response Distributions</h2>
                        <div className="global-chart-toggle">
                            <span className="toggle-label">Default chart:</span>
                            <button
                                className={`toggle-btn ${globalChartType === 'bar' ? 'active' : ''}`}
                                onClick={() => handleGlobalChartTypeChange('bar')}
                                title="Bar Chart"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <rect x="1" y="8" width="3" height="7" />
                                    <rect x="6" y="4" width="3" height="11" />
                                    <rect x="11" y="1" width="3" height="14" />
                                </svg>
                                Bar
                            </button>
                            <button
                                className={`toggle-btn ${globalChartType === 'pie' ? 'active' : ''}`}
                                onClick={() => handleGlobalChartTypeChange('pie')}
                                title="Pie Chart"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 1v6h6a6 6 0 1 0-6-6z"/>
                                    <path d="M8 2v6h6a6 6 0 0 0-6-6z" fillOpacity="0.5"/>
                                </svg>
                                Pie
                            </button>
                        </div>
                    </div>
                    {distributions.map(dist => {
                        const chartType = getChartType(dist.questionId, dist.questionType);
                        const canUsePie = supportsPieChart(dist.questionType);

                        return (
                            <div
                                key={dist.questionId}
                                className="distribution-card"
                                ref={(el) => {
                                    if (el) distributionChartRefs.current.set(dist.questionId, el);
                                }}
                            >
                                <div className="question-header">
                                    <span className="question-code">{dist.questionCode}</span>
                                    <h3>{dist.questionText}</h3>
                                    <div className="question-header-right">
                                        <span className="response-count">
                                            {dist.totalResponses} response{dist.totalResponses !== 1 ? 's' : ''}
                                        </span>
                                        {canUsePie && (
                                            <div className="chart-type-toggle">
                                                <button
                                                    className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                                                    onClick={() => setQuestionChartType(dist.questionId, 'bar')}
                                                    title="Bar Chart"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                        <rect x="1" y="8" width="3" height="7" />
                                                        <rect x="6" y="4" width="3" height="11" />
                                                        <rect x="11" y="1" width="3" height="14" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className={`chart-toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
                                                    onClick={() => setQuestionChartType(dist.questionId, 'pie')}
                                                    title="Pie Chart"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 1v6h6a6 6 0 1 0-6-6z"/>
                                                        <path d="M8 2v6h6a6 6 0 0 0-6-6z" fillOpacity="0.5"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                        <DistributionExportButton
                                            questionId={dist.questionId}
                                            questionCode={dist.questionCode}
                                            chartRefs={distributionChartRefs}
                                        />
                                    </div>
                                </div>

                                {chartType === 'pie' ? (
                                    <div className="pie-chart-wrapper">
                                        <PieChart options={dist.options} size={180} />
                                        <PieLegend options={dist.options} />
                                    </div>
                                ) : (
                                    <div className="bar-chart">
                                        {dist.options.map(option => (
                                            <div key={option.code} className="bar-row">
                                                <div className="bar-label">{option.label}</div>
                                                <div className="bar-container">
                                                    <div
                                                        className="bar-fill"
                                                        style={{ width: `${option.percentage}%` }}
                                                    />
                                                </div>
                                                <div className="bar-stats">
                                                    <span className="bar-count">{option.count}</span>
                                                    <span className="bar-percentage">({option.percentage}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {distributions.length === 0 && summary && summary.total > 0 && (
                <div className="no-charts">
                    <p>No multiple choice questions with responses to display.</p>
                </div>
            )}

            {summary && summary.total === 0 && (
                <div className="no-responses">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1a1d24" strokeWidth="1.5">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        <path d="M12 12v4M12 16h.01" />
                    </svg>
                    <p>No responses yet</p>
                    <span>Responses will appear here once participants complete the survey.</span>
                </div>
            )}

            <style jsx>{`
                .response-analytics {
                    padding: 2rem;
                    background: #f5f3ef;
                    min-height: 100vh;
                    font-family: 'Libre Baskerville', Georgia, serif;
                }

                .summary-section {
                    margin-bottom: 2rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .section-header h3 {
                    margin: 0;
                }

                .summary-section h2,
                .distributions-section h2 {
                    color: #1a1d24;
                    font-size: 1.5rem;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                }

                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                }

                .summary-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    text-align: center;
                }

                .summary-card.highlight {
                    border-left: 4px solid #c94a4a;
                }

                .card-value {
                    font-size: 2.5rem;
                    font-weight: 600;
                    color: #1a1d24;
                    line-height: 1.2;
                }

                .summary-card.highlight .card-value {
                    color: #c94a4a;
                }

                .card-label {
                    font-size: 0.875rem;
                    color: #666;
                    margin-top: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .timeline-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2rem;
                }

                .timeline-section h3 {
                    font-size: 1rem;
                    color: #1a1d24;
                    margin-bottom: 1rem;
                    font-weight: 500;
                }

                .completion-visual {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2rem;
                }

                .completion-visual h3 {
                    font-size: 1rem;
                    color: #1a1d24;
                    margin-bottom: 1rem;
                    font-weight: 500;
                }

                .dropoff-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2rem;
                }

                .dropoff-section h3 {
                    font-size: 1rem;
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .dropoff-section h4 {
                    font-size: 0.9rem;
                    color: #1a1d24;
                    margin: 1.5rem 0 0.75rem;
                    font-weight: 500;
                }

                .section-description {
                    font-size: 0.875rem;
                    color: #666;
                    margin-bottom: 1rem;
                }

                .dropoff-table {
                    margin-top: 1rem;
                }

                .dropoff-table table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .dropoff-table th,
                .dropoff-table td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #e0ddd8;
                }

                .dropoff-table th {
                    background: #fafaf9;
                    font-weight: 500;
                    color: #666;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }

                .dropoff-table td.count,
                .dropoff-table td.percentage {
                    font-weight: 600;
                    text-align: right;
                    white-space: nowrap;
                }

                .dropoff-table td.percentage {
                    color: #c94a4a;
                }

                .dropoff-table .q-code {
                    display: block;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 0.75rem;
                    color: #666;
                    margin-bottom: 0.25rem;
                }

                .dropoff-table .q-text {
                    display: block;
                    color: #1a1d24;
                }

                @media (max-width: 600px) {
                    .dropoff-table th:nth-child(2),
                    .dropoff-table td:nth-child(2) {
                        display: none;
                    }
                }

                .completion-bar-container {
                    position: relative;
                    height: 32px;
                    background: #e0ddd8;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .completion-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #c94a4a 0%, #d65a5a 100%);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }

                .completion-bar-label {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #1a1d24;
                }

                .distributions-section {
                    margin-top: 2rem;
                }

                .distributions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .distributions-header h2 {
                    margin-bottom: 0;
                }

                .global-chart-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .toggle-label {
                    font-size: 0.875rem;
                    color: #666;
                }

                .toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #e0ddd8;
                    background: white;
                    color: #666;
                    font-size: 0.875rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                .toggle-btn:hover {
                    border-color: #c94a4a;
                    color: #c94a4a;
                }

                .toggle-btn.active {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                .distribution-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 1.5rem;
                }

                .question-header {
                    margin-bottom: 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 0.5rem;
                }

                .question-code {
                    background: #f5f3ef;
                    color: #666;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-family: 'SF Mono', Monaco, monospace;
                    text-transform: uppercase;
                }

                .question-header h3 {
                    font-size: 1.125rem;
                    color: #1a1d24;
                    font-weight: 500;
                    flex: 1;
                    margin: 0;
                    min-width: 200px;
                }

                .question-header-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-shrink: 0;
                }

                .response-count {
                    font-size: 0.875rem;
                    color: #666;
                }

                .chart-type-toggle {
                    display: flex;
                    gap: 0.25rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .chart-toggle-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.375rem;
                    border: none;
                    background: white;
                    color: #999;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .chart-toggle-btn:first-child {
                    border-right: 1px solid #e0ddd8;
                }

                .chart-toggle-btn:hover {
                    color: #c94a4a;
                    background: #faf9f7;
                }

                .chart-toggle-btn.active {
                    background: #c94a4a;
                    color: white;
                }

                .pie-chart-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1rem 0;
                }

                @media (min-width: 600px) {
                    .pie-chart-wrapper {
                        flex-direction: row;
                        justify-content: center;
                        gap: 2rem;
                    }
                }

                .bar-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .bar-row {
                    display: grid;
                    grid-template-columns: 150px 1fr 80px;
                    gap: 1rem;
                    align-items: center;
                }

                @media (max-width: 600px) {
                    .bar-row {
                        grid-template-columns: 1fr;
                        gap: 0.25rem;
                    }
                    .bar-label {
                        font-size: 0.875rem;
                    }
                }

                .bar-label {
                    font-size: 0.9rem;
                    color: #1a1d24;
                    text-align: right;
                    word-break: break-word;
                }

                @media (max-width: 600px) {
                    .bar-label {
                        text-align: left;
                    }
                }

                .bar-container {
                    height: 24px;
                    background: #f5f3ef;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    background: #c94a4a;
                    border-radius: 4px;
                    transition: width 0.4s ease;
                    min-width: 2px;
                }

                .bar-stats {
                    display: flex;
                    gap: 0.25rem;
                    font-size: 0.875rem;
                }

                .bar-count {
                    font-weight: 600;
                    color: #1a1d24;
                }

                .bar-percentage {
                    color: #666;
                }

                .no-charts,
                .no-responses {
                    background: white;
                    padding: 3rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    text-align: center;
                    color: #666;
                }

                .no-responses svg {
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .no-responses p {
                    font-size: 1.125rem;
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                }

                .no-responses span {
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}
