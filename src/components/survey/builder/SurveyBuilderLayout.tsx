// Survey Builder Layout - Fully Functional
'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, Play, Settings, Xmark, FloppyDisk, Plus } from 'iconoir-react';
import QuestionEditor from './QuestionEditor';
import type { SurveyWithStructure, QuestionGroup, Question } from '@/lib/supabase/survey-types';

interface SurveyBuilderLayoutProps {
    survey: SurveyWithStructure;
}

export default function SurveyBuilderLayout({ survey }: SurveyBuilderLayoutProps) {
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [showQuestionEditor, setShowQuestionEditor] = useState(false);
    const [localSurvey, setLocalSurvey] = useState(survey);
    const [showNewQuestionDialog, setShowNewQuestionDialog] = useState(false);
    const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [selectedGroupForNewQuestion, setSelectedGroupForNewQuestion] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleSelectQuestion = (question: Question) => {
        setSelectedQuestion(question);
    };

    const handleSaveQuestion = async (updatedQuestion: Question) => {
        try {
            const response = await fetch(`/api/survey/questions/${updatedQuestion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedQuestion),
            });

            if (response.ok) {
                // Update local state - preserve full question structure
                setLocalSurvey(prev => ({
                    ...prev,
                    question_groups: prev.question_groups?.map(group => ({
                        ...group,
                        questions: group.questions?.map(q =>
                            q.id === updatedQuestion.id
                                ? { ...q, ...updatedQuestion }
                                : q
                        ),
                    })),
                } as SurveyWithStructure));
                setShowQuestionEditor(false);
                setSelectedQuestion(updatedQuestion);
            }
        } catch (error) {
            console.error('Failed to save question:', error);
            alert('Failed to save question');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        // Find the group containing these questions
        const group = localSurvey.question_groups?.find(g =>
            g.questions?.some(q => q.id === active.id)
        );

        if (!group || !group.questions) return;

        const oldIndex = group.questions.findIndex(q => q.id === active.id);
        const newIndex = group.questions.findIndex(q => q.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Reorder questions locally
        const newQuestions = [...group.questions];
        const [movedQuestion] = newQuestions.splice(oldIndex, 1);
        newQuestions.splice(newIndex, 0, movedQuestion);

        // Update local state immediately
        setLocalSurvey(prev => ({
            ...prev,
            question_groups: prev.question_groups?.map(g =>
                g.id === group.id ? { ...g, questions: newQuestions } : g
            ),
        } as SurveyWithStructure));

        // Update server
        const questionIds = newQuestions.map(q => q.id);
        try {
            await fetch('/api/survey/questions/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: localSurvey.id,
                    groupId: group.id,
                    questionIds,
                }),
            });
        } catch (error) {
            console.error('Failed to reorder questions:', error);
            // Revert on error
            setLocalSurvey(survey);
        }
    };

    const handleAddQuestion = () => {
        // If only one group exists, auto-select it
        if (localSurvey.question_groups?.length === 1) {
            setSelectedGroupForNewQuestion(localSurvey.question_groups[0].id);
        }
        setShowNewQuestionDialog(true);
    };

    const handleCreateQuestion = async (groupId: string) => {
        try {
            // Generate next question code
            const allQuestions = localSurvey.question_groups?.flatMap(g => g.questions || []) || [];
            const nextNum = allQuestions.length + 1;
            const newCode = `Q${nextNum}`;

            const response = await fetch('/api/survey/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_id: localSurvey.id,
                    group_id: groupId,
                    code: newCode,
                    question_text: 'New question - click to edit',
                    question_type: 'text',
                    settings: { mandatory: false },
                    order_index: (localSurvey.question_groups?.find(g => g.id === groupId)?.questions?.length || 0),
                }),
            });

            if (response.ok) {
                const newQuestion = await response.json();

                // Update local state
                setLocalSurvey(prev => ({
                    ...prev,
                    question_groups: prev.question_groups?.map(g =>
                        g.id === groupId
                            ? { ...g, questions: [...(g.questions || []), newQuestion] }
                            : g
                    ),
                } as SurveyWithStructure));

                setShowNewQuestionDialog(false);
                setSelectedGroupForNewQuestion(null);
                setSelectedQuestion(newQuestion);
            }
        } catch (error) {
            console.error('Failed to create question:', error);
            alert('Failed to create question');
        }
    };

    const handleAddGroup = () => {
        setNewGroupTitle('');
        setShowNewGroupDialog(true);
    };

    const handleCreateGroup = async () => {
        if (!newGroupTitle.trim()) {
            alert('Please enter a group title');
            return;
        }

        try {
            const response = await fetch('/api/survey/question-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_id: localSurvey.id,
                    title: newGroupTitle.trim(),
                    order_index: (localSurvey.question_groups?.length || 0),
                }),
            });

            if (response.ok) {
                const newGroup = await response.json();

                // Update local state
                setLocalSurvey(prev => ({
                    ...prev,
                    question_groups: [...(prev.question_groups || []), { ...newGroup, questions: [] }],
                } as SurveyWithStructure));

                setShowNewGroupDialog(false);
                setNewGroupTitle('');
            }
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group');
        }
    };

    return (
        <div className="builder-layout">
            {/* Header */}
            <div className="builder-header">
                <div className="breadcrumb">
                    {localSurvey.title} / {selectedQuestion?.code || 'Survey Structure'}
                </div>
                <div className="header-actions">
                    <select
                        value={localSurvey.status}
                        onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                                const response = await fetch(`/api/survey/surveys/${localSurvey.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...localSurvey, status: newStatus }),
                                });
                                if (response.ok) {
                                    setLocalSurvey(prev => ({ ...prev, status: newStatus } as SurveyWithStructure));
                                }
                            } catch (error) {
                                console.error('Failed to update status:', error);
                            }
                        }}
                        className={`status-select status-${localSurvey.status}`}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button className="btn-secondary" onClick={() => window.open(`/survey/take/${localSurvey.id}?preview=true`, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye width={14} height={14} /> Preview
                    </button>
                    <button className="btn-secondary" onClick={() => window.open(`/survey/take/${localSurvey.id}`, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Play width={14} height={14} /> Run survey
                    </button>
                    <button className="btn-secondary" onClick={() => window.location.href = `/admin/surveys/${localSurvey.id}/settings`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Settings width={14} height={14} /> Settings
                    </button>
                    <button className="btn-secondary" onClick={() => window.location.href = '/admin/surveys'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Xmark width={14} height={14} /> Close
                    </button>
                    <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FloppyDisk width={14} height={14} /> Save
                    </button>
                </div>
            </div>

            {/* Main Content - 3 Columns */}
            <div className="builder-content">
                {/* Left Sidebar - Groups & Questions */}
                <div className="builder-sidebar">
                    <div className="sidebar-actions">
                        <button className="btn-add" onClick={handleAddQuestion} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Plus width={14} height={14} /> Add question
                        </button>
                        <button className="btn-add" onClick={handleAddGroup} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Plus width={14} height={14} /> Add group
                        </button>
                    </div>

                    <div className="groups-list">
                        {localSurvey.question_groups?.map(group => (
                            <GroupItem
                                key={group.id}
                                group={group}
                                selectedQuestion={selectedQuestion}
                                onSelectQuestion={handleSelectQuestion}
                                onDragEnd={handleDragEnd}
                                sensors={sensors}
                            />
                        ))}
                    </div>
                </div>

                {/* Center - Question Editor */}
                <div className="builder-editor">
                    {selectedQuestion ? (
                        <QuestionEditorPanel
                            question={selectedQuestion}
                            onSave={handleSaveQuestion}
                        />
                    ) : (
                        <div className="empty-state">
                            <p>Select a question from the left sidebar to edit</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Settings */}
                <div className="builder-settings">
                    {selectedQuestion && (
                        <QuestionSettings
                            question={selectedQuestion}
                            onChange={(updatedQuestion: Question) => {
                                setSelectedQuestion(updatedQuestion);
                            }}
                            onSave={handleSaveQuestion}
                        />
                    )}
                </div>
            </div>

            {/* Question Editor Modal */}
            {showQuestionEditor && selectedQuestion && (
                <QuestionEditor
                    question={selectedQuestion}
                    onSave={handleSaveQuestion}
                    onCancel={() => setShowQuestionEditor(false)}
                />
            )}

            {/* New Question Dialog */}
            {showNewQuestionDialog && (
                <div className="dialog-overlay" onClick={() => setShowNewQuestionDialog(false)}>
                    <div className="dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Question</h3>
                        <p>Select a group for the new question:</p>
                        <div className="group-select-list">
                            {localSurvey.question_groups?.map(group => (
                                <button
                                    key={group.id}
                                    className={`group-select-btn ${selectedGroupForNewQuestion === group.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedGroupForNewQuestion(group.id)}
                                >
                                    {group.title}
                                </button>
                            ))}
                        </div>
                        <div className="dialog-actions">
                            <button className="btn-secondary" onClick={() => setShowNewQuestionDialog(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => selectedGroupForNewQuestion && handleCreateQuestion(selectedGroupForNewQuestion)}
                                disabled={!selectedGroupForNewQuestion}
                            >
                                Create Question
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Group Dialog */}
            {showNewGroupDialog && (
                <div className="dialog-overlay" onClick={() => setShowNewGroupDialog(false)}>
                    <div className="dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Group</h3>
                        <div className="form-group">
                            <label>Group Title</label>
                            <input
                                type="text"
                                value={newGroupTitle}
                                onChange={(e) => setNewGroupTitle(e.target.value)}
                                placeholder="Enter group title..."
                                autoFocus
                            />
                        </div>
                        <div className="dialog-actions">
                            <button className="btn-secondary" onClick={() => setShowNewGroupDialog(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleCreateGroup}>
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .builder-layout {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    background: #f5f3ef;
                }

                .builder-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border-bottom: 1px solid #e0ddd8;
                }

                .breadcrumb {
                    font-size: 0.875rem;
                    color: #666;
                }

                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .status-select {
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    font-weight: 500;
                }

                .status-select.status-draft {
                    background: #fff3cd;
                    border-color: #ffc107;
                    color: #856404;
                }

                .status-select.status-active {
                    background: #d4edda;
                    border-color: #28a745;
                    color: #155724;
                }

                .status-select.status-closed {
                    background: #f8d7da;
                    border-color: #dc3545;
                    color: #721c24;
                }

                .btn-primary {
                    background: #5cb85c;
                    color: white;
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .btn-primary:hover {
                    background: #4cae4c;
                }

                .btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .btn-secondary:hover {
                    background: #e0e0e0;
                }

                .builder-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .builder-sidebar {
                    width: 280px;
                    background: #f9f9f9;
                    border-right: 1px solid #e0ddd8;
                    overflow-y: auto;
                    padding: 1rem;
                }

                .sidebar-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .btn-add {
                    background: #e0ddd8;
                    color: #333;
                    padding: 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    text-align: left;
                }

                .btn-add:hover {
                    background: #d0cdc8;
                }

                .groups-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .builder-editor {
                    flex: 1;
                    background: white;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .empty-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #999;
                    font-size: 0.875rem;
                }

                .builder-settings {
                    width: 320px;
                    background: white;
                    border-left: 1px solid #e0ddd8;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .dialog {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    min-width: 400px;
                    max-width: 500px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }

                .dialog h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1.25rem;
                    color: #333;
                }

                .dialog p {
                    margin: 0 0 1rem 0;
                    color: #666;
                    font-size: 0.875rem;
                }

                .group-select-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                .group-select-btn {
                    padding: 0.75rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    text-align: left;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.15s;
                }

                .group-select-btn:hover {
                    border-color: #c94a4a;
                    background: #faf5f5;
                }

                .group-select-btn.selected {
                    border-color: #c94a4a;
                    background: #c94a4a;
                    color: white;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #333;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .dialog-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
            `}</style>
        </div>
    );
}

// Group Item Component with Drag & Drop
function GroupItem({ group, selectedQuestion, onSelectQuestion, onDragEnd, sensors }: any) {
    const [expanded, setExpanded] = useState(true);

    if (!group.questions || group.questions.length === 0) {
        return (
            <div className="group-item">
                <div className="group-header" onClick={() => setExpanded(!expanded)}>
                    <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
                    <span className="group-title">{group.title}</span>
                </div>
                {expanded && (
                    <div className="question-list">
                        <div className="no-questions">No questions yet</div>
                    </div>
                )}
                <style jsx>{`
                    .group-item { margin-bottom: 0.5rem; }
                    .group-header {
                        display: flex;
                        align-items: center;
                        padding: 0.5rem 0.75rem;
                        background: #5cb85c;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        gap: 0.5rem;
                    }
                    .group-header:hover { background: #4cae4c; }
                    .expand-icon { font-size: 0.75rem; color: white; }
                    .group-title { flex: 1; font-size: 0.875rem; font-weight: 500; color: white; }
                    .question-list { padding-left: 1rem; margin-top: 0.25rem; }
                    .no-questions { font-size: 0.75rem; color: #999; padding: 0.5rem; }
                `}</style>
            </div>
        );
    }

    const questionIds = group.questions.map((q: Question) => q.id);

    return (
        <div className="group-item">
            <div className="group-header" onClick={() => setExpanded(!expanded)}>
                <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
                <span className="group-title">{group.title}</span>
            </div>

            {expanded && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                        <div className="question-list">
                            {group.questions.map((q: Question) => (
                                <SortableQuestionItem
                                    key={q.id}
                                    question={q}
                                    isSelected={selectedQuestion?.id === q.id}
                                    onSelect={() => onSelectQuestion(q)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <style jsx>{`
                .group-item {
                    margin-bottom: 0.5rem;
                }

                .group-header {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 0.75rem;
                    background: #5cb85c;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    gap: 0.5rem;
                }

                .group-header:hover {
                    background: #4cae4c;
                }

                .expand-icon {
                    font-size: 0.75rem;
                    color: white;
                }

                .group-title {
                    flex: 1;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .question-list {
                    padding-left: 1rem;
                    margin-top: 0.25rem;
                }
            `}</style>
        </div>
    );
}

// Sortable Question Item
function SortableQuestionItem({ question, isSelected, onSelect }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`question-item ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <span className="drag-handle" {...attributes} {...listeners}>
                ⋮⋮
            </span>
            <span className="question-code">{question.code}</span>
            <span className="question-preview">
                {question.question_text.substring(0, 25)}...
            </span>

            <style jsx>{`
                .question-item {
                    display: flex;
                    align-items: center;
                    padding: 0.375rem 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    gap: 0.5rem;
                    margin-bottom: 0.125rem;
                    background: white;
                    color: #333;
                }

                .question-item:hover {
                    background: #f0f0f0;
                }

                .question-item.selected {
                    background: #c94a4a;
                    color: white;
                }

                .drag-handle {
                    cursor: grab;
                    color: #999;
                    font-size: 0.75rem;
                    padding: 0.25rem;
                }

                .drag-handle:active {
                    cursor: grabbing;
                }

                .question-item.selected .drag-handle {
                    color: rgba(255, 255, 255, 0.7);
                }

                .question-code {
                    font-weight: 600;
                    font-size: 0.75rem;
                    min-width: 40px;
                }

                .question-preview {
                    flex: 1;
                    font-size: 0.75rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
}

// Question Editor Panel Component
function QuestionEditorPanel({ question, onSave }: any) {
    const [questionText, setQuestionText] = useState(question.question_text);
    const [subquestions, setSubquestions] = useState(question.subquestions || []);
    const [answerOptions, setAnswerOptions] = useState(question.answer_options || []);
    const [savingSubquestion, setSavingSubquestion] = useState<string | null>(null);
    const [savingAnswerOption, setSavingAnswerOption] = useState<string | null>(null);

    // Sync state when question changes
    useEffect(() => {
        setQuestionText(question.question_text);
        setSubquestions(question.subquestions || []);
        setAnswerOptions(question.answer_options || []);
    }, [question.id, question.question_text, question.subquestions, question.answer_options]);

    const handleSave = () => {
        onSave({
            ...question,
            question_text: questionText,
            subquestions,
        });
    };

    const handleSubquestionChange = (id: string, field: 'code' | 'label', value: string) => {
        setSubquestions((prev: any[]) =>
            prev.map((sq: any) =>
                sq.id === id ? { ...sq, [field]: value } : sq
            )
        );
    };

    const handleSaveSubquestion = async (sq: any) => {
        setSavingSubquestion(sq.id);
        try {
            const response = await fetch(`/api/survey/subquestions/${sq.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: sq.code,
                    label: sq.label,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save subquestion:', error);
            alert('Failed to save subquestion');
        } finally {
            setSavingSubquestion(null);
        }
    };

    const handleAnswerOptionChange = (id: string, field: 'code' | 'answer_text', value: string) => {
        setAnswerOptions((prev: any[]) =>
            prev.map((ao: any) =>
                ao.id === id ? { ...ao, [field]: value } : ao
            )
        );
    };

    const handleSaveAnswerOption = async (ao: any) => {
        setSavingAnswerOption(ao.id);
        try {
            const response = await fetch(`/api/survey/answer-options/${ao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: ao.code,
                    answer_text: ao.answer_text,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save answer option:', error);
            alert('Failed to save answer option');
        } finally {
            setSavingAnswerOption(null);
        }
    };

    return (
        <div className="editor-panel">
            <h2 className="editor-title">Edit Question: {question.code}</h2>

            <div className="editor-content">
                <label>Question Text</label>
                <textarea
                    className="question-textarea"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={4}
                />

                <button className="btn-save" onClick={handleSave}>
                    💾 Save Changes
                </button>

                {/* Subquestions Table */}
                {subquestions && subquestions.length > 0 && (
                    <div className="subquestions-section">
                        <h3>Subquestions</h3>
                        <table className="subquestions-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Subquestion</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subquestions.map((sq: any) => (
                                    <tr key={sq.id}>
                                        <td>
                                            <input
                                                type="text"
                                                className="inline-input inline-input-code"
                                                value={sq.code}
                                                onChange={(e) => handleSubquestionChange(sq.id, 'code', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="inline-input"
                                                value={sq.label}
                                                onChange={(e) => handleSubquestionChange(sq.id, 'label', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="btn-save-row"
                                                onClick={() => handleSaveSubquestion(sq)}
                                                disabled={savingSubquestion === sq.id}
                                            >
                                                {savingSubquestion === sq.id ? '...' : '💾'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Answer Options Table */}
                {answerOptions && answerOptions.length > 0 && (
                    <div className="subquestions-section">
                        <h3>Answer Options</h3>
                        <table className="subquestions-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Answer Text</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {answerOptions.map((ao: any) => (
                                    <tr key={ao.id}>
                                        <td>
                                            <input
                                                type="text"
                                                className="inline-input inline-input-code"
                                                value={ao.code}
                                                onChange={(e) => handleAnswerOptionChange(ao.id, 'code', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="inline-input"
                                                value={ao.answer_text}
                                                onChange={(e) => handleAnswerOptionChange(ao.id, 'answer_text', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="btn-save-row"
                                                onClick={() => handleSaveAnswerOption(ao)}
                                                disabled={savingAnswerOption === ao.id}
                                            >
                                                {savingAnswerOption === ao.id ? '...' : '💾'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .editor-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .editor-title {
                    font-size: 1.25rem;
                    font-weight: 500;
                    color: #333;
                    margin: 0;
                }

                .editor-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .editor-content label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #666;
                }

                .question-textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 0.875rem;
                    resize: vertical;
                }

                .btn-save {
                    background: #5cb85c;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    align-self: flex-start;
                }

                .btn-save:hover {
                    background: #4cae4c;
                }

                .subquestions-section {
                    margin-top: 1rem;
                }

                .subquestions-section h3 {
                    font-size: 1rem;
                    margin-bottom: 0.5rem;
                }

                .subquestions-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .subquestions-table th,
                .subquestions-table td {
                    padding: 0.5rem;
                    border: 1px solid #e0ddd8;
                    text-align: left;
                    font-size: 0.875rem;
                }

                .subquestions-table th {
                    background: #f9f9f9;
                    font-weight: 500;
                }

                .btn-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    font-size: 1rem;
                }

                .inline-input {
                    width: 100%;
                    padding: 0.375rem 0.5rem;
                    border: 1px solid transparent;
                    border-radius: 3px;
                    font-size: 0.875rem;
                    background: transparent;
                    transition: all 0.15s;
                }

                .inline-input:hover {
                    background: #f5f5f5;
                    border-color: #e0ddd8;
                }

                .inline-input:focus {
                    outline: none;
                    background: white;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .inline-input-code {
                    width: 80px;
                    font-family: monospace;
                    font-weight: 500;
                }

                .btn-save-row {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 3px;
                    transition: all 0.15s;
                }

                .btn-save-row:hover {
                    background: #e8f5e9;
                }

                .btn-save-row:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}

// Question Settings Panel Component - Comprehensive settings like LimeSurvey
function QuestionSettings({ question, onChange, onSave }: any) {
    const [localQuestion, setLocalQuestion] = useState(question);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general', 'validation']));

    // Sync when question changes
    useEffect(() => {
        setLocalQuestion(question);
    }, [question?.id]);

    const handleChange = (field: string, value: any) => {
        const updated = { ...localQuestion, [field]: value };
        setLocalQuestion(updated);
        onChange(updated);
    };

    const handleSettingChange = (setting: string, value: any) => {
        const updated = {
            ...localQuestion,
            settings: { ...localQuestion.settings, [setting]: value }
        };
        setLocalQuestion(updated);
        onChange(updated);
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handleSave = () => {
        onSave(localQuestion);
    };

    const settings = localQuestion.settings || {};
    const questionType = localQuestion.question_type;

    // Determine which settings are relevant for this question type
    const isChoiceQuestion = ['multiple_choice_single', 'multiple_choice_multiple', 'dropdown', 'list_with_comment', 'multiple_choice_with_comments', 'button_select', 'button_multi_select', 'image_select', 'image_multi_select'].includes(questionType);
    const isMultipleChoice = ['multiple_choice_multiple', 'button_multi_select', 'image_multi_select', 'multiple_choice_with_comments'].includes(questionType);
    const isArrayQuestion = questionType?.startsWith('array') || questionType === 'ranking';
    const isNumericalQuestion = ['numerical', 'multiple_numerical', 'slider'].includes(questionType);
    const isTextQuestion = ['text', 'long_text', 'huge_free_text', 'multiple_short_text'].includes(questionType);
    const isSliderQuestion = questionType === 'slider';
    const isDateQuestion = questionType === 'date';
    const isFileUpload = questionType === 'file_upload';
    const isButtonQuestion = ['button_select', 'button_multi_select'].includes(questionType);
    const isImageQuestion = ['image_select', 'image_multi_select'].includes(questionType);
    const isNPSQuestion = questionType === 'nps';
    const isCSATQuestion = questionType === 'csat';
    const isCESQuestion = questionType === 'ces';

    return (
        <div className="settings-panel">
            {/* General Settings - Always Visible */}
            <div className="settings-section">
                <button className="section-header" onClick={() => toggleSection('general')}>
                    <span className="section-icon">{expandedSections.has('general') ? '▼' : '▶'}</span>
                    <span>General Settings</span>
                </button>
                {expandedSections.has('general') && (
                    <div className="section-content">
                        <div className="setting-group">
                            <label>Code</label>
                            <input
                                type="text"
                                value={localQuestion.code || ''}
                                onChange={(e) => handleChange('code', e.target.value)}
                            />
                        </div>

                        <div className="setting-group">
                            <label>Question type</label>
                            <select
                                value={localQuestion.question_type}
                                onChange={(e) => handleChange('question_type', e.target.value)}
                            >
                                <optgroup label="Text">
                                    <option value="text">Short Text</option>
                                    <option value="long_text">Long Text</option>
                                    <option value="huge_free_text">Huge Free Text</option>
                                    <option value="multiple_short_text">Multiple Short Text</option>
                                </optgroup>
                                <optgroup label="Choice">
                                    <option value="multiple_choice_single">Single Choice</option>
                                    <option value="multiple_choice_multiple">Multiple Choice</option>
                                    <option value="dropdown">Dropdown</option>
                                    <option value="yes_no">Yes/No</option>
                                    <option value="list_with_comment">List with Comment</option>
                                    <option value="multiple_choice_with_comments">Choice with Comments</option>
                                    <option value="five_point_choice">5-Point Choice</option>
                                </optgroup>
                                <optgroup label="Button/Image">
                                    <option value="button_select">Button Select</option>
                                    <option value="button_multi_select">Button Multi-Select</option>
                                    <option value="image_select">Image Select</option>
                                    <option value="image_multi_select">Image Multi-Select</option>
                                </optgroup>
                                <optgroup label="Array/Matrix">
                                    <option value="array">Array (Likert)</option>
                                    <option value="array_5_point">Array 5-Point</option>
                                    <option value="array_10_point">Array 10-Point</option>
                                    <option value="array_dual_scale">Dual Scale</option>
                                    <option value="array_yes_no_uncertain">Yes/No/Uncertain</option>
                                    <option value="array_increase_same_decrease">Increase/Same/Decrease</option>
                                    <option value="array_numbers">Array (Numbers)</option>
                                    <option value="array_texts">Array (Text)</option>
                                </optgroup>
                                <optgroup label="Numeric/Scale">
                                    <option value="numerical">Numerical</option>
                                    <option value="multiple_numerical">Multiple Numerical</option>
                                    <option value="slider">Slider</option>
                                    <option value="ranking">Ranking</option>
                                </optgroup>
                                <optgroup label="Experience Metrics">
                                    <option value="nps">NPS (0-10)</option>
                                    <option value="csat">CSAT (Stars)</option>
                                    <option value="ces">CES (Effort)</option>
                                </optgroup>
                                <optgroup label="Other">
                                    <option value="date">Date</option>
                                    <option value="file_upload">File Upload</option>
                                    <option value="gender">Gender</option>
                                    <option value="text_display">Text Display</option>
                                    <option value="equation">Equation (Hidden)</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="setting-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.mandatory || false}
                                    onChange={(e) => handleSettingChange('mandatory', e.target.checked)}
                                />
                                <span>Mandatory</span>
                            </label>
                        </div>

                        {isChoiceQuestion && (
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.other_option || false}
                                        onChange={(e) => handleSettingChange('other_option', e.target.checked)}
                                    />
                                    <span>Include "Other" option</span>
                                </label>
                            </div>
                        )}

                        {(isChoiceQuestion || isArrayQuestion) && (
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.show_no_answer || false}
                                        onChange={(e) => handleSettingChange('show_no_answer', e.target.checked)}
                                    />
                                    <span>Show "No answer" option</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Validation Settings */}
            <div className="settings-section">
                <button className="section-header" onClick={() => toggleSection('validation')}>
                    <span className="section-icon">{expandedSections.has('validation') ? '▼' : '▶'}</span>
                    <span>Validation</span>
                </button>
                {expandedSections.has('validation') && (
                    <div className="section-content">
                        {isMultipleChoice && (
                            <>
                                <div className="setting-group">
                                    <label>Minimum selections</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.min_answers || ''}
                                        onChange={(e) => handleSettingChange('min_answers', e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="No minimum"
                                    />
                                </div>
                                <div className="setting-group">
                                    <label>Maximum selections</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.max_answers || ''}
                                        onChange={(e) => handleSettingChange('max_answers', e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="No maximum"
                                    />
                                </div>
                            </>
                        )}

                        {isNumericalQuestion && (
                            <>
                                <div className="setting-group">
                                    <label>Minimum value</label>
                                    <input
                                        type="number"
                                        value={settings.min_value ?? ''}
                                        onChange={(e) => handleSettingChange('min_value', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                        placeholder="No minimum"
                                    />
                                </div>
                                <div className="setting-group">
                                    <label>Maximum value</label>
                                    <input
                                        type="number"
                                        value={settings.max_value ?? ''}
                                        onChange={(e) => handleSettingChange('max_value', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                        placeholder="No maximum"
                                    />
                                </div>
                            </>
                        )}

                        {isTextQuestion && (
                            <div className="setting-group">
                                <label>Validation pattern (regex)</label>
                                <input
                                    type="text"
                                    value={settings.validation_regex || ''}
                                    onChange={(e) => handleSettingChange('validation_regex', e.target.value)}
                                    placeholder="e.g., ^[A-Z]{2}[0-9]{6}$"
                                />
                            </div>
                        )}

                        <div className="setting-group">
                            <label>Custom validation equation</label>
                            <input
                                type="text"
                                value={settings.validation_equation || ''}
                                onChange={(e) => handleSettingChange('validation_equation', e.target.value)}
                                placeholder="e.g., sum(Q1_SQ001, Q1_SQ002) <= 100"
                                className="code-input"
                            />
                        </div>

                        <div className="setting-group">
                            <label>Validation error message</label>
                            <input
                                type="text"
                                value={settings.validation_message || ''}
                                onChange={(e) => handleSettingChange('validation_message', e.target.value)}
                                placeholder="Custom error message"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Display Settings */}
            <div className="settings-section">
                <button className="section-header" onClick={() => toggleSection('display')}>
                    <span className="section-icon">{expandedSections.has('display') ? '▼' : '▶'}</span>
                    <span>Display</span>
                </button>
                {expandedSections.has('display') && (
                    <div className="section-content">
                        {isChoiceQuestion && (
                            <div className="setting-group">
                                <label>Display columns</label>
                                <select
                                    value={settings.display_columns || 1}
                                    onChange={(e) => handleSettingChange('display_columns', parseInt(e.target.value))}
                                >
                                    <option value={1}>1 column</option>
                                    <option value={2}>2 columns</option>
                                    <option value={3}>3 columns</option>
                                    <option value={4}>4 columns</option>
                                </select>
                            </div>
                        )}

                        {isButtonQuestion && (
                            <div className="setting-group">
                                <label>Button layout</label>
                                <select
                                    value={settings.button_layout || 'horizontal'}
                                    onChange={(e) => handleSettingChange('button_layout', e.target.value)}
                                >
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                    <option value="grid">Grid</option>
                                </select>
                            </div>
                        )}

                        {isButtonQuestion && (
                            <div className="setting-group">
                                <label>Button style</label>
                                <select
                                    value={settings.button_style || 'outline'}
                                    onChange={(e) => handleSettingChange('button_style', e.target.value)}
                                >
                                    <option value="outline">Outline</option>
                                    <option value="filled">Filled</option>
                                    <option value="pill">Pill</option>
                                </select>
                            </div>
                        )}

                        {isImageQuestion && (
                            <>
                                <div className="setting-group">
                                    <label>Image size</label>
                                    <select
                                        value={settings.image_size || 'medium'}
                                        onChange={(e) => handleSettingChange('image_size', e.target.value)}
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>
                                <div className="setting-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.image_show_labels !== false}
                                            onChange={(e) => handleSettingChange('image_show_labels', e.target.checked)}
                                        />
                                        <span>Show labels below images</span>
                                    </label>
                                </div>
                            </>
                        )}

                        {isTextQuestion && (
                            <div className="setting-group">
                                <label>Placeholder text</label>
                                <input
                                    type="text"
                                    value={settings.placeholder || ''}
                                    onChange={(e) => handleSettingChange('placeholder', e.target.value)}
                                    placeholder="Enter hint text..."
                                />
                            </div>
                        )}

                        {isNumericalQuestion && !isSliderQuestion && (
                            <>
                                <div className="setting-group">
                                    <label>Decimal places</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={settings.decimal_places ?? ''}
                                        onChange={(e) => handleSettingChange('decimal_places', e.target.value !== '' ? parseInt(e.target.value) : undefined)}
                                        placeholder="Auto"
                                    />
                                </div>
                                <div className="setting-row-2">
                                    <div className="setting-group">
                                        <label>Prefix</label>
                                        <input
                                            type="text"
                                            value={settings.prefix || ''}
                                            onChange={(e) => handleSettingChange('prefix', e.target.value)}
                                            placeholder="e.g., $"
                                        />
                                    </div>
                                    <div className="setting-group">
                                        <label>Suffix</label>
                                        <input
                                            type="text"
                                            value={settings.suffix || ''}
                                            onChange={(e) => handleSettingChange('suffix', e.target.value)}
                                            placeholder="e.g., %"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="setting-group">
                            <label>CSS class</label>
                            <input
                                type="text"
                                value={settings.css_class || ''}
                                onChange={(e) => handleSettingChange('css_class', e.target.value)}
                                placeholder="custom-class"
                            />
                        </div>

                        <div className="setting-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.hidden || false}
                                    onChange={(e) => handleSettingChange('hidden', e.target.checked)}
                                />
                                <span>Hide question</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Slider Settings - Only for slider type */}
            {isSliderQuestion && (
                <div className="settings-section">
                    <button className="section-header" onClick={() => toggleSection('slider')}>
                        <span className="section-icon">{expandedSections.has('slider') ? '▼' : '▶'}</span>
                        <span>Slider Options</span>
                    </button>
                    {expandedSections.has('slider') && (
                        <div className="section-content">
                            <div className="setting-row-2">
                                <div className="setting-group">
                                    <label>Min value</label>
                                    <input
                                        type="number"
                                        value={settings.slider_min ?? 0}
                                        onChange={(e) => handleSettingChange('slider_min', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="setting-group">
                                    <label>Max value</label>
                                    <input
                                        type="number"
                                        value={settings.slider_max ?? 100}
                                        onChange={(e) => handleSettingChange('slider_max', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="setting-group">
                                <label>Step increment</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={settings.slider_step ?? 1}
                                    onChange={(e) => handleSettingChange('slider_step', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="setting-row-2">
                                <div className="setting-group">
                                    <label>Min label</label>
                                    <input
                                        type="text"
                                        value={settings.slider_min_label || ''}
                                        onChange={(e) => handleSettingChange('slider_min_label', e.target.value)}
                                        placeholder="Low"
                                    />
                                </div>
                                <div className="setting-group">
                                    <label>Max label</label>
                                    <input
                                        type="text"
                                        value={settings.slider_max_label || ''}
                                        onChange={(e) => handleSettingChange('slider_max_label', e.target.value)}
                                        placeholder="High"
                                    />
                                </div>
                            </div>
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.slider_show_value !== false}
                                        onChange={(e) => handleSettingChange('slider_show_value', e.target.checked)}
                                    />
                                    <span>Show current value</span>
                                </label>
                            </div>
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.slider_show_ticks || false}
                                        onChange={(e) => handleSettingChange('slider_show_ticks', e.target.checked)}
                                    />
                                    <span>Show tick marks</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Date Settings */}
            {isDateQuestion && (
                <div className="settings-section">
                    <button className="section-header" onClick={() => toggleSection('date')}>
                        <span className="section-icon">{expandedSections.has('date') ? '▼' : '▶'}</span>
                        <span>Date Options</span>
                    </button>
                    {expandedSections.has('date') && (
                        <div className="section-content">
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.date_include_time || false}
                                        onChange={(e) => handleSettingChange('date_include_time', e.target.checked)}
                                    />
                                    <span>Include time picker</span>
                                </label>
                            </div>
                            <div className="setting-group">
                                <label>Minimum date</label>
                                <input
                                    type="date"
                                    value={settings.date_min || ''}
                                    onChange={(e) => handleSettingChange('date_min', e.target.value)}
                                />
                            </div>
                            <div className="setting-group">
                                <label>Maximum date</label>
                                <input
                                    type="date"
                                    value={settings.date_max || ''}
                                    onChange={(e) => handleSettingChange('date_max', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* File Upload Settings */}
            {isFileUpload && (
                <div className="settings-section">
                    <button className="section-header" onClick={() => toggleSection('file')}>
                        <span className="section-icon">{expandedSections.has('file') ? '▼' : '▶'}</span>
                        <span>File Upload Options</span>
                    </button>
                    {expandedSections.has('file') && (
                        <div className="section-content">
                            <div className="setting-group">
                                <label>Allowed file types</label>
                                <input
                                    type="text"
                                    value={(settings.allowed_file_types || []).join(', ')}
                                    onChange={(e) => handleSettingChange('allowed_file_types', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="pdf, doc, jpg, png"
                                />
                            </div>
                            <div className="setting-group">
                                <label>Max file size (MB)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={settings.max_file_size || ''}
                                    onChange={(e) => handleSettingChange('max_file_size', e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="10"
                                />
                            </div>
                            <div className="setting-group">
                                <label>Max number of files</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={settings.max_files || ''}
                                    onChange={(e) => handleSettingChange('max_files', e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="1"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* NPS Settings */}
            {isNPSQuestion && (
                <div className="settings-section">
                    <button className="section-header" onClick={() => toggleSection('nps')}>
                        <span className="section-icon">{expandedSections.has('nps') ? '▼' : '▶'}</span>
                        <span>NPS Options</span>
                    </button>
                    {expandedSections.has('nps') && (
                        <div className="section-content">
                            <div className="setting-group">
                                <label>Low end label</label>
                                <input
                                    type="text"
                                    value={settings.nps_low_label || ''}
                                    onChange={(e) => handleSettingChange('nps_low_label', e.target.value)}
                                    placeholder="Not at all likely"
                                />
                            </div>
                            <div className="setting-group">
                                <label>High end label</label>
                                <input
                                    type="text"
                                    value={settings.nps_high_label || ''}
                                    onChange={(e) => handleSettingChange('nps_high_label', e.target.value)}
                                    placeholder="Extremely likely"
                                />
                            </div>
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.nps_show_category !== false}
                                        onChange={(e) => handleSettingChange('nps_show_category', e.target.checked)}
                                    />
                                    <span>Show category labels</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Logic/Randomization Settings */}
            <div className="settings-section">
                <button className="section-header" onClick={() => toggleSection('logic')}>
                    <span className="section-icon">{expandedSections.has('logic') ? '▼' : '▶'}</span>
                    <span>Logic & Order</span>
                </button>
                {expandedSections.has('logic') && (
                    <div className="section-content">
                        <div className="setting-group">
                            <label>Relevance condition</label>
                            <input
                                type="text"
                                value={localQuestion.relevance_logic || ''}
                                onChange={(e) => handleChange('relevance_logic', e.target.value)}
                                placeholder="e.g., Q1 == 'A1'"
                                className="code-input"
                            />
                            <span className="help-text">Show only when condition is true</span>
                        </div>

                        {(isChoiceQuestion || isArrayQuestion) && (
                            <>
                                <div className="setting-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.randomize_answers || false}
                                            onChange={(e) => handleSettingChange('randomize_answers', e.target.checked)}
                                        />
                                        <span>Randomize answer order</span>
                                    </label>
                                </div>
                            </>
                        )}

                        {isArrayQuestion && (
                            <div className="setting-group">
                                <label>Subquestion order</label>
                                <select
                                    value={settings.subquestion_order || 'default'}
                                    onChange={(e) => handleSettingChange('subquestion_order', e.target.value)}
                                >
                                    <option value="default">Default order</option>
                                    <option value="random">Randomize</option>
                                    <option value="alphabetical">Alphabetical</option>
                                </select>
                            </div>
                        )}

                        <div className="setting-group">
                            <label>Randomization group</label>
                            <input
                                type="text"
                                value={settings.randomization_group || ''}
                                onChange={(e) => handleSettingChange('randomization_group', e.target.value)}
                                placeholder="Group name"
                            />
                            <span className="help-text">Questions with same group are randomized together</span>
                        </div>

                        {isMultipleChoice && (
                            <div className="setting-group">
                                <label>Exclusive option code</label>
                                <input
                                    type="text"
                                    value={settings.exclusive_option || ''}
                                    onChange={(e) => handleSettingChange('exclusive_option', e.target.value)}
                                    placeholder="e.g., A99"
                                />
                                <span className="help-text">This option deselects all others</span>
                            </div>
                        )}

                        {isArrayQuestion && (
                            <div className="setting-group">
                                <label>Array filter (question code)</label>
                                <input
                                    type="text"
                                    value={settings.array_filter_question || ''}
                                    onChange={(e) => handleSettingChange('array_filter_question', e.target.value)}
                                    placeholder="e.g., Q1"
                                />
                                <span className="help-text">Only show subquestions selected in that question</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <button className="btn-save-settings" onClick={handleSave}>
                💾 Save Settings
            </button>

            <style jsx>{`
                .settings-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }

                .settings-section {
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .section-header {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 0.75rem;
                    background: #f8f7f5;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 0.8125rem;
                    color: #1a1d24;
                    text-align: left;
                }

                .section-header:hover {
                    background: #f0eee9;
                }

                .section-icon {
                    font-size: 0.625rem;
                    color: #888;
                }

                .section-content {
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    background: white;
                    border-top: 1px solid #e0ddd8;
                }

                .setting-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .setting-group label {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #666;
                }

                .setting-group input,
                .setting-group select {
                    padding: 0.5rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.8125rem;
                    background: white;
                }

                .setting-group input:focus,
                .setting-group select:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .code-input {
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.75rem !important;
                }

                .setting-row {
                    display: flex;
                    align-items: center;
                }

                .setting-row-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-size: 0.8125rem;
                    color: #333;
                }

                .checkbox-label input {
                    width: 1rem;
                    height: 1rem;
                    accent-color: #c94a4a;
                }

                .help-text {
                    font-size: 0.6875rem;
                    color: #999;
                    margin-top: 0.125rem;
                }

                .btn-save-settings {
                    background: #5cb85c;
                    color: white;
                    padding: 0.75rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                }

                .btn-save-settings:hover {
                    background: #4cae4c;
                }
            `}</style>
        </div>
    );
}
