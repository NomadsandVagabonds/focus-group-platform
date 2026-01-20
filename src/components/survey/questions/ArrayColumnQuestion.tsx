// Array by Column Question Component (LimeSurvey Type H)
// Transposed array: answer_options = rows, subquestions = columns
'use client';

import { useMemo } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ArrayColumnQuestionProps {
  question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
  responseData: Map<string, any>;
  onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
  randomizationSeed?: string;
}

// Seeded shuffle function for stable randomization
function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Mulberry32 PRNG
  const random = () => {
    hash |= 0;
    hash = hash + 0x6D2B79F5 | 0;
    let t = Math.imul(hash ^ hash >>> 15, 1 | hash);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export default function ArrayColumnQuestion({
  question,
  responseData,
  onAnswer,
  randomizationSeed
}: ArrayColumnQuestionProps) {
  // Subquestions become columns (apply randomization if configured)
  const subquestions = useMemo(() => {
    let subqs = [...question.subquestions].sort((a, b) => a.order_index - b.order_index);

    if (question.settings.randomize_subquestions && randomizationSeed) {
      subqs = seededShuffle(subqs, `${randomizationSeed}_${question.code}_subq`);
    }

    return subqs;
  }, [question, randomizationSeed]);

  // Answer options become rows (apply randomization if configured)
  const answerOptions = useMemo(() => {
    let opts = [...question.answer_options].sort((a, b) => a.order_index - b.order_index);

    if (question.settings.randomize_answers && randomizationSeed) {
      opts = seededShuffle(opts, `${randomizationSeed}_${question.code}_ans`);
    }

    return opts;
  }, [question, randomizationSeed]);

  // If no subquestions or answer options, show empty state
  if (subquestions.length === 0 || answerOptions.length === 0) {
    return (
      <div className="array-column-question array-empty">
        <p className="empty-message">No items to display.</p>
        <style jsx>{`
          .array-empty {
            padding: 1rem;
            background: #f5f3ef;
            border-radius: 4px;
            text-align: center;
          }
          .empty-message {
            color: #666;
            font-style: italic;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="array-column-question">
      {/* Desktop table view */}
      <div className="desktop-view">
        <div className="array-table">
          <table>
            <thead>
              <tr>
                <th className="answer-header"></th>
                {subquestions.map(subq => (
                  <th key={subq.id} className="subquestion-header">
                    {subq.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {answerOptions.map(option => (
                <tr key={option.id}>
                  <td className="answer-label">{option.label}</td>
                  {subquestions.map(subq => {
                    const currentValue = responseData.get(`${question.code}_${subq.code}`);
                    return (
                      <td key={subq.id} className="answer-cell">
                        <input
                          type="radio"
                          name={`${question.code}_${subq.code}`}
                          value={option.code}
                          checked={currentValue === option.code}
                          onChange={(e) => onAnswer(question.code, e.target.value, subq.code)}
                          aria-label={`${subq.label}: ${option.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked view */}
      <div className="mobile-view">
        {subquestions.map(subq => {
          const currentValue = responseData.get(`${question.code}_${subq.code}`);
          return (
            <div key={subq.id} className="mobile-subquestion">
              <div className="mobile-subquestion-label">{subq.label}</div>
              <div className="mobile-options">
                {answerOptions.map(option => (
                  <label key={option.id} className="mobile-option">
                    <input
                      type="radio"
                      name={`${question.code}_${subq.code}_mobile`}
                      value={option.code}
                      checked={currentValue === option.code}
                      onChange={(e) => onAnswer(question.code, e.target.value, subq.code)}
                    />
                    <span className="mobile-option-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .array-column-question {
          margin: 1rem 0;
        }

        /* Desktop view - table layout */
        .desktop-view {
          display: block;
          overflow-x: auto;
        }

        .mobile-view {
          display: none;
        }

        .array-table table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border: 1px solid #ddd;
        }

        .array-table th,
        .array-table td {
          padding: 10px 12px;
          border: 1px solid #ddd;
          font-size: 0.875rem;
        }

        .answer-header {
          background: #f8f8f8;
          font-weight: 500;
          text-align: left;
          width: 200px;
        }

        .subquestion-header {
          background: #f8f8f8;
          font-weight: 600;
          text-align: center;
          min-width: 90px;
          font-size: 0.8125rem;
          color: #333;
          padding: 12px 8px;
        }

        .answer-label {
          font-weight: normal;
          color: #333;
          text-align: left;
          background: #fafaf8;
        }

        .answer-cell {
          text-align: center;
          background: #fff;
        }

        .answer-cell input[type="radio"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
          margin: 0;
          accent-color: #c94a4a;
        }

        /* Mobile view - stacked layout */
        @media (max-width: 768px) {
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }

          .mobile-subquestion {
            background: #fafaf8;
            border: 1px solid #e0ddd8;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .mobile-subquestion:last-child {
            margin-bottom: 0;
          }

          .mobile-subquestion-label {
            font-weight: 600;
            color: #1a1d24;
            margin-bottom: 0.75rem;
            font-size: 0.9375rem;
            border-bottom: 1px solid #e0ddd8;
            padding-bottom: 0.75rem;
          }

          .mobile-options {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .mobile-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: white;
            border: 1px solid #e0ddd8;
            border-radius: 4px;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
          }

          .mobile-option:hover {
            border-color: #c94a4a;
            background: #fff8f8;
          }

          .mobile-option input[type="radio"] {
            width: 18px;
            height: 18px;
            margin: 0;
            accent-color: #c94a4a;
            cursor: pointer;
          }

          .mobile-option input[type="radio"]:checked + .mobile-option-label {
            color: #c94a4a;
            font-weight: 500;
          }

          .mobile-option-label {
            font-size: 0.875rem;
            color: #333;
            flex: 1;
          }
        }

        /* Tablet adjustments */
        @media (max-width: 1024px) and (min-width: 769px) {
          .array-table th,
          .array-table td {
            padding: 8px 6px;
          }

          .subquestion-header {
            min-width: 70px;
            font-size: 0.75rem;
          }

          .answer-header {
            width: 150px;
          }
        }
      `}</style>
    </div>
  );
}
