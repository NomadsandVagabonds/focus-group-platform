'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

interface TextAnalysisProps {
    surveyId: string;
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
    response_data: ResponseData[];
}

interface TextQuestion {
    id: string;
    code: string;
    text: string;
    type: string;
    responseCount: number;
}

interface WordFrequency {
    word: string;
    count: number;
    percentage: number;
}

// Common stop words to exclude from word cloud
const STOP_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
    'am', 'very', 'more', 'much', 'such', 'those', 'dont', "don't", 'im', "i'm",
    'ive', "i've", 'id', "i'd", 'ill', "i'll", 'its', "it's", 'thats', "that's",
    'really', 'thing', 'things', 'lot', 'etc', 'may', 'might', 'must', 'should',
]);

// Word Cloud SVG Component
function WordCloud({ words, width = 600, height = 300 }: {
    words: WordFrequency[];
    width?: number;
    height?: number;
}) {
    if (words.length === 0) {
        return (
            <div className="wordcloud-empty">
                <p>No text responses to analyze</p>
                <style jsx>{`
                    .wordcloud-empty {
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

    const maxCount = Math.max(...words.map(w => w.count));
    const minCount = Math.min(...words.map(w => w.count));

    // Calculate font sizes (range: 12px to 48px)
    const getFontSize = (count: number) => {
        if (maxCount === minCount) return 24;
        const normalized = (count - minCount) / (maxCount - minCount);
        return Math.round(12 + normalized * 36);
    };

    // Colors based on frequency
    const getColor = (count: number) => {
        const normalized = (count - minCount) / (maxCount - minCount || 1);
        if (normalized > 0.7) return '#c94a4a'; // High frequency - crimson
        if (normalized > 0.4) return '#4a7c9b'; // Medium - blue
        return '#6b8e5e'; // Low - green
    };

    // Simple spiral placement algorithm
    const placedWords: { word: string; x: number; y: number; size: number; color: string }[] = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (const wordData of words.slice(0, 50)) { // Limit to 50 words
        const fontSize = getFontSize(wordData.count);
        const color = getColor(wordData.count);

        // Estimate word width (rough)
        const wordWidth = wordData.word.length * fontSize * 0.5;
        const wordHeight = fontSize * 1.2;

        // Try to place word in spiral pattern
        let placed = false;
        let spiralAngle = 0;
        let spiralRadius = 0;

        while (!placed && spiralRadius < Math.min(width, height) / 2) {
            const x = centerX + spiralRadius * Math.cos(spiralAngle) - wordWidth / 2;
            const y = centerY + spiralRadius * Math.sin(spiralAngle);

            // Check bounds
            if (x > 10 && x + wordWidth < width - 10 &&
                y - wordHeight / 2 > 10 && y + wordHeight / 2 < height - 10) {

                // Check for collisions with placed words (simplified)
                let collision = false;
                for (const placed of placedWords) {
                    const placedWidth = placed.word.length * placed.size * 0.5;
                    const dx = Math.abs(x - placed.x);
                    const dy = Math.abs(y - placed.y);
                    if (dx < (wordWidth + placedWidth) / 2 + 5 &&
                        dy < (wordHeight + placed.size * 1.2) / 2 + 2) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    placedWords.push({
                        word: wordData.word,
                        x,
                        y,
                        size: fontSize,
                        color
                    });
                    placed = true;
                }
            }

            spiralAngle += 0.5;
            spiralRadius += 1;
        }
    }

    return (
        <div className="wordcloud-container">
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                {placedWords.map((w, i) => (
                    <text
                        key={`${w.word}-${i}`}
                        x={w.x}
                        y={w.y}
                        fontSize={w.size}
                        fill={w.color}
                        fontFamily="'Libre Baskerville', Georgia, serif"
                        className="wordcloud-word"
                    >
                        <title>{w.word}: {words.find(wd => wd.word === w.word)?.count || 0} occurrences</title>
                        {w.word}
                    </text>
                ))}
            </svg>
            <style jsx>{`
                .wordcloud-container {
                    width: 100%;
                    background: #fafaf9;
                    border-radius: 4px;
                    padding: 1rem;
                }
                .wordcloud-container :global(.wordcloud-word) {
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }
                .wordcloud-container :global(.wordcloud-word:hover) {
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
}

// Top Words Table
function TopWordsTable({ words }: { words: WordFrequency[] }) {
    return (
        <div className="top-words-table">
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Word</th>
                        <th>Count</th>
                        <th>% of Total</th>
                    </tr>
                </thead>
                <tbody>
                    {words.slice(0, 20).map((word, index) => (
                        <tr key={word.word}>
                            <td className="rank">{index + 1}</td>
                            <td className="word">{word.word}</td>
                            <td className="count">{word.count}</td>
                            <td className="percentage">{word.percentage.toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <style jsx>{`
                .top-words-table {
                    margin-top: 1.5rem;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                th, td {
                    padding: 0.5rem 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #e0ddd8;
                }
                th {
                    background: #fafaf9;
                    font-weight: 500;
                    color: #666;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                td.rank {
                    color: #999;
                    font-size: 0.8rem;
                    width: 50px;
                }
                td.word {
                    font-weight: 500;
                    color: #1a1d24;
                }
                td.count {
                    font-weight: 600;
                    text-align: right;
                    width: 80px;
                }
                td.percentage {
                    color: #c94a4a;
                    text-align: right;
                    width: 80px;
                }
            `}</style>
        </div>
    );
}

// Extract words from text and calculate frequencies
function analyzeText(texts: string[]): WordFrequency[] {
    const wordCounts = new Map<string, number>();
    let totalWords = 0;

    for (const text of texts) {
        // Tokenize: split on whitespace and punctuation, lowercase
        const words = text
            .toLowerCase()
            .replace(/[^\w\s'-]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));

        for (const word of words) {
            const cleanWord = word.replace(/^['-]+|['-]+$/g, ''); // Remove leading/trailing punctuation
            if (cleanWord.length > 2) {
                wordCounts.set(cleanWord, (wordCounts.get(cleanWord) || 0) + 1);
                totalWords++;
            }
        }
    }

    // Convert to array and sort by frequency
    return Array.from(wordCounts.entries())
        .map(([word, count]) => ({
            word,
            count,
            percentage: totalWords > 0 ? (count / totalWords) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);
}

export default function TextAnalysis({ surveyId }: TextAnalysisProps) {
    const [survey, setSurvey] = useState<SurveyWithStructure | null>(null);
    const [responses, setResponses] = useState<SurveyResponseWithData[]>([]);
    const [textQuestions, setTextQuestions] = useState<TextQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const [surveyRes, responsesRes] = await Promise.all([
                    fetch(`/api/survey/surveys/${surveyId}`),
                    fetch(`/api/survey/responses/${surveyId}`)
                ]);

                if (!surveyRes.ok) throw new Error('Failed to fetch survey');
                if (!responsesRes.ok) throw new Error('Failed to fetch responses');

                const surveyData = await surveyRes.json();
                const responsesData = await responsesRes.json();

                setSurvey(surveyData.data);
                const responsesList = responsesData.data.responses || [];
                setResponses(responsesList);

                // Find text questions
                if (surveyData.data) {
                    const questions: TextQuestion[] = [];
                    for (const group of surveyData.data.question_groups) {
                        for (const question of group.questions) {
                            if (['text', 'long_text', 'huge_free_text'].includes(question.question_type)) {
                                // Count responses for this question
                                const count = responsesList.filter((r: SurveyResponseWithData) =>
                                    r.status === 'complete' &&
                                    r.response_data?.some(rd => rd.question_id === question.id && rd.value?.trim())
                                ).length;

                                questions.push({
                                    id: question.id,
                                    code: question.code,
                                    text: question.question_text,
                                    type: question.question_type,
                                    responseCount: count
                                });
                            }
                        }
                    }
                    setTextQuestions(questions);
                    if (questions.length > 0) {
                        setSelectedQuestion(questions[0].id);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [surveyId]);

    // Get text responses for selected question
    const textResponses = useMemo(() => {
        if (!selectedQuestion) return [];
        return responses
            .filter(r => r.status === 'complete')
            .flatMap(r => r.response_data || [])
            .filter(rd => rd.question_id === selectedQuestion && rd.value?.trim())
            .map(rd => rd.value);
    }, [responses, selectedQuestion]);

    // Analyze text
    const wordFrequencies = useMemo(() => analyzeText(textResponses), [textResponses]);

    const selectedQuestionData = textQuestions.find(q => q.id === selectedQuestion);

    if (loading) {
        return (
            <div className="text-analysis-loading">
                <div className="loading-spinner" />
                <p>Loading text analysis...</p>
                <style jsx>{`
                    .text-analysis-loading {
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
            <div className="text-analysis-error">
                <p>Error: {error}</p>
                <style jsx>{`
                    .text-analysis-error {
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

    if (textQuestions.length === 0) {
        return (
            <div className="no-text-questions">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1a1d24" strokeWidth="1.5">
                    <path d="M4 6h16M4 12h10M4 18h14" />
                </svg>
                <p>No text questions in this survey</p>
                <span>Text analysis is available for short text, long text, and huge text questions.</span>
                <style jsx>{`
                    .no-text-questions {
                        background: white;
                        padding: 3rem;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        text-align: center;
                        color: #666;
                    }
                    .no-text-questions svg {
                        margin-bottom: 1rem;
                        opacity: 0.5;
                    }
                    .no-text-questions p {
                        font-size: 1.125rem;
                        color: #1a1d24;
                        margin-bottom: 0.5rem;
                    }
                    .no-text-questions span {
                        font-size: 0.875rem;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="text-analysis">
            {/* Question Selector */}
            <div className="question-selector">
                <label>Select text question to analyze:</label>
                <select
                    value={selectedQuestion || ''}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                >
                    {textQuestions.map(q => (
                        <option key={q.id} value={q.id}>
                            [{q.code}] {q.text.substring(0, 60)}{q.text.length > 60 ? '...' : ''} ({q.responseCount} responses)
                        </option>
                    ))}
                </select>
            </div>

            {/* Word Cloud Section */}
            <div className="analysis-card">
                <div className="card-header">
                    <h3>Word Cloud</h3>
                    {selectedQuestionData && (
                        <span className="response-count">
                            {selectedQuestionData.responseCount} response{selectedQuestionData.responseCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <WordCloud words={wordFrequencies} />
            </div>

            {/* Statistics */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-value">{textResponses.length}</div>
                    <div className="stat-label">Responses</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{wordFrequencies.reduce((sum, w) => sum + w.count, 0)}</div>
                    <div className="stat-label">Total Words</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{wordFrequencies.length}</div>
                    <div className="stat-label">Unique Words</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {textResponses.length > 0
                            ? Math.round(wordFrequencies.reduce((sum, w) => sum + w.count, 0) / textResponses.length)
                            : 0}
                    </div>
                    <div className="stat-label">Avg Words/Response</div>
                </div>
            </div>

            {/* Top Words Table */}
            <div className="analysis-card">
                <h3>Top Words</h3>
                <TopWordsTable words={wordFrequencies} />
            </div>

            {/* Sample Responses */}
            {textResponses.length > 0 && (
                <div className="analysis-card">
                    <h3>Sample Responses</h3>
                    <div className="sample-responses">
                        {textResponses.slice(0, 5).map((text, index) => (
                            <div key={index} className="response-sample">
                                <span className="sample-number">{index + 1}</span>
                                <p>{text}</p>
                            </div>
                        ))}
                        {textResponses.length > 5 && (
                            <p className="more-responses">
                                + {textResponses.length - 5} more response{textResponses.length - 5 !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .text-analysis {
                    padding: 2rem;
                    background: #f5f3ef;
                    min-height: 100vh;
                    font-family: 'Libre Baskerville', Georgia, serif;
                }

                .question-selector {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2rem;
                }

                .question-selector label {
                    display: block;
                    font-size: 0.875rem;
                    color: #666;
                    margin-bottom: 0.5rem;
                }

                .question-selector select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-family: inherit;
                    background: white;
                    color: #1a1d24;
                }

                .question-selector select:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .analysis-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 1.5rem;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .analysis-card h3 {
                    font-size: 1rem;
                    color: #1a1d24;
                    font-weight: 500;
                    margin: 0;
                }

                .response-count {
                    font-size: 0.875rem;
                    color: #666;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.25rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    text-align: center;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 600;
                    color: #1a1d24;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 0.25rem;
                }

                .sample-responses {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .response-sample {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: #fafaf9;
                    border-radius: 4px;
                    border-left: 3px solid #c94a4a;
                }

                .sample-number {
                    font-size: 0.875rem;
                    color: #999;
                    font-weight: 500;
                    flex-shrink: 0;
                }

                .response-sample p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #1a1d24;
                    line-height: 1.5;
                }

                .more-responses {
                    text-align: center;
                    color: #666;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                }
            `}</style>
        </div>
    );
}
