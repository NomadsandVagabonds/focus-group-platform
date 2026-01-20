// Survey Settings Editor Component
'use client';

import { useState } from 'react';
import type { Survey, SurveySettings } from '@/lib/supabase/survey-types';

interface SurveySettingsProps {
    survey: Survey;
    onSave: (settings: SurveySettings) => void;
}

export default function SurveySettingsEditor({ survey, onSave }: SurveySettingsProps) {
    const [settings, setSettings] = useState<SurveySettings>(survey.settings || {});

    const handleSave = () => {
        onSave(settings);
    };

    const updateProlificIntegration = (updates: Partial<NonNullable<SurveySettings['prolific_integration']>>) => {
        setSettings({
            ...settings,
            prolific_integration: {
                enabled: settings.prolific_integration?.enabled || false,
                completion_code: settings.prolific_integration?.completion_code,
                screenout_code: settings.prolific_integration?.screenout_code,
                ...updates,
            },
        });
    };

    return (
        <div className="settings-container">
            <h2>Survey Settings</h2>

            <fieldset className="settings-section">
                <legend>Display Options</legend>

                <div className="form-group">
                    <label htmlFor="format">Survey Format</label>
                    <select
                        id="format"
                        value={settings.format || 'question_by_question'}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                format: e.target.value as SurveySettings['format'],
                            })
                        }
                    >
                        <option value="question_by_question">Question by Question</option>
                        <option value="group_by_group">Group by Group</option>
                        <option value="all_in_one">All in One</option>
                    </select>
                    <span className="help-text">
                        How questions are presented to respondents
                    </span>
                </div>

                <div className="form-group">
                    <label htmlFor="theme">Theme</label>
                    <select
                        id="theme"
                        value={settings.theme || 'editorial_academic'}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                theme: e.target.value as SurveySettings['theme'],
                            })
                        }
                    >
                        <option value="editorial_academic">Editorial Academic</option>
                        <option value="modern">Modern</option>
                        <option value="minimal">Minimal</option>
                    </select>
                    <span className="help-text">
                        Visual style of the survey
                    </span>
                </div>
            </fieldset>

            <fieldset className="settings-section">
                <legend>Navigation</legend>

                <div className="form-group checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.show_progress_bar ?? true}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    show_progress_bar: e.target.checked,
                                })
                            }
                        />
                        Show Progress Bar
                    </label>
                    <span className="help-text">
                        Display a progress indicator to respondents
                    </span>
                </div>

                <div className="form-group checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.allow_backward_navigation ?? true}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    allow_backward_navigation: e.target.checked,
                                })
                            }
                        />
                        Allow Backward Navigation
                    </label>
                    <span className="help-text">
                        Allow respondents to go back to previous questions
                    </span>
                </div>
            </fieldset>

            <fieldset className="settings-section">
                <legend>Prolific Integration</legend>

                <div className="form-group checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.prolific_integration?.enabled || false}
                            onChange={(e) =>
                                updateProlificIntegration({ enabled: e.target.checked })
                            }
                        />
                        Enable Prolific Integration
                    </label>
                    <span className="help-text">
                        Configure completion and screenout codes for Prolific participants
                    </span>
                </div>

                {settings.prolific_integration?.enabled && (
                    <div className="prolific-codes">
                        <div className="form-group">
                            <label htmlFor="completion-code">Completion Code</label>
                            <input
                                id="completion-code"
                                type="text"
                                value={settings.prolific_integration?.completion_code || ''}
                                onChange={(e) =>
                                    updateProlificIntegration({ completion_code: e.target.value })
                                }
                                placeholder="Enter Prolific completion code"
                            />
                            <span className="help-text">
                                Code shown to participants who complete the survey
                            </span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="screenout-code">Screenout Code</label>
                            <input
                                id="screenout-code"
                                type="text"
                                value={settings.prolific_integration?.screenout_code || ''}
                                onChange={(e) =>
                                    updateProlificIntegration({ screenout_code: e.target.value })
                                }
                                placeholder="Enter Prolific screenout code"
                            />
                            <span className="help-text">
                                Code shown to participants who are screened out
                            </span>
                        </div>
                    </div>
                )}
            </fieldset>

            <div className="actions">
                <button onClick={handleSave} className="btn-primary">
                    Save Settings
                </button>
            </div>

            <style jsx>{`
                .settings-container {
                    padding: 1.5rem;
                    max-width: 600px;
                }

                .settings-container h2 {
                    font-size: 1.5rem;
                    color: #1a1d24;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                }

                .settings-section {
                    border: 1px solid #e0ddd8;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    background: #fafaf9;
                }

                .settings-section legend {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1a1d24;
                    padding: 0 0.5rem;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group:last-child {
                    margin-bottom: 0;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                }

                .form-group select,
                .form-group input[type="text"] {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    background: white;
                    color: #1a1d24;
                }

                .form-group select:focus,
                .form-group input[type="text"]:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .checkbox-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .checkbox-group input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    accent-color: #c94a4a;
                    cursor: pointer;
                }

                .help-text {
                    display: block;
                    font-size: 0.75rem;
                    color: #6b6b6b;
                    margin-top: 0.375rem;
                }

                .prolific-codes {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0ddd8;
                }

                .actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }

                .btn-primary {
                    background: #c94a4a;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: background 0.2s ease;
                }

                .btn-primary:hover {
                    background: #b43d3d;
                }

                .btn-primary:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px white, 0 0 0 4px #c94a4a;
                }
            `}</style>
        </div>
    );
}
