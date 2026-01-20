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
                &larr; Back to Surveys
            </Link>

            <div className="page-header">
                <h1>Create New Survey</h1>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>Basic Information</h2>

                        <div className="field">
                            <label htmlFor="title">Title *</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter survey title"
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
                                placeholder="Enter a description for your survey (optional)"
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Settings</h2>

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
                            <small>
                                How questions are presented to participants
                            </small>
                        </div>

                        <div className="field">
                            <label htmlFor="theme">Theme</label>
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
                            <small>
                                Visual style of the survey
                            </small>
                        </div>

                        <div className="field checkbox-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.show_progress_bar ?? true}
                                    onChange={(e) =>
                                        handleSettingChange('show_progress_bar', e.target.checked)
                                    }
                                />
                                <span>Show Progress Bar</span>
                            </label>
                            <small>
                                Display progress indicator to participants
                            </small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading || !title.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create Survey'}
                        </button>
                        <Link href="/admin/surveys" className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .admin-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: #f5f3ef;
                    min-height: 100vh;
                }

                .back-link {
                    display: inline-block;
                    color: #c94a4a;
                    text-decoration: none;
                    margin-bottom: 1.5rem;
                    font-size: 0.875rem;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #b03a3a;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    color: #1a1d24;
                    font-family: 'Libre Baskerville', serif;
                    margin: 0;
                }

                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1.5rem;
                }

                .form-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .form-section {
                    margin-bottom: 2rem;
                }

                .form-section:last-of-type {
                    margin-bottom: 0;
                }

                .form-section h2 {
                    font-size: 1.25rem;
                    color: #1a1d24;
                    margin: 0 0 1.5rem 0;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #e0ddd8;
                }

                .field {
                    margin-bottom: 1.5rem;
                }

                .field label {
                    display: block;
                    font-weight: 500;
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                    font-size: 0.9375rem;
                }

                .field input[type="text"],
                .field textarea,
                .field select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d0cdc8;
                    border-radius: 4px;
                    font-size: 1rem;
                    color: #1a1d24;
                    background: white;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .field input[type="text"]:focus,
                .field textarea:focus,
                .field select:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.1);
                }

                .field textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .field select {
                    cursor: pointer;
                }

                .field small {
                    display: block;
                    color: #718096;
                    font-size: 0.8125rem;
                    margin-top: 0.375rem;
                }

                .checkbox-field label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .checkbox-field input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    accent-color: #c94a4a;
                    cursor: pointer;
                }

                .checkbox-field span {
                    font-weight: 500;
                    color: #1a1d24;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e0ddd8;
                }

                .btn-primary {
                    background: #c94a4a;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #b03a3a;
                }

                .btn-primary:disabled {
                    background: #d0cdc8;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: #e0ddd8;
                    color: #1a1d24;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    text-decoration: none;
                    transition: background 0.2s;
                    display: inline-flex;
                    align-items: center;
                }

                .btn-secondary:hover {
                    background: #d0cdc8;
                }
            `}</style>
        </div>
    );
}
