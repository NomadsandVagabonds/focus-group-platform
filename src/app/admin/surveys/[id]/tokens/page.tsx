// Token Management UI for Survey
'use client';

import { useState, useEffect, use } from 'react';

interface SurveyToken {
    id: string;
    survey_id: string;
    token: string;
    email?: string;
    name?: string;
    status: 'unused' | 'used' | 'expired';
    uses_remaining: number;
    expires_at?: string;
    metadata?: Record<string, any>;
    created_at: string;
    used_at?: string;
}

interface TokensPageProps {
    params: Promise<{ id: string }>;
}

export default function TokensPage({ params }: TokensPageProps) {
    const { id: surveyId } = use(params);
    const [tokens, setTokens] = useState<SurveyToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

    // Generate modal state
    const [generateCount, setGenerateCount] = useState(10);
    const [generateEmails, setGenerateEmails] = useState('');
    const [tokenLength, setTokenLength] = useState(8);
    const [usesPerToken, setUsesPerToken] = useState(1);
    const [expiresInDays, setExpiresInDays] = useState<number | null>(null);

    // Email modal state
    const [emailType, setEmailType] = useState<'invitation' | 'reminder'>('invitation');
    const [customSubject, setCustomSubject] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTokens();
    }, [surveyId, statusFilter, pagination.page]);

    async function fetchTokens() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                surveyId,
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/api/survey/tokens?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch tokens');
            }

            setTokens(data.tokens);
            setPagination(prev => ({
                ...prev,
                total: data.total,
                totalPages: data.totalPages,
            }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateTokens() {
        try {
            const emails = generateEmails
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    const parts = line.split(',').map(p => p.trim());
                    return parts.length > 1
                        ? { email: parts[0], name: parts[1] }
                        : { email: parts[0] };
                });

            const response = await fetch('/api/survey/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId,
                    count: emails.length > 0 ? emails.length : generateCount,
                    emails: emails.length > 0 ? emails : [],
                    tokenLength,
                    usesPerToken,
                    expiresIn: expiresInDays,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate tokens');
            }

            setShowGenerateModal(false);
            setGenerateEmails('');
            fetchTokens();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function handleDeleteTokens(tokenIds: string[]) {
        if (!confirm(`Delete ${tokenIds.length} token(s)?`)) return;

        try {
            const response = await fetch('/api/survey/tokens', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId,
                    tokenIds,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete tokens');
            }

            setSelectedTokens(new Set());
            fetchTokens();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function handleSendEmails() {
        try {
            setSending(true);
            const tokenIds = selectedTokens.size > 0
                ? Array.from(selectedTokens)
                : undefined;

            const response = await fetch('/api/survey/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId,
                    type: emailType,
                    tokenIds,
                    customSubject: customSubject || undefined,
                    customMessage: customMessage || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send emails');
            }

            alert(`Sent: ${data.results.sent}, Failed: ${data.results.failed}`);
            setShowEmailModal(false);
            setSelectedTokens(new Set());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    function toggleTokenSelection(tokenId: string) {
        const newSelection = new Set(selectedTokens);
        if (newSelection.has(tokenId)) {
            newSelection.delete(tokenId);
        } else {
            newSelection.add(tokenId);
        }
        setSelectedTokens(newSelection);
    }

    function toggleAllTokens() {
        if (selectedTokens.size === tokens.length) {
            setSelectedTokens(new Set());
        } else {
            setSelectedTokens(new Set(tokens.map(t => t.id)));
        }
    }

    function copyTokensToClipboard() {
        const selected = tokens.filter(t => selectedTokens.has(t.id));
        const text = selected.map(t => {
            const parts = [t.token];
            if (t.email) parts.push(t.email);
            if (t.name) parts.push(t.name);
            return parts.join('\t');
        }).join('\n');
        navigator.clipboard.writeText(text);
    }

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'unused': return 'status-unused';
            case 'used': return 'status-used';
            case 'expired': return 'status-expired';
            default: return '';
        }
    }

    if (loading && tokens.length === 0) {
        return <div className="loading">Loading tokens...</div>;
    }

    return (
        <div className="tokens-page">
            <header className="page-header">
                <h1>Access Tokens</h1>
                <p className="subtitle">Manage survey access tokens and send invitations</p>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            <div className="toolbar">
                <div className="toolbar-left">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Statuses</option>
                        <option value="unused">Unused</option>
                        <option value="used">Used</option>
                        <option value="expired">Expired</option>
                    </select>
                    <span className="token-count">{pagination.total} tokens</span>
                </div>
                <div className="toolbar-right">
                    {selectedTokens.size > 0 && (
                        <>
                            <button
                                className="btn-secondary"
                                onClick={copyTokensToClipboard}
                            >
                                Copy ({selectedTokens.size})
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowEmailModal(true)}
                            >
                                Email ({selectedTokens.size})
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => handleDeleteTokens(Array.from(selectedTokens))}
                            >
                                Delete ({selectedTokens.size})
                            </button>
                        </>
                    )}
                    <button
                        className="btn-primary"
                        onClick={() => setShowGenerateModal(true)}
                    >
                        Generate Tokens
                    </button>
                </div>
            </div>

            <div className="tokens-table-wrapper">
                <table className="tokens-table">
                    <thead>
                        <tr>
                            <th className="checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={selectedTokens.size === tokens.length && tokens.length > 0}
                                    onChange={toggleAllTokens}
                                />
                            </th>
                            <th>Token</th>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Uses Left</th>
                            <th>Expires</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tokens.map(token => (
                            <tr key={token.id} className={selectedTokens.has(token.id) ? 'selected' : ''}>
                                <td className="checkbox-col">
                                    <input
                                        type="checkbox"
                                        checked={selectedTokens.has(token.id)}
                                        onChange={() => toggleTokenSelection(token.id)}
                                    />
                                </td>
                                <td className="token-code">{token.token}</td>
                                <td>{token.email || '-'}</td>
                                <td>{token.name || '-'}</td>
                                <td>
                                    <span className={`status-badge ${getStatusBadgeClass(token.status)}`}>
                                        {token.status}
                                    </span>
                                </td>
                                <td>{token.uses_remaining}</td>
                                <td>
                                    {token.expires_at
                                        ? new Date(token.expires_at).toLocaleDateString()
                                        : 'Never'}
                                </td>
                                <td>{new Date(token.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {tokens.length === 0 && (
                            <tr>
                                <td colSpan={8} className="empty-state">
                                    No tokens found. Generate some to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Generate Tokens Modal */}
            {showGenerateModal && (
                <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Generate Tokens</h2>

                        <div className="form-group">
                            <label>Email List (optional)</label>
                            <textarea
                                value={generateEmails}
                                onChange={(e) => setGenerateEmails(e.target.value)}
                                placeholder="email@example.com, John Doe&#10;another@example.com, Jane Smith"
                                rows={5}
                            />
                            <small>One per line. Format: email, name (name is optional)</small>
                        </div>

                        {generateEmails.trim() === '' && (
                            <div className="form-group">
                                <label>Number of Anonymous Tokens</label>
                                <input
                                    type="number"
                                    value={generateCount}
                                    onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={1000}
                                />
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Token Length</label>
                                <input
                                    type="number"
                                    value={tokenLength}
                                    onChange={(e) => setTokenLength(parseInt(e.target.value) || 8)}
                                    min={4}
                                    max={32}
                                />
                            </div>
                            <div className="form-group">
                                <label>Uses Per Token</label>
                                <input
                                    type="number"
                                    value={usesPerToken}
                                    onChange={(e) => setUsesPerToken(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={100}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Expires In (days)</label>
                            <input
                                type="number"
                                value={expiresInDays ?? ''}
                                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Never expires"
                                min={1}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowGenerateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleGenerateTokens}>
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Email Modal */}
            {showEmailModal && (
                <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Send Emails</h2>

                        <div className="form-group">
                            <label>Email Type</label>
                            <select
                                value={emailType}
                                onChange={(e) => setEmailType(e.target.value as 'invitation' | 'reminder')}
                            >
                                <option value="invitation">Invitation</option>
                                <option value="reminder">Reminder</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Custom Subject (optional)</label>
                            <input
                                type="text"
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                placeholder="Leave empty for default"
                            />
                        </div>

                        <div className="form-group">
                            <label>Custom Message (optional)</label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Additional message to include in the email"
                                rows={4}
                            />
                        </div>

                        <p className="email-info">
                            {selectedTokens.size > 0
                                ? `Sending to ${selectedTokens.size} selected token(s)`
                                : 'Sending to all eligible tokens with emails'}
                        </p>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowEmailModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSendEmails}
                                disabled={sending}
                            >
                                {sending ? 'Sending...' : 'Send Emails'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .tokens-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-family: 'EB Garamond', Georgia, serif;
                    font-size: 2rem;
                    font-weight: 500;
                    color: #1a1d24;
                    margin: 0 0 0.5rem 0;
                }

                .subtitle {
                    color: #666;
                    margin: 0;
                }

                .error-banner {
                    background: #fef2f2;
                    border: 1px solid #c94a4a;
                    color: #c94a4a;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .error-banner button {
                    background: none;
                    border: none;
                    color: #c94a4a;
                    cursor: pointer;
                    text-decoration: underline;
                }

                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .toolbar-left, .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .filter-select {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.875rem;
                }

                .token-count {
                    color: #666;
                    font-size: 0.875rem;
                }

                .btn-primary, .btn-secondary, .btn-danger {
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: #c94a4a;
                    color: white;
                }

                .btn-primary:hover {
                    background: #b43939;
                }

                .btn-secondary {
                    background: #f5f3ef;
                    color: #1a1d24;
                    border: 1px solid #e0ddd8;
                }

                .btn-secondary:hover {
                    background: #e8e5df;
                }

                .btn-danger {
                    background: #dc2626;
                    color: white;
                }

                .btn-danger:hover {
                    background: #b91c1c;
                }

                .tokens-table-wrapper {
                    overflow-x: auto;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                }

                .tokens-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .tokens-table th, .tokens-table td {
                    padding: 0.75rem 1rem;
                    text-align: left;
                    border-bottom: 1px solid #e0ddd8;
                }

                .tokens-table th {
                    background: #f5f3ef;
                    font-weight: 600;
                    color: #1a1d24;
                }

                .tokens-table tr:hover {
                    background: #fafaf9;
                }

                .tokens-table tr.selected {
                    background: #fef3f3;
                }

                .checkbox-col {
                    width: 40px;
                    text-align: center;
                }

                .token-code {
                    font-family: 'SF Mono', Monaco, monospace;
                    font-weight: 600;
                    color: #c94a4a;
                }

                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .status-unused {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-used {
                    background: #e0e7ff;
                    color: #3730a3;
                }

                .status-expired {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .empty-state {
                    text-align: center;
                    color: #666;
                    padding: 3rem 1rem;
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .pagination button {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                }

                .pagination button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .modal-overlay {
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

                .modal {
                    background: white;
                    border-radius: 8px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal h2 {
                    font-family: 'EB Garamond', Georgia, serif;
                    font-size: 1.5rem;
                    margin: 0 0 1.5rem 0;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: #1a1d24;
                }

                .form-group input, .form-group textarea, .form-group select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .form-group small {
                    display: block;
                    margin-top: 0.25rem;
                    color: #666;
                    font-size: 0.75rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .email-info {
                    background: #f5f3ef;
                    padding: 0.75rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    color: #666;
                    margin-bottom: 1rem;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1.5rem;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
}
