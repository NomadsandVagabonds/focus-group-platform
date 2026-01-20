// Question Editor Modal Component
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface QuestionEditorProps {
    question: Question & { subquestions?: Subquestion[]; answer_options?: AnswerOption[] };
    onSave: (question: Question) => void;
    onCancel: () => void;
}

type TabType = 'general' | 'options' | 'logic' | 'display';

export default function QuestionEditor({ question: initialQuestion, onSave, onCancel }: QuestionEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [question, setQuestion] = useState(initialQuestion);
    const [subquestions, setSubquestions] = useState<Subquestion[]>(initialQuestion.subquestions || []);
    const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>(initialQuestion.answer_options || []);
    const [activeTab, setActiveTab] = useState<TabType>('general');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // All array-type questions need subquestions (rows)
    const needsSubquestions = [
        'array', 'array_dual_scale', 'array_10_point', 'array_yes_no_uncertain',
        'array_increase_same_decrease', 'array_5_point', 'array_numbers', 'array_texts',
        'array_column', 'ranking', 'multiple_numerical', 'multiple_short_text'
    ].includes(question.question_type);

    // Questions that need answer options (columns/choices)
    const needsAnswerOptions = [
        'multiple_choice_single', 'multiple_choice_multiple', 'array', 'dropdown',
        'list_with_comment', 'multiple_choice_with_comments', 'button_select',
        'button_multi_select', 'image_select', 'image_multi_select'
    ].includes(question.question_type);

    const handleSave = () => {
        onSave({
            ...question,
            subquestions,
            answer_options: answerOptions,
        } as any);
    };

    const addSubquestion = () => {
        setSubquestions([
            ...subquestions,
            {
                id: `temp-${Date.now()}`,
                question_id: question.id,
                code: `SQ${subquestions.length + 1}`,
                label: '',
                order_index: subquestions.length,
                created_at: new Date().toISOString(),
            },
        ]);
    };

    const addAnswerOption = () => {
        setAnswerOptions([
            ...answerOptions,
            {
                id: `temp-${Date.now()}`,
                question_id: question.id,
                code: `A${answerOptions.length + 1}`,
                label: '',
                order_index: answerOptions.length,
                scale_id: 0,
                created_at: new Date().toISOString(),
            },
        ]);
    };

    if (!mounted) return null;

    return createPortal(
        <div className="modal-overlay glass-dark" onClick={onCancel}>
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-left">
                        <h2>{question.id ? 'Edit Question' : 'New Question'}</h2>
                        <span className="question-code-badge">{question.code}</span>
                    </div>
                    <button onClick={onCancel} className="close-btn">×</button>
                </div>

                {/* Tab Navigation */}
                <div className="tab-nav">
                    <button
                        className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    {(needsSubquestions || needsAnswerOptions) && (
                        <button
                            className={`tab-btn ${activeTab === 'options' ? 'active' : ''}`}
                            onClick={() => setActiveTab('options')}
                        >
                            {needsSubquestions ? 'Subquestions' : 'Answer Options'}
                        </button>
                    )}
                    <button
                        className={`tab-btn ${activeTab === 'logic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logic')}
                    >
                        Logic & Validation
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'display' ? 'active' : ''}`}
                        onClick={() => setActiveTab('display')}
                    >
                        Display
                    </button>
                </div>

                <div className="modal-body">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="tab-content">
                            <div className="form-section-compact">
                                <h3 className="section-title">Basic Information</h3>

                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Question Code</label>
                                        <input
                                            type="text"
                                            value={question.code}
                                            onChange={(e) => setQuestion({ ...question, code: e.target.value })}
                                            placeholder="Q1, Q2, etc."
                                            className="input-text"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Question Type</label>
                                        <select
                                            value={question.question_type}
                                            onChange={(e) => setQuestion({ ...question, question_type: e.target.value as any })}
                                            className="input-select"
                                        >
                                            <optgroup label="Basic Text">
                                                <option value="text">Short Text</option>
                                                <option value="long_text">Long Text</option>
                                                <option value="huge_free_text">Huge Free Text</option>
                                                <option value="multiple_short_text">Multiple Short Text</option>
                                            </optgroup>
                                            <optgroup label="Choice Questions">
                                                <option value="multiple_choice_single">Multiple Choice (Single)</option>
                                                <option value="multiple_choice_multiple">Multiple Choice (Multiple)</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="yes_no">Yes/No</option>
                                                <option value="list_with_comment">List with Comment</option>
                                                <option value="multiple_choice_with_comments">Multiple Choice with Comments</option>
                                                <option value="five_point_choice">Five Point Choice (1-5)</option>
                                            </optgroup>
                                            <optgroup label="Button & Image Select">
                                                <option value="button_select">Button Select (Single)</option>
                                                <option value="button_multi_select">Button Select (Multiple)</option>
                                                <option value="image_select">Image Select (Single)</option>
                                                <option value="image_multi_select">Image Select (Multiple)</option>
                                            </optgroup>
                                            <optgroup label="Array/Matrix Questions">
                                                <option value="array">Array (Likert Scale)</option>
                                                <option value="array_5_point">Array 5-Point (1-5)</option>
                                                <option value="array_10_point">Array 10-Point (1-10)</option>
                                                <option value="array_dual_scale">Array Dual Scale</option>
                                                <option value="array_yes_no_uncertain">Array Yes/No/Uncertain</option>
                                                <option value="array_increase_same_decrease">Array Increase/Same/Decrease</option>
                                                <option value="array_numbers">Array (Number Input)</option>
                                                <option value="array_texts">Array (Text Input)</option>
                                                <option value="array_column">Array by Column</option>
                                            </optgroup>
                                            <optgroup label="Numeric & Scales">
                                                <option value="numerical">Numerical Input</option>
                                                <option value="multiple_numerical">Multiple Numerical</option>
                                                <option value="slider">Slider</option>
                                                <option value="ranking">Ranking</option>
                                            </optgroup>
                                            <optgroup label="Customer Experience">
                                                <option value="nps">NPS (Net Promoter Score)</option>
                                                <option value="csat">CSAT (Customer Satisfaction)</option>
                                                <option value="ces">CES (Customer Effort Score)</option>
                                            </optgroup>
                                            <optgroup label="Special Types">
                                                <option value="date">Date</option>
                                                <option value="file_upload">File Upload</option>
                                                <option value="gender">Gender</option>
                                                <option value="language_switch">Language Switch</option>
                                            </optgroup>
                                            <optgroup label="Display & Logic">
                                                <option value="text_display">Text Display (Info)</option>
                                                <option value="equation">Equation (Hidden Calculation)</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Question Text</label>
                                    <textarea
                                        value={question.question_text}
                                        onChange={(e) => setQuestion({ ...question, question_text: e.target.value })}
                                        rows={3}
                                        placeholder="Enter your question..."
                                        className="input-textarea"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        {question.question_type === 'equation' ? 'Equation Logic' : 'Help Text'}
                                        <span className="optional">{question.question_type !== 'equation' && '(Optional)'}</span>
                                    </label>
                                    <textarea
                                        value={question.help_text || ''}
                                        onChange={(e) => setQuestion({ ...question, help_text: e.target.value })}
                                        rows={2}
                                        placeholder={question.question_type === 'equation' ? 'e.g., {Q1} + {Q2}' : 'Additional instructions or context...'}
                                        className={`input-textarea ${question.question_type === 'equation' ? 'code-font' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="form-section-compact">
                                <h3 className="section-title">Settings</h3>

                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={question.settings.mandatory || false}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, mandatory: e.target.checked },
                                                })
                                            }
                                        />
                                        <span className="toggle-text">
                                            <strong>Mandatory</strong>
                                            <small>Respondent must answer this question</small>
                                        </span>
                                    </label>

                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={question.settings.other_option || false}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, other_option: e.target.checked },
                                                })
                                            }
                                        />
                                        <span className="toggle-text">
                                            <strong>Include "Other" Option</strong>
                                            <small>Allow respondents to specify their own answer</small>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Options Tab (Subquestions or Answer Options) */}
                    {activeTab === 'options' && (
                        <div className="tab-content">
                            {needsSubquestions && (
                                <div className="form-section-compact">
                                    <div className="section-header-inline">
                                        <h3 className="section-title">Subquestions</h3>
                                        <button onClick={addSubquestion} className="btn-secondary btn-sm">+ Add Subquestion</button>
                                    </div>

                                    <div className="options-list">
                                        {subquestions.map((sq, index) => (
                                            <div key={sq.id} className="option-item">
                                                <span className="option-number">{index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={sq.code}
                                                    onChange={(e) => {
                                                        const updated = [...subquestions];
                                                        updated[index] = { ...sq, code: e.target.value };
                                                        setSubquestions(updated);
                                                    }}
                                                    placeholder="Code"
                                                    className="option-code input-text"
                                                />
                                                <input
                                                    type="text"
                                                    value={sq.label}
                                                    onChange={(e) => {
                                                        const updated = [...subquestions];
                                                        updated[index] = { ...sq, label: e.target.value };
                                                        setSubquestions(updated);
                                                    }}
                                                    placeholder="Label"
                                                    className="option-label input-text"
                                                />
                                                <button
                                                    onClick={() => setSubquestions(subquestions.filter((_, i) => i !== index))}
                                                    className="delete-btn-icon"
                                                    title="Delete"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {subquestions.length === 0 && (
                                            <div className="empty-state-small">
                                                No subquestions yet. Click "Add Subquestion" to create one.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {needsAnswerOptions && (
                                <div className="form-section-compact">
                                    <div className="section-header-inline">
                                        <h3 className="section-title">Answer Options</h3>
                                        <button onClick={addAnswerOption} className="btn-secondary btn-sm">+ Add Option</button>
                                    </div>

                                    <div className="options-list">
                                        {answerOptions.map((opt, index) => (
                                            <div key={opt.id} className="option-item">
                                                <span className="option-number">{index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={opt.code}
                                                    onChange={(e) => {
                                                        const updated = [...answerOptions];
                                                        updated[index] = { ...opt, code: e.target.value };
                                                        setAnswerOptions(updated);
                                                    }}
                                                    placeholder="Code"
                                                    className="option-code input-text"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt.label}
                                                    onChange={(e) => {
                                                        const updated = [...answerOptions];
                                                        updated[index] = { ...opt, label: e.target.value };
                                                        setAnswerOptions(updated);
                                                    }}
                                                    placeholder="Label"
                                                    className="option-label input-text"
                                                />
                                                <button
                                                    onClick={() => setAnswerOptions(answerOptions.filter((_, i) => i !== index))}
                                                    className="delete-btn-icon"
                                                    title="Delete"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {answerOptions.length === 0 && (
                                            <div className="empty-state-small">
                                                No answer options yet. Click "Add Option" to create one.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logic Tab */}
                    {activeTab === 'logic' && (
                        <div className="tab-content">
                            <div className="form-section-compact">
                                <h3 className="section-title">Conditional Display</h3>

                                <div className="form-group">
                                    <label>Relevance Logic <span className="optional">(Optional)</span></label>
                                    <input
                                        type="text"
                                        value={question.relevance_logic || ''}
                                        onChange={(e) => setQuestion({ ...question, relevance_logic: e.target.value })}
                                        placeholder="e.g., Q1 == 'A1' OR Q2 == 'A2'"
                                        className="input-text code-font"
                                    />
                                    <small className="help-text">Show this question only when the condition is met</small>
                                </div>
                            </div>

                            <div className="form-section-compact">
                                <h3 className="section-title">Validation</h3>

                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Minimum Answers</label>
                                        <input
                                            type="number"
                                            value={question.settings.min_answers || ''}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, min_answers: parseInt(e.target.value) || undefined },
                                                })
                                            }
                                            placeholder="Leave empty for no minimum"
                                            className="input-text"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Maximum Answers</label>
                                        <input
                                            type="number"
                                            value={question.settings.max_answers || ''}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, max_answers: parseInt(e.target.value) || undefined },
                                                })
                                            }
                                            placeholder="Leave empty for no maximum"
                                            className="input-text"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Validation Equation <span className="optional">(Optional)</span></label>
                                    <textarea
                                        value={question.settings.validation_equation || ''}
                                        onChange={(e) =>
                                            setQuestion({
                                                ...question,
                                                settings: { ...question.settings, validation_equation: e.target.value },
                                            })
                                        }
                                        placeholder="e.g., sum(Q1_SQ001, Q1_SQ002) <= 100"
                                        className="input-textarea code-font"
                                        rows={2}
                                    />
                                    <small className="help-text">Custom validation logic for the answer</small>
                                </div>

                                <div className="form-group">
                                    <label>Validation Tip <span className="optional">(Optional)</span></label>
                                    <textarea
                                        value={question.settings.validation_tip || ''}
                                        onChange={(e) =>
                                            setQuestion({
                                                ...question,
                                                settings: { ...question.settings, validation_tip: e.target.value },
                                            })
                                        }
                                        placeholder="Message shown when validation fails"
                                        className="input-textarea"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="form-section-compact">
                                <h3 className="section-title">Randomization & Order</h3>

                                <div className="form-group">
                                    <label>Randomization Group <span className="optional">(Optional)</span></label>
                                    <input
                                        type="text"
                                        value={question.settings.randomization_group || ''}
                                        onChange={(e) =>
                                            setQuestion({
                                                ...question,
                                                settings: { ...question.settings, randomization_group: e.target.value },
                                            })
                                        }
                                        placeholder="Group name"
                                        className="input-text"
                                    />
                                    <small className="help-text">Questions with the same group name will be randomized together</small>
                                </div>

                                <div className="form-group">
                                    <label>Subquestions Order</label>
                                    <select
                                        value={question.settings.subquestion_order || 'default'}
                                        onChange={(e) =>
                                            setQuestion({
                                                ...question,
                                                settings: { ...question.settings, subquestion_order: e.target.value as 'default' | 'random' | 'alphabetical' },
                                            })
                                        }
                                        className="input-select"
                                    >
                                        <option value="default">Default Order</option>
                                        <option value="random">Random</option>
                                        <option value="alphabetical">Alphabetical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-section-compact">
                                <h3 className="section-title">Advanced Options</h3>

                                <div className="form-group">
                                    <label>Array Filter <span className="optional">(Optional)</span></label>
                                    <input
                                        type="text"
                                        value={question.settings.array_filter || ''}
                                        onChange={(e) =>
                                            setQuestion({
                                                ...question,
                                                settings: { ...question.settings, array_filter: e.target.value },
                                            })
                                        }
                                        placeholder="Filter expression"
                                        className="input-text code-font"
                                    />
                                </div>

                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Array Filter Style</label>
                                        <select
                                            value={question.settings.array_filter_style || 'hidden'}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, array_filter_style: e.target.value as 'hidden' | 'disabled' },
                                                })
                                            }
                                            className="input-select"
                                        >
                                            <option value="hidden">Hidden</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Exclusive Option</label>
                                        <input
                                            type="text"
                                            value={question.settings.exclusive_option || ''}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, exclusive_option: e.target.value },
                                                })
                                            }
                                            placeholder="Answer code"
                                            className="input-text"
                                        />
                                    </div>
                                </div>

                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={question.settings.numbers_only_other || false}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, numbers_only_other: e.target.checked },
                                                })
                                            }
                                        />
                                        <span className="toggle-text">
                                            <strong>Numbers Only for 'Other'</strong>
                                            <small>Restrict 'Other' field to numeric input only</small>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display Tab */}
                    {activeTab === 'display' && (
                        <div className="tab-content">
                            <div className="form-section-compact">
                                <h3 className="section-title">Display Options</h3>

                                <div className="form-group">
                                    <label>CSS Class(es) <span className="optional">(Optional)</span></label>
                                    <input
                                        type="text"
                                        value={question.settings.css_class || ''}
                                        onChange={(e) =>
                                            setQuestion({
                                                ...question,
                                                settings: { ...question.settings, css_class: e.target.value },
                                            })
                                        }
                                        placeholder="custom-class another-class"
                                        className="input-text"
                                    />
                                    <small className="help-text">Add custom CSS classes for styling</small>
                                </div>

                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={question.settings.hidden || false}
                                            onChange={(e) =>
                                                setQuestion({
                                                    ...question,
                                                    settings: { ...question.settings, hidden: e.target.checked },
                                                })
                                            }
                                        />
                                        <span className="toggle-text">
                                            <strong>Hide Question</strong>
                                            <small>Question will not be visible to respondents</small>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={onCancel} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary">Save Question</button>
                </div>

                <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(26, 29, 36, 0.5);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--color-border);
          }

          .modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--color-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--color-bg-elevated);
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .modal-header h2 {
            font-family: var(--font-serif);
            font-size: 1.25rem;
            color: var(--color-crimson);
            margin: 0;
          }

          .question-code-badge {
            background: rgba(154, 51, 36, 0.1);
            color: var(--color-crimson);
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-full);
            font-size: 0.75rem;
            font-weight: 600;
            font-family: var(--font-mono);
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--color-text-muted);
            cursor: pointer;
            line-height: 1;
            padding: 0.25rem;
            border-radius: var(--radius-sm);
            transition: all 0.2s;
          }
          
          .close-btn:hover {
            color: var(--color-text-primary);
            background: rgba(0,0,0,0.05);
          }

          .tab-nav {
            display: flex;
            border-bottom: 2px solid var(--color-border);
            background: var(--color-bg-primary);
            padding: 0 1.5rem;
          }

          .tab-btn {
            background: none;
            border: none;
            padding: 0.875rem 1.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-secondary);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
          }

          .tab-btn:hover {
            color: var(--color-text-primary);
            background: rgba(0,0,0,0.02);
          }

          .tab-btn.active {
            color: var(--color-crimson);
            border-bottom-color: var(--color-crimson);
            font-weight: 600;
          }

          .modal-body {
            padding: 1.5rem;
            overflow-y: auto;
            flex: 1;
          }

          .tab-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .form-section-compact {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .section-title {
            font-family: var(--font-serif);
            font-size: 1rem;
            color: var(--color-text-primary);
            margin: 0;
            font-weight: 600;
          }

          .section-header-inline {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-group label {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--color-text-secondary);
          }

          .optional {
            font-weight: 400;
            color: var(--color-text-muted);
            font-size: 0.8rem;
          }

          .help-text {
            font-size: 0.75rem;
            color: var(--color-text-muted);
            margin-top: -0.25rem;
          }

          .input-text,
          .input-textarea,
          .input-select {
            width: 100%;
            padding: 0.625rem 0.875rem;
            border: 1.5px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            background: white;
            color: var(--color-text-primary);
            transition: all 0.2s;
          }
          
          .input-text:focus,
          .input-textarea:focus,
          .input-select:focus {
            outline: none;
            border-color: var(--color-crimson);
            box-shadow: 0 0 0 3px rgba(154, 51, 36, 0.1);
          }

          .code-font {
            font-family: var(--font-mono);
            font-size: 0.8rem;
          }

          .form-row-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .toggle-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .toggle-label {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            cursor: pointer;
            padding: 0.75rem;
            border-radius: var(--radius-md);
            transition: background 0.2s;
          }

          .toggle-label:hover {
            background: rgba(0,0,0,0.02);
          }

          .toggle-label input[type="checkbox"] {
            width: 1.125rem;
            height: 1.125rem;
            accent-color: var(--color-crimson);
            margin-top: 0.125rem;
            flex-shrink: 0;
          }

          .toggle-text {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }

          .toggle-text strong {
            font-size: 0.875rem;
            color: var(--color-text-primary);
          }

          .toggle-text small {
            font-size: 0.75rem;
            color: var(--color-text-muted);
            font-weight: 400;
          }

          .options-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .option-item {
            display: grid;
            grid-template-columns: 32px 100px 1fr 32px;
            gap: 0.5rem;
            align-items: center;
          }

          .option-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: var(--color-bg-primary);
            border-radius: var(--radius-full);
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--color-text-secondary);
          }

          .option-code {
            font-family: var(--font-mono);
            font-size: 0.8rem;
          }

          .option-label {
            /* flex: 1 handled by grid */
          }

          .delete-btn-icon {
            background: var(--color-danger-bg);
            color: var(--color-danger);
            border: none;
            border-radius: var(--radius-sm);
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 1.25rem;
            transition: all 0.2s;
          }
          
          .delete-btn-icon:hover {
            background: var(--color-danger);
            color: white;
          }

          .empty-state-small {
            text-align: center;
            padding: 2rem;
            color: var(--color-text-muted);
            font-size: 0.875rem;
            font-style: italic;
            background: var(--color-bg-primary);
            border-radius: var(--radius-md);
          }

          .btn-sm {
            padding: 0.5rem 0.875rem;
            font-size: 0.8rem;
          }

          .modal-footer {
            padding: 1.25rem 1.5rem;
            border-top: 1px solid var(--color-border);
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            background: var(--color-bg-elevated);
          }
        `}</style>
            </div>
        </div>,
        document.body
    );
}
