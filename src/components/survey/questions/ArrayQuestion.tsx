// Array (Likert Scale) Question Component
'use client';

import { useState, useMemo } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ArrayQuestionProps {
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

export default function ArrayQuestion({ question, responseData, onAnswer, randomizationSeed }: ArrayQuestionProps) {
  // Filter subquestions based on array_filter_question setting
  const filteredSubquestions = useMemo(() => {
    let subqs = [...question.subquestions].sort((a, b) => a.order_index - b.order_index);

    // Apply array filter if configured
    const filterQuestionCode = question.settings.array_filter_question;
    if (filterQuestionCode) {
      subqs = subqs.filter(subq => {
        // Check if the corresponding answer from the filter question is selected
        // For multiple choice: check if filterQuestionCode_subqCode has a value
        // For single choice with subquestion codes as values: check if value matches
        const filterValue = responseData.get(`${filterQuestionCode}_${subq.code}`);
        const singleValue = responseData.get(filterQuestionCode);

        // Include subquestion if:
        // 1. The filter question's corresponding subquestion was selected (for multiple choice)
        // 2. The filter question's value matches this subquestion's code (for single choice)
        // 3. The filter question's value is an array containing this subquestion's code
        if (filterValue && filterValue !== '' && filterValue !== 'N') {
          return true;
        }
        if (singleValue === subq.code) {
          return true;
        }
        if (Array.isArray(singleValue) && singleValue.includes(subq.code)) {
          return true;
        }
        return false;
      });
    }

    // Apply randomization if configured and seed is provided
    if (question.settings.randomize_subquestions && randomizationSeed) {
      subqs = seededShuffle(subqs, `${randomizationSeed}_${question.code}_subq`);
    }

    return subqs;
  }, [question, responseData, randomizationSeed]);

  // Apply randomization to answer options if configured
  const answerOptions = useMemo(() => {
    let opts = [...question.answer_options].sort((a, b) => a.order_index - b.order_index);

    if (question.settings.randomize_answers && randomizationSeed) {
      opts = seededShuffle(opts, `${randomizationSeed}_${question.code}_ans`);
    }

    return opts;
  }, [question, randomizationSeed]);

  const displayColumns = question.settings.display_columns || 1;

  // If all subquestions are filtered out, show nothing or a message
  if (filteredSubquestions.length === 0) {
    return (
      <div className="array-question array-empty">
        <p className="empty-message">No items to display based on your previous answers.</p>
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
    <div className="array-question">
      <div className="array-table">
        <table>
          <thead>
            <tr>
              <th className="subquestion-header"></th>
              {answerOptions.map(option => (
                <th key={option.id} className="answer-header">
                  {option.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSubquestions.map(subq => {
              const currentValue = responseData.get(`${question.code}_${subq.code}`);
              return (
                <tr key={subq.id}>
                  <td className="subquestion-label">{subq.label}</td>
                  {answerOptions.map(option => (
                    <td key={option.id} className="answer-cell">
                      <input
                        type="radio"
                        name={`${question.code}_${subq.code}`}
                        value={option.code}
                        checked={currentValue === option.code}
                        onChange={(e) => onAnswer(question.code, e.target.value, subq.code)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .array-question {
          margin: 1.5rem 0;
          width: 100%;
        }

        .array-table {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          /* Ensure scrollbar only appears if truly needed */
          scrollbar-width: thin;
        }

        .array-table table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border: 1px solid #e0e0e0;
        }

        .array-table th,
        .array-table td {
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          font-size: 0.9375rem;
          box-sizing: border-box; /* Ensure padding doesn't add to width */
        }

        .subquestion-header {
          background: #f8fafc;
          font-weight: 600;
          text-align: left;
          color: #1e293b;
          width: 25%; /* Reduced from 30% to allow more space for options */
          min-width: 150px; /* Reduced to be more responsive */
        }

        .answer-header {
          background: #f8fafc;
          font-weight: 600;
          text-align: center;
          color: #1e293b;
          min-width: 70px; /* Reduced slighty */
          font-size: 0.875rem;
          padding: 12px 8px;
        }

        .subquestion-label {
          font-weight: 500;
          color: #334155;
          text-align: left;
          background: #fff;
        }

        .answer-cell {
          text-align: center;
          background: #fff;
          vertical-align: middle;
        }

        .answer-cell:hover {
          background-color: #f8fafc;
        }

        .answer-cell input[type="radio"] {
          cursor: pointer;
          width: 20px;
          height: 20px;
          margin: 0;
          accent-color: #c94a4a; /* Brand color */
          transition: transform 0.1s;
        }

        .answer-cell input[type="radio"]:active {
          transform: scale(0.9);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .array-table th,
          .array-table td {
            padding: 10px 8px;
            font-size: 0.875rem;
          }

          .answer-header {
            min-width: 60px;
            font-size: 0.8125rem;
            white-space: normal;
          }
          
          .subquestion-header {
            width: auto;
            min-width: 120px;
          }
        }
        
        @media (max-width: 480px) {
          .array-table th,
          .array-table td {
            padding: 8px 4px;
            font-size: 0.8125rem;
          }
          
          .answer-header {
             min-width: 45px;
             font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
