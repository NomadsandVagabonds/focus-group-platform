'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparks, Minus, NavArrowUp, Check, Xmark, Eye } from 'iconoir-react';
import type { SurveyWithStructure, Question } from '@/lib/supabase/survey-types';
import QuestionPreview from '../QuestionPreview';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    proposedChanges?: any;
    applied?: boolean;
}

interface AIAssistantPanelProps {
    survey: SurveyWithStructure;
    onApplyChanges: (updatedSurvey: SurveyWithStructure) => void;
    selectedQuestion: Question | null;
}

export default function AIAssistantPanel({
    survey,
    onApplyChanges,
    selectedQuestion,
}: AIAssistantPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Detect if user wants to apply pending changes
    const isApplyIntent = (text: string): boolean => {
        const applyPhrases = [
            'apply', 'do it', 'yes', 'make it so', 'go ahead', 'proceed',
            'execute', 'run it', 'confirm', 'ok', 'okay', 'yep', 'sure',
            'that works', 'looks good', 'perfect', 'do that', 'make the change',
            'apply the change', 'apply it', 'apply changes', 'apply those',
        ];
        const lower = text.toLowerCase().trim();
        return applyPhrases.some(phrase => lower === phrase || lower.startsWith(phrase + ' ') || lower.endsWith(' ' + phrase));
    };

    // Find the last message with unapplied changes
    const findPendingChanges = (): number | null => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].proposedChanges && !messages[i].applied) {
                return i;
            }
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Check if user is trying to apply pending changes conversationally
        const pendingIndex = findPendingChanges();
        if (pendingIndex !== null && isApplyIntent(userMessage)) {
            setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
            // Auto-apply the pending changes
            await applyChanges(pendingIndex);
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: '✅ Changes applied successfully!'
            }]);
            return;
        }

        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/survey/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey,
                    message: userMessage,
                    messageHistory: messages.map(m => ({ role: m.role, content: m.content })),
                    contextQuestion: selectedQuestion
                        ? {
                            code: selectedQuestion.code,
                            question_text: selectedQuestion.question_text,
                            question_type: selectedQuestion.question_type,
                        }
                        : null,
                }),
            });

            const data = await response.json();

            // DEBUG: Log the parsed response
            console.log('AI Assistant Response:', data);
            console.log('Action type:', data.action);
            console.log('Has actions array:', !!data.actions);
            console.log('Has changes:', !!data.changes);

            if (!response.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: `Error: ${data.error}` },
                ]);
                return;
            }

            // Handle the response based on action type
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.explanation || 'Here is my suggestion:',
            };

            // Check for actions (multi_action or single action with changes)
            if (data.action === 'multi_action' && data.actions) {
                console.log('Setting proposedChanges for multi_action');
                assistantMessage.proposedChanges = data;
            } else if (data.action !== 'clarify' && data.changes) {
                console.log('Setting proposedChanges for single action');
                assistantMessage.proposedChanges = data;
            } else {
                console.log('No proposedChanges set - action:', data.action);
            }

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `Error: ${error.message}` },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to apply a single action
    const applySingleAction = async (
        actionData: { action: string; target: string; changes: any },
        currentSurvey: SurveyWithStructure
    ): Promise<SurveyWithStructure> => {
        console.log('applySingleAction called with:', actionData);
        let updatedSurvey = { ...currentSurvey };
        const { action, target, changes } = actionData;
        console.log('Action:', action, 'Target:', target, 'Changes:', changes);

        if (action === 'add_question') {
            const targetGroup = target
                ? updatedSurvey.question_groups?.find(
                    (g) => g.title.toLowerCase() === target.toLowerCase()
                )
                : updatedSurvey.question_groups?.[0];

            if (!targetGroup) {
                throw new Error(`Target group "${target}" not found`);
            }

            const response = await fetch('/api/survey/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_id: survey.id,
                    group_id: targetGroup.id,
                    ...changes,
                    order_index: targetGroup.questions?.length || 0,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to add question (${response.status})`);
            }

            const newQuestion = await response.json();
            updatedSurvey = {
                ...updatedSurvey,
                question_groups: updatedSurvey.question_groups?.map((g) =>
                    g.id === targetGroup.id
                        ? { ...g, questions: [...(g.questions || []), newQuestion] }
                        : g
                ),
            } as SurveyWithStructure;
        } else if (action === 'modify_question' && target) {
            const questionToUpdate = updatedSurvey.question_groups
                ?.flatMap((g) => g.questions || [])
                .find((q) => q.code === target);

            if (!questionToUpdate) {
                throw new Error(`Question "${target}" not found`);
            }

            const mergedQuestion = {
                ...questionToUpdate,
                ...changes,
                settings: { ...questionToUpdate.settings, ...changes.settings },
            };

            const response = await fetch(
                `/api/survey/questions/${questionToUpdate.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mergedQuestion),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to modify question (${response.status})`);
            }

            updatedSurvey = {
                ...updatedSurvey,
                question_groups: updatedSurvey.question_groups?.map((g) => ({
                    ...g,
                    questions: g.questions?.map((q) =>
                        q.id === questionToUpdate.id ? mergedQuestion : q
                    ),
                })),
            } as SurveyWithStructure;
        } else if (action === 'add_group') {
            const response = await fetch('/api/survey/question-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_id: survey.id,
                    title: changes.title,
                    order_index: updatedSurvey.question_groups?.length || 0,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to add group (${response.status})`);
            }

            const newGroup = await response.json();
            updatedSurvey = {
                ...updatedSurvey,
                question_groups: [
                    ...(updatedSurvey.question_groups || []),
                    { ...newGroup, questions: [] },
                ],
            } as SurveyWithStructure;
        } else if (action === 'modify_settings' && target) {
            const questionToUpdate = updatedSurvey.question_groups
                ?.flatMap((g) => g.questions || [])
                .find((q) => q.code === target);

            if (!questionToUpdate) {
                throw new Error(`Question "${target}" not found for settings update`);
            }

            const mergedQuestion = {
                ...questionToUpdate,
                settings: { ...questionToUpdate.settings, ...changes.settings },
            };

            const response = await fetch(
                `/api/survey/questions/${questionToUpdate.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mergedQuestion),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to update settings (${response.status})`);
            }

            updatedSurvey = {
                ...updatedSurvey,
                question_groups: updatedSurvey.question_groups?.map((g) => ({
                    ...g,
                    questions: g.questions?.map((q) =>
                        q.id === questionToUpdate.id ? mergedQuestion : q
                    ),
                })),
            } as SurveyWithStructure;
        }

        return updatedSurvey;
    };

    const applyChanges = async (messageIndex: number) => {
        const message = messages[messageIndex];
        if (!message.proposedChanges) return;

        const proposedChanges = message.proposedChanges;

        try {
            let updatedSurvey = { ...survey };

            if (proposedChanges.action === 'multi_action' && proposedChanges.actions) {
                // Apply each action in sequence
                for (const actionItem of proposedChanges.actions) {
                    updatedSurvey = await applySingleAction(actionItem, updatedSurvey);
                }
            } else {
                // Single action
                updatedSurvey = await applySingleAction(proposedChanges, updatedSurvey);
            }

            // Update local state and mark as applied
            onApplyChanges(updatedSurvey);
            setMessages((prev) =>
                prev.map((m, i) => (i === messageIndex ? { ...m, applied: true } : m))
            );
        } catch (error: any) {
            console.error('Failed to apply changes:', error);
            // Show error message to user
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Failed to apply changes: ${error.message || 'Unknown error'}. Please try again or make the change manually.`,
                },
            ]);
        }
    };

    return (
        <div className="ai-assistant-container">
            {/* Collapsed bar */}
            {!isExpanded && (
                <button className="ai-collapsed-bar" onClick={() => setIsExpanded(true)}>
                    <Sparks width={16} height={16} />
                    <span>AI Assistant</span>
                    {selectedQuestion && (
                        <span className="context-badge">Editing {selectedQuestion.code}</span>
                    )}
                </button>
            )}

            {/* Expanded panel */}
            {isExpanded && (
                <div className="ai-expanded-panel">
                    <div className="ai-header">
                        <div className="ai-title">
                            <Sparks width={16} height={16} />
                            <span>AI Assistant</span>
                            {selectedQuestion && (
                                <span className="context-badge">
                                    Context: {selectedQuestion.code}
                                </span>
                            )}
                        </div>
                        <button
                            className="ai-collapse-btn"
                            onClick={() => setIsExpanded(false)}
                        >
                            <Minus width={16} height={16} />
                        </button>
                    </div>

                    <div className="ai-messages">
                        {messages.length === 0 && (
                            <div className="ai-welcome">
                                <p>
                                    Describe what you want to do with your survey, and I'll help
                                    make it happen.
                                </p>
                                <div className="ai-suggestions">
                                    <button onClick={() => setInput('Add a text question asking for their email address')}>
                                        Add email question
                                    </button>
                                    <button onClick={() => setInput('Add a 5-point Likert scale about AI trust')}>
                                        Add Likert scale
                                    </button>
                                    <button onClick={() => setInput('Make the current question mandatory')}>
                                        Make mandatory
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-message ai-message-${msg.role}`}>
                                <div className="ai-message-content">{msg.content}</div>

                                {/* Show preview for add/modify question actions */}
                                {msg.proposedChanges && !msg.applied && (
                                    <>
                                        {(msg.proposedChanges.action === 'add_question' ||
                                            msg.proposedChanges.action === 'modify_question') &&
                                            msg.proposedChanges.changes && (
                                                <QuestionPreview
                                                    questionData={msg.proposedChanges.changes}
                                                    isModification={msg.proposedChanges.action === 'modify_question'}
                                                />
                                            )}

                                        {/* Summary for multi-action */}
                                        {msg.proposedChanges.action === 'multi_action' && (
                                            <div className="multi-action-summary">
                                                <Eye width={14} height={14} />
                                                <span>{msg.proposedChanges.actions?.length || 0} questions will be updated</span>
                                            </div>
                                        )}

                                        <div className="ai-actions">
                                            <button
                                                className="ai-apply-btn"
                                                onClick={() => applyChanges(i)}
                                            >
                                                <Check width={14} height={14} />
                                                Apply
                                            </button>
                                            <button
                                                className="ai-reject-btn"
                                                onClick={() =>
                                                    setMessages((prev) =>
                                                        prev.map((m, idx) =>
                                                            idx === i ? { ...m, proposedChanges: undefined } : m
                                                        )
                                                    )
                                                }
                                            >
                                                <Xmark width={14} height={14} />
                                                Dismiss
                                            </button>
                                        </div>
                                    </>
                                )}
                                {msg.applied && (
                                    <div className="ai-applied-badge">
                                        <Check width={12} height={12} /> Applied
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ai-message ai-message-assistant ai-loading">
                                <span className="ai-loading-dot"></span>
                                <span className="ai-loading-dot"></span>
                                <span className="ai-loading-dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="ai-input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe what you want to do..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()}>
                            <NavArrowUp width={18} height={18} />
                        </button>
                    </form>
                </div>
            )}

            <style jsx>{`
        .ai-assistant-container {
          background: #faf9f7;
          border-bottom: 1px solid #e0ddd8;
        }

        .ai-collapsed-bar {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #f8f7f5 0%, #f0eeea 100%);
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          transition: all 0.15s;
        }

        .ai-collapsed-bar:hover {
          background: linear-gradient(135deg, #f0eeea 0%, #e8e6e2 100%);
          color: #333;
        }

        .context-badge {
          margin-left: auto;
          padding: 3px 8px;
          background: #e0ddd8;
          border-radius: 12px;
          font-size: 11px;
          color: #666;
        }

        .ai-expanded-panel {
          display: flex;
          flex-direction: column;
          max-height: 280px;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: linear-gradient(135deg, #f8f7f5 0%, #f0eeea 100%);
          border-bottom: 1px solid #e0ddd8;
        }

        .ai-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }

        .ai-collapse-btn {
          padding: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #666;
          border-radius: 4px;
        }

        .ai-collapse-btn:hover {
          background: #e0ddd8;
        }

        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ai-welcome {
          text-align: center;
          padding: 12px;
        }

        .ai-welcome p {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #666;
        }

        .ai-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }

        .ai-suggestions button {
          padding: 6px 12px;
          background: white;
          border: 1px solid #e0ddd8;
          border-radius: 16px;
          font-size: 12px;
          color: #555;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ai-suggestions button:hover {
          background: #f5f3ef;
          border-color: #c94a4a;
          color: #c94a4a;
        }

        .ai-message {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.4;
          max-width: 85%;
        }

        .ai-message-user {
          align-self: flex-end;
          background: #c94a4a;
          color: white;
        }

        .ai-message-assistant {
          align-self: flex-start;
          background: white;
          border: 1px solid #e0ddd8;
          color: #333;
        }

        .ai-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e0ddd8;
        }

        .ai-apply-btn, .ai-reject-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          border: none;
        }

        .ai-apply-btn {
          background: #5cb85c;
          color: white;
        }

        .ai-apply-btn:hover {
          background: #4cae4c;
        }

        .ai-reject-btn {
          background: #f0f0f0;
          color: #666;
        }

        .ai-reject-btn:hover {
          background: #e0e0e0;
        }

        .ai-applied-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          padding: 3px 8px;
          background: #d4edda;
          color: #155724;
          border-radius: 10px;
          font-size: 11px;
        }

        .multi-action-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          margin: 8px 0;
          background: #e8f4fd;
          color: #0969da;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .ai-loading {
          display: flex;
          gap: 4px;
          padding: 14px;
        }

        .ai-loading-dot {
          width: 6px;
          height: 6px;
          background: #999;
          border-radius: 50%;
          animation: pulse 1.4s infinite ease-in-out both;
        }

        .ai-loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .ai-loading-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .ai-input-form {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #e0ddd8;
          background: white;
        }

        .ai-input-form input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #e0ddd8;
          border-radius: 20px;
          font-size: 13px;
          outline: none;
        }

        .ai-input-form input:focus {
          border-color: #c94a4a;
        }

        .ai-input-form button {
          padding: 8px 12px;
          background: #c94a4a;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-input-form button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .ai-input-form button:not(:disabled):hover {
          background: #b43d3d;
        }
      `}</style>
        </div>
    );
}
