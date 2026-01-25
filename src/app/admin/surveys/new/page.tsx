'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SurveySettings } from '@/lib/supabase/survey-types';

export default function NewSurveyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [settings, setSettings] = useState<SurveySettings>({
        format: 'group_by_group',
        theme: 'editorial_academic',
        show_progress_bar: true,
    });

    const handleSettingChange = <K extends keyof SurveySettings>(
        key: K,
        value: SurveySettings[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/survey/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    settings,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create survey');
            }

            const { survey } = await response.json();
            router.push(`/admin/surveys/${survey.id}`);
        } catch (err: any) {
            console.error('Error creating survey:', err);
            setError(err.message || 'Failed to create survey. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <Link href="/admin/surveys" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Surveys
            </Link>

            <div className="page-header">
                <h1>Create New Survey</h1>
                <p className="header-subtitle">Set up your survey details and preferences</p>
            </div>

            {error && (
                <div className="error-message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    {error}
                </div>
            )}

            <div className="form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                            <h2>Basic Information</h2>
                        </div>

                        <div className="field">
                            <label htmlFor="title">Survey Title <span className="required">*</span></label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Customer Satisfaction Survey 2026"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe the purpose of this survey (optional)"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                            </div>
                            <h2>Display Settings</h2>
                        </div>

                        <div className="field-grid">
                            <div className="field">
                                <label htmlFor="format">Survey Format</label>
                                <select
                                    id="format"
                                    value={settings.format}
                                    onChange={(e) =>
                                        handleSettingChange(
                                            'format',
                                            e.target.value as SurveySettings['format']
                                        )
                                    }
                                >
                                    <option value="question_by_question">Question by Question</option>
                                    <option value="group_by_group">Group by Group</option>
                                    <option value="all_in_one">All in One</option>
                                </select>
                                <small>How questions are presented to participants</small>
                            </div>

                            <div className="field">
                                <label htmlFor="theme">Visual Theme</label>
                                <select
                                    id="theme"
                                    value={settings.theme}
                                    onChange={(e) =>
                                        handleSettingChange(
                                            'theme',
                                            e.target.value as SurveySettings['theme']
                                        )
                                    }
                                >
                                    <option value="editorial_academic">Editorial Academic</option>
                                    <option value="modern">Modern</option>
                                    <option value="minimal">Minimal</option>
                                </select>
                                <small>Visual style of the survey</small>
                            </div>
                        </div>

                        <div className="field checkbox-field">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.show_progress_bar ?? true}
                                    onChange={(e) =>
                                        handleSettingChange('show_progress_bar', e.target.checked)
                                    }
                                />
                                <span className="checkbox-custom"></span>
                                <span className="checkbox-text">
                                    <strong>Show Progress Bar</strong>
                                    <small>Display completion progress to participants</small>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Link href="/admin/surveys" className="btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading || !title.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Create Survey
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .admin-container {
                    max-width: 720px;
                    margin: 0 auto;
                    padding: 2rem;
                    min-height: 100vh;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #666;
                    text-decoration: none;
                    margin-bottom: 2rem;
                    font-size: 0.9375rem;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #c94a4a;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    color: #1a1d24;
                    font-family: 'Libre Baskerville', serif;
                    margin: 0 0 0.5rem 0;
                    font-weight: 600;
                }

                .header-subtitle {
                    color: #666;
                    margin: 0;
                    font-size: 1rem;
                }

                .error-message {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: #fef2f2;
                    color: #991b1b;
                    padding: 1rem 1.25rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    border: 1px solid #fecaca;
                }

                .form-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04);
                    border: 1px solid rgba(0, 0, 0, 0.04);
                }

                .form-section {
                    margin-bottom: 2.5rem;
                }

                .form-section:last-of-type {
                    margin-bottom: 0;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #e0ddd8;
                }

                .section-icon {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #f8f7f5 0%, #f0eeea 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #c94a4a;
                }

                .form-section h2 {
                    font-size: 1.125rem;
                    color: #1a1d24;
                    margin: 0;
                    font-weight: 600;
                }

                .field {
                    margin-bottom: 1.5rem;
                }

                .field-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .field label {
                    display: block;
                    font-weight: 500;
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                    font-size: 0.9375rem;
                }

                .required {
                    color: #c94a4a;
                }

                .field input[type="text"],
                .field textarea,
                .field select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1.5px solid #e0ddd8;
                    border-radius: 8px;
                    font-size: 1rem;
                    color: #1a1d24;
                    background: #fafaf9;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .field input[type="text"]:focus,
                .field textarea:focus,
                .field select:focus {
                    outline: none;
                    border-color: #c94a4a;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.1);
                }

                .field input::placeholder,
                .field textarea::placeholder {
                    color: #aaa;
                }

                .field textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .field select {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.75rem center;
                    padding-right: 2.5rem;
                }

                .field small {
                    display: block;
                    color: #888;
                    font-size: 0.8125rem;
                    margin-top: 0.5rem;
                }

                .checkbox-field {
                    margin-top: 0.5rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 1rem;
                    background: #fafaf9;
                    border-radius: 8px;
                    border: 1.5px solid #e0ddd8;
                    transition: all 0.2s;
                }

                .checkbox-label:hover {
                    border-color: #c94a4a;
                    background: #faf9f8;
                }

                .checkbox-label input[type="checkbox"] {
                    position: absolute;
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .checkbox-custom {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #d0cdc8;
                    border-radius: 4px;
                    flex-shrink: 0;
                    margin-top: 2px;
                    transition: all 0.2s;
                    position: relative;
                }

                .checkbox-label input:checked + .checkbox-custom {
                    background: #c94a4a;
                    border-color: #c94a4a;
                }

                .checkbox-label input:checked + .checkbox-custom::after {
                    content: '';
                    position: absolute;
                    left: 6px;
                    top: 2px;
                    width: 5px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                .checkbox-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .checkbox-text strong {
                    color: #1a1d24;
                    font-weight: 500;
                }

                .checkbox-text small {
                    color: #888;
                    font-size: 0.8125rem;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 2.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e0ddd8;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, #c94a4a 0%, #a83232 100%);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(201, 74, 74, 0.25);
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(201, 74, 74, 0.35);
                }

                .btn-primary:disabled {
                    background: #d0cdc8;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    background: #f0eeea;
                    color: #1a1d24;
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 8px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .btn-secondary:hover {
                    background: #e0ddd8;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 640px) {
                    .field-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-actions {
                        flex-direction: column-reverse;
                    }

                    .btn-primary,
                    .btn-secondary {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
