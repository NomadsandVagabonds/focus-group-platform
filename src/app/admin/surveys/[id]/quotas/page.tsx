// Quota Management Page
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Quota {
    id: string;
    survey_id: string;
    name: string;
    description?: string;
    limit: number;
    current_count: number;
    action: 'screenout' | 'stop' | 'redirect';
    redirect_url?: string;
    conditions: QuotaCondition[];
    is_active: boolean;
    created_at: string;
}

interface QuotaCondition {
    question_code: string;
    operator: string;
    value: string | string[];
}

interface Question {
    code: string;
    question_text: string;
    question_type: string;
    answer_options: { code: string; label: string }[];
}

export default function QuotasPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: surveyId } = use(params);
    const [quotas, setQuotas] = useState<Quota[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingQuota, setEditingQuota] = useState<Quota | null>(null);

    useEffect(() => {
        fetchData();
    }, [surveyId]);

    async function fetchData() {
        try {
            const [quotasRes, surveyRes] = await Promise.all([
                fetch(`/api/survey/quotas?surveyId=${surveyId}`),
                fetch(`/api/survey/surveys/${surveyId}`)
            ]);

            if (quotasRes.ok) {
                const data = await quotasRes.json();
                setQuotas(data.quotas || []);
            }

            if (surveyRes.ok) {
                const data = await surveyRes.json();
                // Extract questions from survey structure
                const allQuestions: Question[] = [];
                data.data?.question_groups?.forEach((group: any) => {
                    group.questions?.forEach((q: any) => {
                        allQuestions.push({
                            code: q.code,
                            question_text: q.question_text,
                            question_type: q.question_type,
                            answer_options: q.answer_options || [],
                        });
                    });
                });
                setQuestions(allQuestions);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (quotaId: string) => {
        if (!confirm('Delete this quota?')) return;

        try {
            const res = await fetch(`/api/survey/quotas/${quotaId}`, { method: 'DELETE' });
            if (res.ok) {
                setQuotas(quotas.filter(q => q.id !== quotaId));
            }
        } catch (error) {
            console.error('Error deleting quota:', error);
        }
    };

    const handleToggleActive = async (quota: Quota) => {
        try {
            const res = await fetch(`/api/survey/quotas/${quota.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...quota, isActive: !quota.is_active })
            });

            if (res.ok) {
                setQuotas(quotas.map(q =>
                    q.id === quota.id ? { ...q, is_active: !q.is_active } : q
                ));
            }
        } catch (error) {
            console.error('Error toggling quota:', error);
        }
    };

    const handleResetCount = async (quotaId: string) => {
        if (!confirm('Reset the count for this quota to 0?')) return;

        try {
            const res = await fetch(`/api/survey/quotas/${quotaId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' })
            });

            if (res.ok) {
                const data = await res.json();
                setQuotas(quotas.map(q =>
                    q.id === quotaId ? { ...q, current_count: 0 } : q
                ));
            }
        } catch (error) {
            console.error('Error resetting quota:', error);
        }
    };

    return (
        <div className="quotas-container">
            <div className="page-header">
                <div className="header-left">
                    <Link href={`/admin/surveys/${surveyId}`} className="back-link">
                        &larr; Back to Survey
                    </Link>
                    <h1>Quota Management</h1>
                </div>
                <button onClick={() => { setEditingQuota(null); setShowModal(true); }} className="btn-primary">
                    + Add Quota
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading quotas...</div>
            ) : quotas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <h3>No quotas configured</h3>
                    <p>Set up quotas to control how many responses are collected for specific criteria</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        Create Your First Quota
                    </button>
                </div>
            ) : (
                <div className="quotas-list">
                    {quotas.map(quota => (
                        <div key={quota.id} className={`quota-card ${!quota.is_active ? 'inactive' : ''}`}>
                            <div className="quota-header">
                                <div className="quota-info">
                                    <h3>{quota.name}</h3>
                                    {quota.description && <p>{quota.description}</p>}
                                </div>
                                <div className="quota-actions">
                                    <button
                                        onClick={() => handleToggleActive(quota)}
                                        className={`btn-small ${quota.is_active ? 'btn-warning' : 'btn-success'}`}
                                    >
                                        {quota.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => { setEditingQuota(quota); setShowModal(true); }}
                                        className="btn-small"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(quota.id)}
                                        className="btn-small btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="quota-progress">
                                <div className="progress-bar">
                                    <div
                                        className={`progress-fill ${quota.current_count >= quota.limit ? 'full' : ''}`}
                                        style={{ width: `${quota.limit > 0 ? Math.min(100, (quota.current_count / quota.limit) * 100) : 0}%` }}
                                    />
                                </div>
                                <div className="progress-text">
                                    <span>{quota.current_count} / {quota.limit}</span>
                                    <span className="percentage">
                                        ({quota.limit > 0 ? Math.round((quota.current_count / quota.limit) * 100) : 0}%)
                                    </span>
                                    <button
                                        onClick={() => handleResetCount(quota.id)}
                                        className="reset-btn"
                                        title="Reset count"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <div className="quota-details">
                                <div className="detail-item">
                                    <span className="label">Action when full:</span>
                                    <span className={`action-badge ${quota.action}`}>
                                        {quota.action === 'screenout' && 'Screen Out'}
                                        {quota.action === 'stop' && 'Stop Survey'}
                                        {quota.action === 'redirect' && 'Redirect'}
                                    </span>
                                </div>

                                {quota.conditions && quota.conditions.length > 0 && (
                                    <div className="detail-item">
                                        <span className="label">Conditions:</span>
                                        <div className="conditions-list">
                                            {quota.conditions.map((cond, idx) => (
                                                <span key={idx} className="condition-badge">
                                                    {cond.question_code} {cond.operator} {
                                                        Array.isArray(cond.value)
                                                            ? cond.value.join(', ')
                                                            : cond.value
                                                    }
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <QuotaModal
                    quota={editingQuota}
                    surveyId={surveyId}
                    questions={questions}
                    onClose={() => { setShowModal(false); setEditingQuota(null); }}
                    onSaved={() => { setShowModal(false); setEditingQuota(null); fetchData(); }}
                />
            )}

            <style jsx>{`
                .quotas-container {
                    padding: 2rem;
                    background: #f5f3ef;
                    min-height: 100vh;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .back-link {
                    color: #c94a4a;
                    text-decoration: none;
                    font-size: 0.875rem;
                }

                .page-header h1 {
                    font-size: 1.75rem;
                    color: #1a1d24;
                    margin: 0;
                }

                .btn-primary {
                    background: #c94a4a;
                    color: white;
                    padding: 0.625rem 1.25rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .loading {
                    padding: 3rem;
                    text-align: center;
                    color: #666;
                }

                .empty-state {
                    background: white;
                    border-radius: 8px;
                    padding: 4rem 2rem;
                    text-align: center;
                }

                .empty-icon {
                    margin-bottom: 1.5rem;
                    opacity: 0.5;
                }

                .empty-state h3 {
                    font-size: 1.25rem;
                    color: #1a1d24;
                    margin: 0 0 0.5rem 0;
                }

                .empty-state p {
                    color: #666;
                    margin: 0 0 1.5rem 0;
                }

                .quotas-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .quota-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    border-left: 4px solid #c94a4a;
                }

                .quota-card.inactive {
                    opacity: 0.6;
                    border-left-color: #999;
                }

                .quota-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .quota-info h3 {
                    font-size: 1.125rem;
                    color: #1a1d24;
                    margin: 0 0 0.25rem 0;
                }

                .quota-info p {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0;
                }

                .quota-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-small {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8125rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    background: #e0ddd8;
                    color: #1a1d24;
                }

                .btn-small.btn-danger {
                    background: #f8d7da;
                    color: #721c24;
                }

                .btn-small.btn-warning {
                    background: #fff3cd;
                    color: #856404;
                }

                .btn-small.btn-success {
                    background: #d4edda;
                    color: #155724;
                }

                .quota-progress {
                    margin-bottom: 1rem;
                }

                .progress-bar {
                    height: 8px;
                    background: #e0ddd8;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 0.5rem;
                }

                .progress-fill {
                    height: 100%;
                    background: #c94a4a;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .progress-fill.full {
                    background: #28a745;
                }

                .progress-text {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }

                .percentage {
                    color: #666;
                }

                .reset-btn {
                    background: none;
                    border: none;
                    color: #c94a4a;
                    font-size: 0.75rem;
                    cursor: pointer;
                    margin-left: auto;
                }

                .quota-details {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }

                .detail-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                }

                .label {
                    color: #666;
                    flex-shrink: 0;
                }

                .action-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .action-badge.screenout {
                    background: #f8d7da;
                    color: #721c24;
                }

                .action-badge.stop {
                    background: #fff3cd;
                    color: #856404;
                }

                .action-badge.redirect {
                    background: #d4edda;
                    color: #155724;
                }

                .conditions-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                }

                .condition-badge {
                    background: #f0f0f0;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-family: monospace;
                }
            `}</style>
        </div>
    );
}

// Quota Modal Component
function QuotaModal({
    quota,
    surveyId,
    questions,
    onClose,
    onSaved
}: {
    quota: Quota | null;
    surveyId: string;
    questions: Question[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(quota?.name || '');
    const [description, setDescription] = useState(quota?.description || '');
    const [limit, setLimit] = useState(quota?.limit || 100);
    const [action, setAction] = useState<'screenout' | 'stop' | 'redirect'>(quota?.action || 'screenout');
    const [redirectUrl, setRedirectUrl] = useState(quota?.redirect_url || '');
    const [conditions, setConditions] = useState<QuotaCondition[]>(quota?.conditions || []);
    const [saving, setSaving] = useState(false);

    const addCondition = () => {
        setConditions([...conditions, { question_code: '', operator: 'equals', value: '' }]);
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const updated = [...conditions];
        updated[index] = { ...updated[index], [field]: value };
        setConditions(updated);
    };

    const removeCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim() || !limit) return;

        setSaving(true);
        try {
            const url = quota ? `/api/survey/quotas/${quota.id}` : '/api/survey/quotas';
            const method = quota ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId,
                    name,
                    description,
                    limit,
                    action,
                    redirectUrl,
                    conditions: conditions.filter(c => c.question_code),
                })
            });

            if (res.ok) {
                onSaved();
            }
        } catch (error) {
            console.error('Error saving quota:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{quota ? 'Edit Quota' : 'New Quota'}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Quota Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Male respondents"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Additional details about this quota"
                            rows={2}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Quota Limit</label>
                            <input
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                                min={1}
                            />
                        </div>

                        <div className="form-group">
                            <label>Action When Full</label>
                            <select value={action} onChange={(e) => setAction(e.target.value as any)}>
                                <option value="screenout">Screen Out</option>
                                <option value="stop">Stop Survey</option>
                                <option value="redirect">Redirect</option>
                            </select>
                        </div>
                    </div>

                    {action === 'redirect' && (
                        <div className="form-group">
                            <label>Redirect URL</label>
                            <input
                                type="url"
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    )}

                    <div className="conditions-section">
                        <div className="section-header">
                            <label>Conditions</label>
                            <button type="button" onClick={addCondition} className="btn-small">
                                + Add Condition
                            </button>
                        </div>

                        {conditions.length === 0 ? (
                            <p className="help-text">No conditions = applies to all responses</p>
                        ) : (
                            conditions.map((cond, idx) => (
                                <div key={idx} className="condition-row">
                                    <select
                                        value={cond.question_code}
                                        onChange={(e) => updateCondition(idx, 'question_code', e.target.value)}
                                    >
                                        <option value="">Select question...</option>
                                        {questions.map(q => (
                                            <option key={q.code} value={q.code}>{q.code}: {q.question_text.slice(0, 40)}...</option>
                                        ))}
                                    </select>
                                    <select
                                        value={cond.operator}
                                        onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                                    >
                                        <option value="equals">Equals</option>
                                        <option value="not_equals">Not Equals</option>
                                        <option value="in">In List</option>
                                        <option value="not_in">Not In List</option>
                                        <option value="greater">Greater Than</option>
                                        <option value="less">Less Than</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={Array.isArray(cond.value) ? cond.value.join(',') : cond.value}
                                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                                        placeholder="Value"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCondition(idx)}
                                        className="remove-btn"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={saving || !name.trim() || !limit}
                    >
                        {saving ? 'Saving...' : quota ? 'Update Quota' : 'Create Quota'}
                    </button>
                </div>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 8px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 90vh;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                    }

                    .modal-header {
                        padding: 1.25rem 1.5rem;
                        border-bottom: 1px solid #e0ddd8;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .modal-header h2 {
                        font-size: 1.25rem;
                        color: #1a1d24;
                        margin: 0;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: #999;
                        cursor: pointer;
                    }

                    .modal-body {
                        padding: 1.5rem;
                        overflow-y: auto;
                        flex: 1;
                    }

                    .form-group {
                        margin-bottom: 1.25rem;
                    }

                    .form-group label {
                        display: block;
                        font-size: 0.875rem;
                        font-weight: 500;
                        color: #1a1d24;
                        margin-bottom: 0.5rem;
                    }

                    .form-group input,
                    .form-group select,
                    .form-group textarea {
                        width: 100%;
                        padding: 0.625rem;
                        border: 1px solid #e0ddd8;
                        border-radius: 4px;
                        font-size: 0.875rem;
                    }

                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }

                    .conditions-section {
                        border: 1px solid #e0ddd8;
                        border-radius: 6px;
                        padding: 1rem;
                    }

                    .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    }

                    .section-header label {
                        font-size: 0.875rem;
                        font-weight: 500;
                        color: #1a1d24;
                    }

                    .btn-small {
                        background: #e0ddd8;
                        color: #1a1d24;
                        padding: 0.25rem 0.5rem;
                        border: none;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        cursor: pointer;
                    }

                    .help-text {
                        font-size: 0.8125rem;
                        color: #666;
                        font-style: italic;
                    }

                    .condition-row {
                        display: flex;
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;
                    }

                    .condition-row select,
                    .condition-row input {
                        padding: 0.5rem;
                        border: 1px solid #e0ddd8;
                        border-radius: 4px;
                        font-size: 0.8125rem;
                    }

                    .condition-row select:first-child {
                        flex: 2;
                    }

                    .condition-row select:nth-child(2) {
                        flex: 1;
                    }

                    .condition-row input {
                        flex: 1;
                    }

                    .remove-btn {
                        background: #f8d7da;
                        color: #721c24;
                        border: none;
                        border-radius: 4px;
                        width: 32px;
                        cursor: pointer;
                        font-size: 1.25rem;
                    }

                    .modal-footer {
                        padding: 1rem 1.5rem;
                        border-top: 1px solid #e0ddd8;
                        display: flex;
                        justify-content: flex-end;
                        gap: 0.75rem;
                    }

                    .btn-primary {
                        background: #c94a4a;
                        color: white;
                        padding: 0.625rem 1.25rem;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }

                    .btn-primary:disabled {
                        background: #d0cdc8;
                    }

                    .btn-secondary {
                        background: #e0ddd8;
                        color: #1a1d24;
                        padding: 0.625rem 1.25rem;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                `}</style>
            </div>
        </div>
    );
}
