// Survey Builder Client Component
'use client';

import { useState } from 'react';
import { Download, StatsUpSquare, Settings, Eye, ArrowLeft, Link as LinkIcon } from 'iconoir-react';
import type { SurveyWithStructure, QuestionGroup, Question } from '@/lib/supabase/survey-types';
import QuestionGroupList from './QuestionGroupList';
import QuestionEditor from './QuestionEditor';

interface SurveyBuilderClientProps {
    survey: SurveyWithStructure;
}

export default function SurveyBuilderClient({ survey: initialSurvey }: SurveyBuilderClientProps) {
    const [survey, setSurvey] = useState(initialSurvey);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [showQuestionEditor, setShowQuestionEditor] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleAddGroup = async () => {
        const newGroup = {
            survey_id: survey.id,
            title: 'New Question Group',
            order_index: survey.question_groups.length,
        };

        const response = await fetch('/api/survey/question-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGroup),
        });

        if (response.ok) {
            const { data } = await response.json();
            setSurvey({
                ...survey,
                question_groups: [...survey.question_groups, { ...data, questions: [] }],
            });
        } else {
            alert('Failed to add group');
        }
    };

    const handleAddQuestion = (groupId: string) => {
        setSelectedQuestion({
            id: '',
            group_id: groupId,
            code: `Q${Date.now()}`,
            question_text: '',
            question_type: 'text',
            settings: {},
            order_index: 0,
            created_at: new Date().toISOString(),
        } as Question);
        setShowQuestionEditor(true);
    };

    const handleEditQuestion = (question: Question) => {
        setSelectedQuestion(question);
        setShowQuestionEditor(true);
    };

    const handleCopyQuestion = (question: Question & { subquestions: any[]; answer_options: any[] }) => {
        // Create a copy of the question with a new code and no ID
        const copiedQuestion = {
            ...question,
            id: '', // Empty ID triggers create mode in the editor
            code: `${question.code}_copy`,
            question_text: `${question.question_text} (Copy)`,
            // Keep the same group, settings, subquestions, and answer_options
        };
        setSelectedQuestion(copiedQuestion);
        setShowQuestionEditor(true);
    };

    const handleSaveQuestion = async (question: Question) => {
        // Save to API
        const endpoint = question.id ? `/api/survey/questions/${question.id}` : '/api/survey/questions';
        const method = question.id ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question),
        });

        if (response.ok) {
            // Refresh survey data
            const surveyResponse = await fetch(`/api/survey/surveys/${survey.id}`);
            const { data } = await surveyResponse.json();
            setSurvey(data);
            setShowQuestionEditor(false);
        }
    };

    const handleUpdateSurveySettings = async (settings: any) => {
        const response = await fetch(`/api/survey/surveys/${survey.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...survey, settings }),
        });

        if (response.ok) {
            setSurvey({ ...survey, settings });
        }
    };

    return (
        <div className="survey-builder">
            {/* Main Header */}
            <div className="builder-header glass">
                <div className="header-content">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <a href="/admin/surveys" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ArrowLeft width={12} height={12} /> All Surveys</a>
                            <span className="separator">/</span>
                            <span className="current">{survey.title}</span>
                        </div>
                        <h1>{survey.title}</h1>
                    </div>

                    <div className="header-actions">
                        {/* Live indicator */}
                        {survey.status === 'active' && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: '#dcfce7',
                                border: '1px solid #22c55e',
                                borderRadius: '20px',
                                color: '#15803d',
                                fontWeight: 600,
                                fontSize: '13px'
                            }}>
                                <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></span>
                                LIVE
                            </div>
                        )}

                        <div className="status-badge-container">
                            <select
                                value={survey.status}
                                onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    const oldStatus = survey.status;

                                    // Warn when deactivating
                                    if (oldStatus === 'active' && newStatus !== 'active') {
                                        const confirmed = window.confirm(
                                            `⚠️ Warning: Changing from Active to ${newStatus === 'draft' ? 'Draft' : 'Closed'}\n\n` +
                                            `This will stop recording new responses.\n\n` +
                                            `Are you sure?`
                                        );
                                        if (!confirmed) {
                                            e.target.value = oldStatus;
                                            return;
                                        }
                                    }

                                    // Warn when activating
                                    if (newStatus === 'active' && oldStatus !== 'active') {
                                        const confirmed = window.confirm(
                                            `🚀 Activate Survey?\n\n` +
                                            `This will make the survey live and start recording responses.\n\n` +
                                            `Are you ready to go live?`
                                        );
                                        if (!confirmed) {
                                            e.target.value = oldStatus;
                                            return;
                                        }
                                    }

                                    const response = await fetch(`/api/survey/surveys/${survey.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ ...survey, status: newStatus }),
                                    });
                                    if (response.ok) {
                                        setSurvey({ ...survey, status: newStatus as any });
                                    }
                                }}
                                className={`status-select status-${survey.status}`}
                            >
                                <option value="draft">📝 Draft</option>
                                <option value="active">🟢 Active (Live)</option>
                                <option value="closed">🔒 Closed</option>
                            </select>
                        </div>

                        <div className="divider-v"></div>

                        <div className="export-dropdown">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Download width={14} height={14} />
                                <span>Export Data</span>
                            </button>
                            {showExportMenu && (
                                <div className="export-menu card">
                                    <div className="menu-header">Structure</div>
                                    <a href={`/api/survey/export/${survey.id}`} download>
                                        JSON Structure
                                    </a>
                                    <div className="menu-header">Response Data</div>
                                    <a href={`/api/survey/export/spss/${survey.id}`} download>
                                        SPSS (.sps + .csv)
                                    </a>
                                    <a href={`/api/survey/export/r/${survey.id}`} download>
                                        R Script (.R + .csv)
                                    </a>
                                    <a href={`/api/survey/export/stata/${survey.id}`} download>
                                        Stata (.do + .csv)
                                    </a>
                                </div>
                            )}
                        </div>

                        <a href={`/admin/surveys/${survey.id}/responses`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <StatsUpSquare width={14} height={14} />
                            <span>View Results</span>
                        </a>

                        <a href={`/admin/surveys/${survey.id}/settings`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Settings width={14} height={14} />
                            <span>Settings</span>
                        </a>

                        <a href={`/survey/take/${survey.id}?preview=true`} target="_blank" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Eye width={14} height={14} />
                            <span>Preview Survey</span>
                        </a>

                        {survey.status === 'active' && (
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/survey/take/${survey.id}`);
                                    alert('Survey link copied to clipboard!');
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <LinkIcon width={14} height={14} />
                                <span>Copy Link</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="builder-grid">
                {/* Left: Structure Editor */}
                <div className="builder-main-column">
                    <QuestionGroupList
                        groups={survey.question_groups}
                        onAddGroup={handleAddGroup}
                        onAddQuestion={handleAddQuestion}
                        onEditQuestion={handleEditQuestion}
                        onCopyQuestion={handleCopyQuestion}
                    />
                </div>

                {/* Right: Settings Sidebar */}
                <div className="builder-sidebar-column">
                    <div className="card settings-card">
                        <div className="card-header">
                            <h3>Survey Settings</h3>
                        </div>
                        <div className="card-content">
                            <div className="setting-group">
                                <label>Presentation Format</label>
                                <select
                                    value={survey.settings.format || 'group_by_group'}
                                    onChange={(e) =>
                                        handleUpdateSurveySettings({ ...survey.settings, format: e.target.value })
                                    }
                                    className="input-select"
                                >
                                    <option value="question_by_question">Question by Question</option>
                                    <option value="group_by_group">Group by Group</option>
                                    <option value="all_in_one">All on one page</option>
                                </select>
                            </div>

                            <div className="setting-toggle">
                                <label className="check-label">
                                    <input
                                        type="checkbox"
                                        checked={survey.settings.show_progress_bar || false}
                                        onChange={(e) =>
                                            handleUpdateSurveySettings({
                                                ...survey.settings,
                                                show_progress_bar: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="check-text">Show Progress Bar</span>
                                </label>
                            </div>

                            <div className="setting-toggle">
                                <label className="check-label">
                                    <input
                                        type="checkbox"
                                        checked={survey.settings.allow_backward_navigation || false}
                                        onChange={(e) =>
                                            handleUpdateSurveySettings({
                                                ...survey.settings,
                                                allow_backward_navigation: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="check-text">Allow Backward Nav</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="card-help">
                        <h4>Need Help?</h4>
                        <p>Learn about question types and logic in the <a href="#">documentation</a>.</p>
                    </div>
                </div>
            </div>

            {showQuestionEditor && selectedQuestion && (
                <QuestionEditor
                    question={selectedQuestion}
                    onSave={handleSaveQuestion}
                    onCancel={() => setShowQuestionEditor(false)}
                />
            )}

            <style jsx>{`
                .survey-builder {
                    min-height: 100vh;
                    background: var(--color-bg-primary);
                    padding-top: 80px;
                }

                .builder-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    padding: 1rem 2rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-left h1 {
                    font-family: var(--font-serif);
                    font-size: 1.5rem;
                    color: var(--color-text-primary);
                    margin: 0;
                }

                .breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;
                    color: var(--color-text-muted);
                }
                
                .back-link {
                    color: var(--color-text-secondary);
                    text-decoration: none;
                    font-weight: 500;
                }
                
                .back-link:hover {
                    color: var(--color-crimson);
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .divider-v {
                    width: 1px;
                    height: 24px;
                    background: var(--color-border);
                    margin: 0 0.5rem;
                }

                .status-select {
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-full);
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    appearance: none;
                    text-align: center;
                }

                .status-draft {
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-secondary);
                }

                .status-active {
                    background: var(--color-success-bg);
                    border: 1px solid var(--color-success);
                    color: var(--color-success);
                }
                
                .status-closed {
                    background: var(--color-bg-secondary);
                    color: var(--color-text-muted);
                }

                .export-dropdown {
                    position: relative;
                }

                .export-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 0.5rem;
                    min-width: 220px;
                    z-index: 50;
                    overflow: hidden;
                    padding: 0.5rem 0;
                }
                
                .menu-header {
                    padding: 0.5rem 1rem 0.25rem;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }

                .export-menu a {
                    display: block;
                    padding: 0.5rem 1rem;
                    color: var(--color-text-primary);
                    text-decoration: none;
                    font-size: 0.875rem;
                    transition: background 0.1s;
                }

                .export-menu a:hover {
                    background: var(--color-bg-primary);
                    color: var(--color-crimson);
                }

                .builder-grid {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 2rem;
                    padding: 2rem;
                }

                .builder-main-column {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .settings-card {
                    padding: 1.5rem;
                    position: sticky;
                    top: 100px;
                }
                
                .card-header h3 {
                    font-family: var(--font-serif);
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid var(--color-divider);
                }
                
                .setting-group {
                    margin-bottom: 1.25rem;
                }
                
                .setting-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                    margin-bottom: 0.5rem;
                }
                
                .input-select {
                    width: 100%;
                    padding: 0.6rem;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    background-color: var(--color-bg-secondary);
                }
                
                .setting-toggle {
                    margin-bottom: 0.75rem;
                }
                
                .check-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                }
                
                .check-text {
                    font-size: 0.9rem;
                    color: var(--color-text-primary);
                }
                
                .card-help {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: rgba(154, 51, 36, 0.05); /* Crimson tint */
                    border-radius: var(--radius-md);
                    border: 1px solid rgba(154, 51, 36, 0.1);
                }
                
                .card-help h4 {
                    font-size: 0.9rem;
                    color: var(--color-crimson);
                    margin-bottom: 0.25rem;
                }
                
                .card-help p {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                }
                
                .card-help a {
                    color: var(--color-crimson);
                    text-decoration: underline;
                }

                @media (max-width: 1024px) {
                    .builder-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .settings-card {
                        position: static;
                    }
                }
            `}</style>
        </div>
    );
}
