// Survey Responses Management Page
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface SurveyResponse {
    id: string;
    survey_id: string;
    participant_id?: string;
    session_id?: string;
    status: 'incomplete' | 'complete' | 'screened_out';
    started_at: string;
    completed_at?: string;
    metadata: {
        ip_address?: string;
        user_agent?: string;
        referrer?: string;
        device_type?: string;
    };
    response_data: ResponseData[];
}

interface ResponseData {
    id: string;
    response_id: string;
    question_id: string;
    subquestion_id?: string;
    value: string;
}

interface Question {
    id: string;
    code: string;
    question_text: string;
    question_type: string;
    answer_options: { code: string; label: string }[];
}

interface Survey {
    id: string;
    title: string;
    question_groups: {
        questions: Question[];
    }[];
}

interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export default function ResponsesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const surveyId = resolvedParams.id;

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete' | 'screened_out'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedValues, setEditedValues] = useState<Map<string, string>>(new Map());
    const [saving, setSaving] = useState(false);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch survey on mount
    useEffect(() => {
        fetchSurvey();
    }, [surveyId]);

    // Fetch responses when filters or pagination change
    useEffect(() => {
        fetchResponses();
    }, [surveyId, filter, debouncedSearch, pagination.page]);

    async function fetchSurvey() {
        try {
            const res = await fetch(`/api/survey/surveys/${surveyId}`);
            if (!res.ok) throw new Error('Failed to fetch survey');
            const data = await res.json();
            setSurvey(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    }

    async function fetchResponses() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (filter !== 'all') {
                params.set('status', filter);
            }
            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            }

            const res = await fetch(`/api/survey/responses/${surveyId}?${params}`);
            if (!res.ok) throw new Error('Failed to fetch responses');

            const data = await res.json();
            setResponses(data.responses || []);
            if (data.pagination) {
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    function goToPage(page: number) {
        setPagination(prev => ({ ...prev, page }));
    }

    async function handleDeleteResponse(responseId: string) {
        try {
            const res = await fetch(`/api/survey/response/${responseId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete response');
            }

            setResponses(prev => prev.filter(r => r.id !== responseId));
            setDeleteConfirm(null);
            if (selectedResponse?.id === responseId) {
                setSelectedResponse(null);
            }
        } catch (err) {
            alert('Failed to delete response');
        }
    }

    function startEditing() {
        if (!selectedResponse) return;
        // Pre-populate edited values with current values
        const initialValues = new Map<string, string>();
        selectedResponse.response_data?.forEach(rd => {
            const key = rd.subquestion_id ? `${rd.question_id}_${rd.subquestion_id}` : rd.question_id;
            initialValues.set(key, rd.value);
        });
        setEditedValues(initialValues);
        setEditMode(true);
    }

    function cancelEditing() {
        setEditMode(false);
        setEditedValues(new Map());
    }

    async function saveEdits() {
        if (!selectedResponse) return;

        try {
            setSaving(true);

            // Convert edited values to array of updates
            const updates: { question_id: string; subquestion_id?: string; value: string }[] = [];
            editedValues.forEach((value, key) => {
                // Use last underscore as separator (question codes may contain underscores)
                // Format is "questionId" or "questionId_subquestionId"
                const lastUnderscoreIndex = key.lastIndexOf('_');

                // Check if this might be a subquestion key (has underscore and looks like a subquestion pattern)
                // We assume subquestion IDs are typically short codes like SQ1, SQ001, A1, etc.
                if (lastUnderscoreIndex > 0) {
                    const possibleSqid = key.substring(lastUnderscoreIndex + 1);
                    // If the part after underscore looks like a subquestion code (short alphanumeric)
                    if (possibleSqid.length <= 10 && /^[A-Za-z0-9]+$/.test(possibleSqid)) {
                        const qid = key.substring(0, lastUnderscoreIndex);
                        updates.push({ question_id: qid, subquestion_id: possibleSqid, value });
                    } else {
                        // It's likely part of the question code itself
                        updates.push({ question_id: key, value });
                    }
                } else {
                    updates.push({ question_id: key, value });
                }
            });

            const res = await fetch(`/api/survey/response/${selectedResponse.id}/edit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!res.ok) {
                throw new Error('Failed to save changes');
            }

            // Update local state with new values
            const updatedResponseData = selectedResponse.response_data?.map(rd => {
                const key = rd.subquestion_id ? `${rd.question_id}_${rd.subquestion_id}` : rd.question_id;
                if (editedValues.has(key)) {
                    return { ...rd, value: editedValues.get(key)! };
                }
                return rd;
            }) || [];

            // Also add any new values that weren't in original response_data
            editedValues.forEach((value, key) => {
                const exists = updatedResponseData.some(rd => {
                    const rdKey = rd.subquestion_id ? `${rd.question_id}_${rd.subquestion_id}` : rd.question_id;
                    return rdKey === key;
                });
                if (!exists && value) {
                    // Use lastIndexOf to handle question codes with underscores
                    const lastUnderscoreIndex = key.lastIndexOf('_');
                    if (lastUnderscoreIndex > 0) {
                        const possibleSqid = key.substring(lastUnderscoreIndex + 1);
                        // Check if it looks like a subquestion ID (short alphanumeric)
                        if (possibleSqid.length <= 10 && /^[A-Za-z0-9]+$/.test(possibleSqid)) {
                            updatedResponseData.push({
                                id: `new_${key}`,
                                response_id: selectedResponse.id,
                                question_id: key.substring(0, lastUnderscoreIndex),
                                subquestion_id: possibleSqid,
                                value,
                            });
                        } else {
                            updatedResponseData.push({
                                id: `new_${key}`,
                                response_id: selectedResponse.id,
                                question_id: key,
                                value,
                            });
                        }
                    } else {
                        updatedResponseData.push({
                            id: `new_${key}`,
                            response_id: selectedResponse.id,
                            question_id: key,
                            value,
                        });
                    }
                }
            });

            setSelectedResponse({
                ...selectedResponse,
                response_data: updatedResponseData,
            });

            // Update in responses list too
            setResponses(prev => prev.map(r =>
                r.id === selectedResponse.id
                    ? { ...r, response_data: updatedResponseData }
                    : r
            ));

            setEditMode(false);
            setEditedValues(new Map());
        } catch (err) {
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    }

    function handleValueChange(questionId: string, value: string, subquestionId?: string) {
        const key = subquestionId ? `${questionId}_${subquestionId}` : questionId;
        setEditedValues(prev => {
            const newMap = new Map(prev);
            newMap.set(key, value);
            return newMap;
        });
    }

    // Get all questions as a flat list
    const allQuestions = survey?.question_groups
        .flatMap(g => g.questions) || [];

    // Handle filter change - reset to page 1
    function handleFilterChange(newFilter: 'all' | 'complete' | 'incomplete' | 'screened_out') {
        setFilter(newFilter);
        setPagination(prev => ({ ...prev, page: 1 }));
    }

    // Get answer display value
    function getAnswerDisplay(question: Question, value: string): string {
        if (!value) return '-';

        // Check if it's a multiple choice with answer options
        if (question.answer_options?.length > 0) {
            // Try to parse as JSON array (multiple choice multiple)
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map(v => {
                        const opt = question.answer_options.find(o => o.code === v);
                        return opt?.label || v;
                    }).join(', ');
                }
            } catch {
                // Not an array, check single value
                const opt = question.answer_options.find(o => o.code === value);
                if (opt) return opt.label;
            }
        }

        // Yes/No questions
        if (question.question_type === 'yes_no') {
            return value === 'Y' ? 'Yes' : value === 'N' ? 'No' : value;
        }

        return value;
    }

    if (loading) {
        return (
            <div className="responses-page">
                <div className="loading">Loading responses...</div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="responses-page">
                <div className="error">Error: {error}</div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    return (
        <div className="responses-page">
            <div className="page-header">
                <div className="header-left">
                    <div className="nav-links">
                        <Link href={`/admin/surveys/${surveyId}`} className="back-link">
                            ← Back to Survey
                        </Link>
                        <Link href={`/admin/surveys/${surveyId}/text-analysis`} className="nav-link">
                            Text Analysis
                        </Link>
                    </div>
                    <h1>Responses: {survey?.title}</h1>
                </div>
                <div className="header-stats">
                    <span className="stat">
                        <strong>{pagination.totalCount}</strong> total
                    </span>
                    <span className="stat complete">
                        <strong>{responses.filter(r => r.status === 'complete').length}</strong> on page
                    </span>
                    {loading && <span className="stat">Loading...</span>}
                </div>
            </div>

            <div className="controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by ID, participant, or IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    {(['all', 'complete', 'incomplete', 'screened_out'] as const).map(f => (
                        <button
                            key={f}
                            className={`filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => handleFilterChange(f)}
                        >
                            {f === 'all' ? 'All' : f === 'screened_out' ? 'Screened Out' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="content-area">
                <div className="responses-list">
                    {responses.length === 0 ? (
                        <div className="empty-state">
                            <p>No responses found</p>
                        </div>
                    ) : (
                        <>
                        <table className="responses-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Status</th>
                                    <th>Started</th>
                                    <th>Completed</th>
                                    <th>IP</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {responses.map(response => (
                                    <tr
                                        key={response.id}
                                        className={selectedResponse?.id === response.id ? 'selected' : ''}
                                        onClick={() => setSelectedResponse(response)}
                                    >
                                        <td className="id-cell">
                                            <code>{response.id.slice(0, 8)}...</code>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${response.status}`}>
                                                {response.status}
                                            </span>
                                        </td>
                                        <td>{new Date(response.started_at).toLocaleString()}</td>
                                        <td>
                                            {response.completed_at
                                                ? new Date(response.completed_at).toLocaleString()
                                                : '-'}
                                        </td>
                                        <td>{response.metadata?.ip_address || '-'}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="view-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedResponse(response);
                                                }}
                                            >
                                                View
                                            </button>
                                            {deleteConfirm === response.id ? (
                                                <>
                                                    <button
                                                        className="confirm-delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteResponse(response.id);
                                                        }}
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirm(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm(response.id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination-controls">
                                <div className="pagination-info">
                                    Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} responses
                                </div>
                                <div className="pagination-buttons">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => goToPage(1)}
                                        disabled={!pagination.hasPreviousPage}
                                    >
                                        ««
                                    </button>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => goToPage(pagination.page - 1)}
                                        disabled={!pagination.hasPreviousPage}
                                    >
                                        «
                                    </button>
                                    <span className="pagination-current">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => goToPage(pagination.page + 1)}
                                        disabled={!pagination.hasNextPage}
                                    >
                                        »
                                    </button>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => goToPage(pagination.totalPages)}
                                        disabled={!pagination.hasNextPage}
                                    >
                                        »»
                                    </button>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>

                {selectedResponse && (
                    <div className="response-detail">
                        <div className="detail-header">
                            <h2>Response Details</h2>
                            <div className="detail-header-actions">
                                {editMode ? (
                                    <>
                                        <button
                                            className="save-btn"
                                            onClick={saveEdits}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            className="cancel-edit-btn"
                                            onClick={cancelEditing}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="edit-btn"
                                        onClick={startEditing}
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    className="close-btn"
                                    onClick={() => {
                                        setSelectedResponse(null);
                                        setEditMode(false);
                                        setEditedValues(new Map());
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="detail-meta">
                            <div className="meta-row">
                                <span className="meta-label">Response ID:</span>
                                <code>{selectedResponse.id}</code>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Status:</span>
                                <span className={`status-badge ${selectedResponse.status}`}>
                                    {selectedResponse.status}
                                </span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Started:</span>
                                <span>{new Date(selectedResponse.started_at).toLocaleString()}</span>
                            </div>
                            {selectedResponse.completed_at && (
                                <div className="meta-row">
                                    <span className="meta-label">Completed:</span>
                                    <span>{new Date(selectedResponse.completed_at).toLocaleString()}</span>
                                </div>
                            )}
                            {selectedResponse.participant_id && (
                                <div className="meta-row">
                                    <span className="meta-label">Participant:</span>
                                    <span>{selectedResponse.participant_id}</span>
                                </div>
                            )}
                            {selectedResponse.metadata?.ip_address && (
                                <div className="meta-row">
                                    <span className="meta-label">IP Address:</span>
                                    <span>{selectedResponse.metadata.ip_address}</span>
                                </div>
                            )}
                            {selectedResponse.metadata?.device_type && (
                                <div className="meta-row">
                                    <span className="meta-label">Device:</span>
                                    <span>{selectedResponse.metadata.device_type}</span>
                                </div>
                            )}
                        </div>

                        <div className="detail-answers">
                            <h3>Answers {editMode && <span className="edit-badge">Editing</span>}</h3>
                            {allQuestions.map(question => {
                                const responseDataItem = selectedResponse.response_data?.find(
                                    rd => rd.question_id === question.id && !rd.subquestion_id
                                );
                                const currentValue = editMode
                                    ? (editedValues.get(question.id) ?? responseDataItem?.value ?? '')
                                    : responseDataItem?.value;

                                return (
                                    <div key={question.id} className="answer-row">
                                        <div className="question-info">
                                            <code className="question-code">{question.code}</code>
                                            <span className="question-text">{question.question_text}</span>
                                        </div>
                                        <div className="answer-value">
                                            {editMode ? (
                                                question.answer_options?.length > 0 ? (
                                                    <select
                                                        value={currentValue || ''}
                                                        onChange={(e) => handleValueChange(question.id, e.target.value)}
                                                        className="edit-select"
                                                    >
                                                        <option value="">-- No answer --</option>
                                                        {question.answer_options.map(opt => (
                                                            <option key={opt.code} value={opt.code}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : question.question_type === 'yes_no' ? (
                                                    <select
                                                        value={currentValue || ''}
                                                        onChange={(e) => handleValueChange(question.id, e.target.value)}
                                                        className="edit-select"
                                                    >
                                                        <option value="">-- No answer --</option>
                                                        <option value="Y">Yes</option>
                                                        <option value="N">No</option>
                                                    </select>
                                                ) : question.question_type === 'long_text' ? (
                                                    <textarea
                                                        value={currentValue || ''}
                                                        onChange={(e) => handleValueChange(question.id, e.target.value)}
                                                        className="edit-textarea"
                                                        rows={3}
                                                    />
                                                ) : (
                                                    <input
                                                        type={question.question_type === 'numerical' ? 'number' : 'text'}
                                                        value={currentValue || ''}
                                                        onChange={(e) => handleValueChange(question.id, e.target.value)}
                                                        className="edit-input"
                                                    />
                                                )
                                            ) : (
                                                currentValue
                                                    ? getAnswerDisplay(question, currentValue)
                                                    : <span className="no-answer">No answer</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{styles}</style>
        </div>
    );
}

const styles = `
    .responses-page {
        padding: 2rem;
        background: #f5f3ef;
        min-height: 100vh;
    }

    .loading, .error {
        padding: 4rem;
        text-align: center;
        color: #666;
    }

    .error {
        color: #c94a4a;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .back-link {
        color: #666;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.15s;
    }

    .back-link:hover {
        color: #c94a4a;
    }

    .nav-links {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .nav-link {
        color: #666;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.15s;
        padding: 0.375rem 0.75rem;
        background: #f5f3ef;
        border-radius: 4px;
    }

    .nav-link:hover {
        color: #c94a4a;
        background: #efe9e2;
    }

    .page-header h1 {
        font-size: 1.5rem;
        color: #1a1d24;
        font-weight: 600;
        margin: 0;
    }

    .header-stats {
        display: flex;
        gap: 1rem;
    }

    .stat {
        background: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #666;
    }

    .stat strong {
        color: #1a1d24;
    }

    .stat.complete strong {
        color: #059669;
    }

    .stat.incomplete strong {
        color: #d97706;
    }

    .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .search-box input {
        padding: 0.625rem 1rem;
        border: 1px solid #e0ddd8;
        border-radius: 4px;
        font-size: 0.875rem;
        width: 300px;
        background: white;
    }

    .search-box input:focus {
        outline: none;
        border-color: #c94a4a;
    }

    .filter-tabs {
        display: flex;
        gap: 0.25rem;
        background: white;
        padding: 0.25rem;
        border-radius: 4px;
    }

    .filter-tab {
        padding: 0.5rem 1rem;
        border: none;
        background: transparent;
        color: #666;
        font-size: 0.875rem;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.15s;
    }

    .filter-tab:hover {
        background: #f5f3ef;
    }

    .filter-tab.active {
        background: #c94a4a;
        color: white;
    }

    .content-area {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 1.5rem;
    }

    @media (max-width: 1200px) {
        .content-area {
            grid-template-columns: 1fr;
        }
    }

    .responses-list {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .empty-state {
        padding: 4rem;
        text-align: center;
        color: #666;
    }

    .responses-table {
        width: 100%;
        border-collapse: collapse;
    }

    .responses-table th,
    .responses-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e0ddd8;
    }

    .responses-table th {
        background: #f5f3ef;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #666;
        font-weight: 600;
    }

    .responses-table tbody tr {
        cursor: pointer;
        transition: background 0.15s;
    }

    .responses-table tbody tr:hover {
        background: #fafaf8;
    }

    .responses-table tbody tr.selected {
        background: #fff5f5;
    }

    .id-cell code {
        background: #f5f3ef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }

    .status-badge.complete {
        background: #d1fae5;
        color: #059669;
    }

    .status-badge.incomplete {
        background: #fef3c7;
        color: #d97706;
    }

    .status-badge.screened_out {
        background: #fee2e2;
        color: #dc2626;
    }

    .actions-cell {
        display: flex;
        gap: 0.5rem;
    }

    .view-btn, .delete-btn, .confirm-delete-btn, .cancel-btn {
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.15s;
    }

    .view-btn {
        background: #e0ddd8;
        color: #1a1d24;
    }

    .view-btn:hover {
        background: #d0cdc8;
    }

    .delete-btn {
        background: transparent;
        color: #dc2626;
        border: 1px solid #dc2626;
    }

    .delete-btn:hover {
        background: #fee2e2;
    }

    .confirm-delete-btn {
        background: #dc2626;
        color: white;
    }

    .cancel-btn {
        background: #e0ddd8;
        color: #1a1d24;
    }

    .response-detail {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        position: sticky;
        top: 1rem;
    }

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e0ddd8;
    }

    .detail-header h2 {
        font-size: 1.125rem;
        color: #1a1d24;
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .close-btn:hover {
        color: #1a1d24;
    }

    .detail-meta {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e0ddd8;
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        padding: 0.375rem 0;
        font-size: 0.875rem;
    }

    .meta-label {
        color: #666;
    }

    .meta-row code {
        background: #f5f3ef;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-size: 0.75rem;
    }

    .detail-answers {
        padding: 1rem 1.5rem;
    }

    .detail-answers h3 {
        font-size: 0.875rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 1rem;
    }

    .answer-row {
        padding: 0.75rem 0;
        border-bottom: 1px solid #f5f3ef;
    }

    .answer-row:last-child {
        border-bottom: none;
    }

    .question-info {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        margin-bottom: 0.375rem;
    }

    .question-code {
        background: #f5f3ef;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-size: 0.625rem;
        flex-shrink: 0;
    }

    .question-text {
        font-size: 0.8125rem;
        color: #1a1d24;
        line-height: 1.4;
    }

    .answer-value {
        font-size: 0.875rem;
        color: #1a1d24;
        font-weight: 500;
        padding-left: 2.5rem;
    }

    .no-answer {
        color: #999;
        font-style: italic;
        font-weight: normal;
    }

    .detail-header-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .edit-btn {
        padding: 0.375rem 0.75rem;
        background: #e0ddd8;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        color: #1a1d24;
        transition: background 0.15s;
    }

    .edit-btn:hover {
        background: #d0cdc8;
    }

    .save-btn {
        padding: 0.375rem 0.75rem;
        background: #c94a4a;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: background 0.15s;
    }

    .save-btn:hover {
        background: #b43939;
    }

    .save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cancel-edit-btn {
        padding: 0.375rem 0.75rem;
        background: #e0ddd8;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        color: #1a1d24;
        transition: background 0.15s;
    }

    .cancel-edit-btn:hover {
        background: #d0cdc8;
    }

    .edit-badge {
        background: #c94a4a;
        color: white;
        font-size: 0.625rem;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        margin-left: 0.5rem;
        text-transform: none;
        letter-spacing: normal;
    }

    .edit-input, .edit-select, .edit-textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e0ddd8;
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: inherit;
    }

    .edit-input:focus, .edit-select:focus, .edit-textarea:focus {
        outline: none;
        border-color: #c94a4a;
    }

    .edit-textarea {
        resize: vertical;
        min-height: 60px;
    }

    .pagination-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-top: 1px solid #e0ddd8;
        background: #fafaf8;
    }

    .pagination-info {
        font-size: 0.875rem;
        color: #666;
    }

    .pagination-buttons {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .pagination-btn {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e0ddd8;
        background: white;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        color: #1a1d24;
        transition: all 0.15s;
    }

    .pagination-btn:hover:not(:disabled) {
        background: #f5f3ef;
        border-color: #c94a4a;
    }

    .pagination-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .pagination-current {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        color: #1a1d24;
        font-weight: 500;
    }
`;
