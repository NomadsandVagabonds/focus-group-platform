// Ranking Question Component
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Question, AnswerOption } from '@/lib/supabase/survey-types';

// Seeded shuffle function for stable randomization
function seededShuffle<T>(array: T[], seed: string): T[] {
    const result = [...array];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const random = () => {
        hash |= 0;
        hash = hash + 0x6D2B79F5 | 0;
        let t = Math.imul(hash ^ hash >>> 15, 1 | hash);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

interface RankingQuestionProps {
    question: Question & { answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any) => void;
    randomizationSeed?: string;
}

export default function RankingQuestion({ question, responseData, onAnswer, randomizationSeed }: RankingQuestionProps) {
    // Apply randomization to initial options if configured
    const allOptions = useMemo(() => {
        let opts = [...question.answer_options].sort((a, b) => a.order_index - b.order_index);

        if (question.settings.randomize_answers && randomizationSeed) {
            opts = seededShuffle(opts, `${randomizationSeed}_${question.code}`);
        }

        return opts;
    }, [question, randomizationSeed]);

    const currentRanking = responseData.get(question.code) || [];

    const [available, setAvailable] = useState<AnswerOption[]>([]);
    const [ranked, setRanked] = useState<AnswerOption[]>([]);

    useEffect(() => {
        if (currentRanking.length > 0) {
            const rankedOptions = currentRanking
                .map((code: string) => allOptions.find(opt => opt.code === code))
                .filter(Boolean);
            const availableOptions = allOptions.filter(
                opt => !currentRanking.includes(opt.code)
            );
            setRanked(rankedOptions);
            setAvailable(availableOptions);
        } else {
            setAvailable(allOptions);
            setRanked([]);
        }
    }, [allOptions]);

    const moveToRanked = (option: AnswerOption) => {
        const newAvailable = available.filter(opt => opt.id !== option.id);
        const newRanked = [...ranked, option];
        setAvailable(newAvailable);
        setRanked(newRanked);
        onAnswer(question.code, newRanked.map(opt => opt.code));
    };

    const moveToAvailable = (option: AnswerOption) => {
        const newRanked = ranked.filter(opt => opt.id !== option.id);
        const newAvailable = [...available, option];
        setRanked(newRanked);
        setAvailable(newAvailable);
        onAnswer(question.code, newRanked.map(opt => opt.code));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newRanked = [...ranked];
        [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
        setRanked(newRanked);
        onAnswer(question.code, newRanked.map(opt => opt.code));
    };

    const moveDown = (index: number) => {
        if (index === ranked.length - 1) return;
        const newRanked = [...ranked];
        [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
        setRanked(newRanked);
        onAnswer(question.code, newRanked.map(opt => opt.code));
    };

    return (
        <div className="ranking-question">
            <div className="ranking-container">
                <div className="ranking-column">
                    <h4>Available Items</h4>
                    <p className="help-text">Click an item to add it to your ranking</p>
                    <div className="item-list">
                        {available.map(option => (
                            <div
                                key={option.id}
                                className="ranking-item available"
                                onClick={() => moveToRanked(option)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ranking-column">
                    <h4>Your Ranking</h4>
                    <p className="help-text">Most important (top) to least important (bottom)</p>
                    <div className="item-list">
                        {ranked.map((option, index) => (
                            <div key={option.id} className="ranking-item ranked">
                                <span className="rank-number">{index + 1}</span>
                                <span className="item-label">{option.label}</span>
                                <div className="item-controls">
                                    <button
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        className="move-btn"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === ranked.length - 1}
                                        className="move-btn"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={() => moveToAvailable(option)}
                                        className="remove-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                        {ranked.length === 0 && (
                            <div className="empty-state">
                                No items ranked yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .ranking-question {
          margin: 1rem 0;
        }

        .ranking-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .ranking-column h4 {
          font-size: 1rem;
          color: #1a1d24;
          margin-bottom: 0.5rem;
        }

        .help-text {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .item-list {
          border: 1px solid #e0ddd8;
          border-radius: 4px;
          min-height: 200px;
          padding: 0.5rem;
          background: #fafafa;
        }

        .ranking-item {
          background: white;
          border: 1px solid #e0ddd8;
          border-radius: 4px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ranking-item.available:hover {
          background: #f5f3ef;
          border-color: #c94a4a;
        }

        .ranking-item.ranked {
          cursor: default;
        }

        .rank-number {
          background: #c94a4a;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        .item-label {
          flex: 1;
        }

        .item-controls {
          display: flex;
          gap: 0.25rem;
        }

        .move-btn,
        .remove-btn {
          background: #e0ddd8;
          border: none;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .move-btn:hover:not(:disabled),
        .remove-btn:hover {
          background: #d0cdc8;
        }

        .move-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .remove-btn {
          background: #f8d7da;
          color: #721c24;
        }

        .remove-btn:hover {
          background: #f5c6cb;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #999;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .ranking-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
