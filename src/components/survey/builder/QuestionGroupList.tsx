// Question Group List Component
'use client';

import type { QuestionGroup, Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface QuestionGroupListProps {
  groups: (QuestionGroup & {
    questions: (Question & {
      subquestions: Subquestion[];
      answer_options: AnswerOption[];
    })[];
  })[];
  onAddGroup: () => void;
  onAddQuestion: (groupId: string) => void;
  onEditQuestion: (question: Question) => void;
  onCopyQuestion?: (question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] }) => void;
}

export default function QuestionGroupList({
  groups,
  onAddGroup,
  onAddQuestion,
  onEditQuestion,
  onCopyQuestion,
}: QuestionGroupListProps) {
  const sortedGroups = [...groups].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="question-group-list">
      <div className="list-header">
        <h2>Survey Groups & Questions</h2>
        <div className="list-actions">
          <button onClick={onAddGroup} className="btn-primary">
            <span>+ Add New Group</span>
          </button>
        </div>
      </div>

      {sortedGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Start Building Your Survey</h3>
          <p>Create your first question group to begin adding questions.</p>
          <button onClick={onAddGroup} className="btn-primary">
            + Create First Group
          </button>
        </div>
      ) : (
        <div className="groups-container">
          {sortedGroups.map((group) => (
            <div key={group.id} className="group-card card">
              <div className="group-header">
                <div className="group-title-row">
                  <h3>{group.title || 'Untitled Group'}</h3>
                  <div className="group-controls">
                    <button className="btn-icon">⋮</button>
                  </div>
                </div>
                {group.description && (
                  <p className="group-description">{group.description}</p>
                )}
              </div>

              <div className="group-content">
                <div className="questions-list">
                  {group.questions
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((question) => (
                      <div
                        key={question.id}
                        className="question-item"
                        onClick={() => onEditQuestion(question)}
                      >
                        <div className="question-meta">
                          <span className="question-code">{question.code}</span>
                          <span className="question-type-badge">{formatQuestionType(question.question_type)}</span>
                        </div>
                        <div className="question-main">
                          <span className="question-text">
                            {question.question_text || <span className="placeholder-text">Click to edit question text...</span>}
                          </span>
                        </div>
                        <div className="question-actions">
                          {onCopyQuestion && (
                            <button
                              className="btn-copy"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyQuestion(question);
                              }}
                              title="Copy question"
                            >
                              📋
                            </button>
                          )}
                        </div>
                        <div className="question-arrow">
                          →
                        </div>
                      </div>
                    ))}

                  {group.questions.length === 0 && (
                    <div className="empty-questions">
                      <span>No questions in this group yet.</span>
                    </div>
                  )}
                </div>

                <div className="group-footer">
                  <button
                    onClick={() => onAddQuestion(group.id)}
                    className="btn-add-question"
                  >
                    + Add Question to Group
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .question-group-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .list-header h2 {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: var(--color-text-primary);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255,255,255,0.5);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          color: var(--color-text-secondary);
        }
        
        .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        
        .empty-state h3 {
            font-family: var(--font-serif);
            font-size: 1.25rem;
            color: var(--color-text-primary);
            margin-bottom: 0.5rem;
        }
        
        .empty-state p {
            margin-bottom: 1.5rem;
        }

        .groups-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .group-card {
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease;
        }
        
        .group-card:hover {
            box-shadow: var(--shadow-md);
            border-color: rgba(154, 51, 36, 0.2);
        }

        .group-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--color-border);
            background: linear-gradient(to bottom, #ffffff, #fafafa);
        }

        .group-title-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .group-header h3 {
            font-family: var(--font-serif);
            font-size: 1.125rem;
            color: var(--color-crimson);
            margin: 0;
            line-height: 1.4;
            font-weight: 600;
        }
        
        .group-description {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: var(--color-text-secondary);
        }

        .group-content {
            padding: 0;
        }

        .questions-list {
            display: flex;
            flex-direction: column;
        }

        .question-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.5rem;
            background: white;
            border-bottom: 1px solid var(--color-divider);
            cursor: pointer;
            transition: all 0.15s;
        }

        .question-item:last-child {
            border-bottom: none;
        }

        .question-item:hover {
            background: var(--color-bg-elevated);
        }
        
        .question-item:hover .question-arrow {
            opacity: 1;
            transform: translateX(0);
        }
        
        .question-item:hover .question-code {
            background-color: var(--color-crimson);
            border-color: var(--color-crimson);
            color: white;
        }

        .question-meta {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            min-width: 100px;
        }

        .question-code {
            display: inline-block;
            align-self: flex-start;
            padding: 0.15rem 0.5rem;
            background: var(--color-bg-primary);
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-text-secondary);
            font-family: var(--font-mono);
            transition: all 0.2s;
        }

        .question-type-badge {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-muted);
        }

        .question-main {
            flex: 1;
        }

        .question-text {
            color: var(--color-text-primary);
            font-size: 0.95rem;
            line-height: 1.5;
            display: block;
        }
        
        .placeholder-text {
            color: var(--color-text-muted);
            font-style: italic;
        }
        
        .question-actions {
            display: flex;
            gap: 0.25rem;
            opacity: 0;
            transition: opacity 0.15s;
        }

        .question-item:hover .question-actions {
            opacity: 1;
        }

        .btn-copy {
            padding: 0.25rem 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: white;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.15s;
        }

        .btn-copy:hover {
            border-color: var(--color-crimson);
            background: var(--color-bg-elevated);
        }

        .question-arrow {
            color: var(--color-crimson);
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.2s;
            font-weight: bold;
        }

        .empty-questions {
            padding: 2rem;
            text-align: center;
            color: var(--color-text-muted);
            font-style: italic;
            font-size: 0.875rem;
            background: var(--color-bg-primary);
        }
        
        .group-footer {
            padding: 0.75rem 1.5rem;
            background: var(--color-bg-primary);
            border-top: 1px solid var(--color-border);
        }
        
        .btn-add-question {
            width: 100%;
            padding: 0.75rem;
            border: 1px dashed var(--color-border-hover);
            background: rgba(255,255,255,0.5);
            border-radius: var(--radius-md);
            color: var(--color-text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-add-question:hover {
            border-color: var(--color-crimson);
            color: var(--color-crimson);
            background: white;
        }
      `}</style>
    </div>
  );
}

function formatQuestionType(type: string): string {
  const typeMap: Record<string, string> = {
    text: 'Short Text',
    long_text: 'Long Text',
    multiple_choice_single: 'Single Choice',
    multiple_choice_multiple: 'Multiple Choice',
    array: 'Matrix / Array',
    ranking: 'Ranking',
    equation: 'Equation',
    text_display: 'Display Text',
    dropdown: 'Dropdown List',
    yes_no: 'Yes / No',
    date: 'Date / Time',
    file_upload: 'File Upload',
  };
  return typeMap[type] || type.replace(/_/g, ' ');
}
