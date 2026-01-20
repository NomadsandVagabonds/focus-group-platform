// Admin Templates Page - Survey Templates & Label Sets
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SurveyTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    question_count: number;
    created_at: string;
}

interface LabelSet {
    id: string;
    name: string;
    language: string;
    labels: { code: string; label: string }[];
    created_at: string;
}

export default function TemplatesPage() {
    const [activeTab, setActiveTab] = useState<'templates' | 'labelsets' | 'settings'>('templates');
    const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
    const [labelSets, setLabelSets] = useState<LabelSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [showNewLabelSetModal, setShowNewLabelSetModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [templatesRes, labelSetsRes] = await Promise.all([
                fetch('/api/survey/templates'),
                fetch('/api/survey/label-sets')
            ]);

            if (templatesRes.ok) {
                const data = await templatesRes.json();
                setTemplates(data.templates || []);
            }

            if (labelSetsRes.ok) {
                const data = await labelSetsRes.json();
                setLabelSets(data.labelSets || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="templates-container">
            <div className="page-header">
                <h1>Templates & Settings</h1>
                <p>Manage survey templates, label sets, and global settings</p>
            </div>

            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    Survey Templates
                </button>
                <button
                    className={`tab-btn ${activeTab === 'labelsets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('labelsets')}
                >
                    Label Sets
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Global Settings
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'templates' && (
                    <TemplatesTab
                        templates={templates}
                        loading={loading}
                        onNewTemplate={() => setShowNewTemplateModal(true)}
                        onRefresh={fetchData}
                    />
                )}

                {activeTab === 'labelsets' && (
                    <LabelSetsTab
                        labelSets={labelSets}
                        loading={loading}
                        onNewLabelSet={() => setShowNewLabelSetModal(true)}
                        onRefresh={fetchData}
                    />
                )}

                {activeTab === 'settings' && <GlobalSettingsTab />}
            </div>

            {showNewTemplateModal && (
                <NewTemplateModal
                    onClose={() => setShowNewTemplateModal(false)}
                    onCreated={() => {
                        setShowNewTemplateModal(false);
                        fetchData();
                    }}
                />
            )}

            {showNewLabelSetModal && (
                <NewLabelSetModal
                    onClose={() => setShowNewLabelSetModal(false)}
                    onCreated={() => {
                        setShowNewLabelSetModal(false);
                        fetchData();
                    }}
                />
            )}

            <style jsx>{`
                .templates-container {
                    padding: 2rem;
                    background: #f5f3ef;
                    min-height: 100vh;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    color: #1a1d24;
                    margin: 0 0 0.5rem 0;
                    font-family: 'Libre Baskerville', serif;
                }

                .page-header p {
                    color: #666;
                    margin: 0;
                }

                .tab-navigation {
                    display: flex;
                    gap: 0.5rem;
                    border-bottom: 2px solid #e0ddd8;
                    margin-bottom: 2rem;
                }

                .tab-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    font-size: 0.9375rem;
                    color: #666;
                    cursor: pointer;
                    position: relative;
                    transition: color 0.2s;
                }

                .tab-btn:hover {
                    color: #1a1d24;
                }

                .tab-btn.active {
                    color: #c94a4a;
                    font-weight: 500;
                }

                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #c94a4a;
                }

                .tab-content {
                    min-height: 400px;
                }
            `}</style>
        </div>
    );
}

// Templates Tab Component
function TemplatesTab({
    templates,
    loading,
    onNewTemplate,
    onRefresh
}: {
    templates: SurveyTemplate[];
    loading: boolean;
    onNewTemplate: () => void;
    onRefresh: () => void;
}) {
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return;

        try {
            const res = await fetch(`/api/survey/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const handleCreateSurvey = async (templateId: string) => {
        try {
            const res = await fetch('/api/survey/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromTemplate: templateId })
            });

            if (res.ok) {
                const { survey } = await res.json();
                window.location.href = `/admin/surveys/${survey.id}`;
            }
        } catch (error) {
            console.error('Error creating from template:', error);
        }
    };

    return (
        <div className="templates-tab">
            <div className="section-header">
                <h2>Survey Templates</h2>
                <button onClick={onNewTemplate} className="btn-primary">
                    + Create Template
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading templates...</div>
            ) : templates.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                        </svg>
                    </div>
                    <h3>No templates yet</h3>
                    <p>Create reusable survey templates to speed up your workflow</p>
                    <button onClick={onNewTemplate} className="btn-primary">
                        Create Your First Template
                    </button>
                </div>
            ) : (
                <div className="template-grid">
                    {templates.map(template => (
                        <div key={template.id} className="template-card">
                            <div className="template-header">
                                <span className="template-category">{template.category}</span>
                                <div className="template-actions">
                                    <button
                                        onClick={() => handleCreateSurvey(template.id)}
                                        className="btn-small btn-primary"
                                        title="Create survey from template"
                                    >
                                        Use
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="btn-small btn-danger"
                                        title="Delete template"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <h3>{template.name}</h3>
                            <p>{template.description}</p>
                            <div className="template-meta">
                                <span>{template.question_count} questions</span>
                                <span>{new Date(template.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .templates-tab {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    font-size: 1.25rem;
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

                .btn-primary:hover {
                    background: #b43d3d;
                }

                .btn-small {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8125rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .btn-small.btn-primary {
                    background: #c94a4a;
                    color: white;
                }

                .btn-small.btn-danger {
                    background: #f8d7da;
                    color: #721c24;
                }

                .loading {
                    padding: 3rem;
                    text-align: center;
                    color: #666;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
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

                .template-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .template-card {
                    background: #fafaf9;
                    border: 1px solid #e0ddd8;
                    border-radius: 8px;
                    padding: 1.25rem;
                }

                .template-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }

                .template-category {
                    background: #e0ddd8;
                    color: #666;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                }

                .template-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .template-card h3 {
                    font-size: 1rem;
                    color: #1a1d24;
                    margin: 0 0 0.5rem 0;
                }

                .template-card p {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0 0 1rem 0;
                    line-height: 1.5;
                }

                .template-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: #999;
                }
            `}</style>
        </div>
    );
}

// Label Sets Tab Component
function LabelSetsTab({
    labelSets,
    loading,
    onNewLabelSet,
    onRefresh
}: {
    labelSets: LabelSet[];
    loading: boolean;
    onNewLabelSet: () => void;
    onRefresh: () => void;
}) {
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this label set?')) return;

        try {
            const res = await fetch(`/api/survey/label-sets/${id}`, { method: 'DELETE' });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error deleting label set:', error);
        }
    };

    // Default label sets (built-in)
    const defaultLabelSets = [
        { id: 'likert-5', name: '5-Point Likert', labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] },
        { id: 'likert-7', name: '7-Point Likert', labels: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree'] },
        { id: 'frequency', name: 'Frequency', labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { id: 'importance', name: 'Importance', labels: ['Not Important', 'Slightly Important', 'Moderately Important', 'Important', 'Very Important'] },
        { id: 'satisfaction', name: 'Satisfaction', labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] },
    ];

    return (
        <div className="labelsets-tab">
            <div className="section-header">
                <h2>Label Sets</h2>
                <button onClick={onNewLabelSet} className="btn-primary">
                    + Create Label Set
                </button>
            </div>

            <div className="labelsets-section">
                <h3>Built-in Label Sets</h3>
                <div className="labelset-list">
                    {defaultLabelSets.map(ls => (
                        <div key={ls.id} className="labelset-item builtin">
                            <div className="labelset-name">{ls.name}</div>
                            <div className="labelset-preview">
                                {ls.labels.join(' | ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="labelsets-section">
                <h3>Custom Label Sets</h3>
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : labelSets.length === 0 ? (
                    <div className="empty-message">
                        No custom label sets. Create one to reuse across surveys.
                    </div>
                ) : (
                    <div className="labelset-list">
                        {labelSets.map(ls => (
                            <div key={ls.id} className="labelset-item">
                                <div className="labelset-header">
                                    <div className="labelset-name">{ls.name}</div>
                                    <button
                                        onClick={() => handleDelete(ls.id)}
                                        className="btn-small btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div className="labelset-preview">
                                    {ls.labels.map(l => l.label).join(' | ')}
                                </div>
                                <div className="labelset-meta">
                                    Language: {ls.language}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .labelsets-tab {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    font-size: 1.25rem;
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

                .labelsets-section {
                    margin-bottom: 2rem;
                }

                .labelsets-section h3 {
                    font-size: 1rem;
                    color: #1a1d24;
                    margin: 0 0 1rem 0;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #e0ddd8;
                }

                .labelset-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .labelset-item {
                    background: #fafaf9;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    padding: 1rem;
                }

                .labelset-item.builtin {
                    background: #f0f4f8;
                    border-color: #d0d8e0;
                }

                .labelset-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .labelset-name {
                    font-weight: 500;
                    color: #1a1d24;
                }

                .labelset-preview {
                    font-size: 0.8125rem;
                    color: #666;
                    margin-top: 0.5rem;
                }

                .labelset-meta {
                    font-size: 0.75rem;
                    color: #999;
                    margin-top: 0.5rem;
                }

                .btn-small {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .btn-small.btn-danger {
                    background: #f8d7da;
                    color: #721c24;
                }

                .loading, .empty-message {
                    padding: 1.5rem;
                    text-align: center;
                    color: #666;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}

// Global Settings Tab Component
function GlobalSettingsTab() {
    const [settings, setSettings] = useState({
        defaultTheme: 'editorial_academic',
        defaultFormat: 'group_by_group',
        defaultLanguage: 'en',
        allowAnonymous: true,
        requireConsent: true,
        dataRetentionDays: 365,
        exportFormat: 'csv',
        emailNotifications: true,
        adminEmail: '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/survey/settings/global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-tab">
            <div className="section-header">
                <h2>Global Settings</h2>
            </div>

            <div className="settings-form">
                <fieldset>
                    <legend>Survey Defaults</legend>

                    <div className="form-group">
                        <label>Default Theme</label>
                        <select
                            value={settings.defaultTheme}
                            onChange={(e) => setSettings({ ...settings, defaultTheme: e.target.value })}
                        >
                            <option value="editorial_academic">Editorial Academic</option>
                            <option value="modern">Modern</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Default Format</label>
                        <select
                            value={settings.defaultFormat}
                            onChange={(e) => setSettings({ ...settings, defaultFormat: e.target.value })}
                        >
                            <option value="question_by_question">Question by Question</option>
                            <option value="group_by_group">Group by Group</option>
                            <option value="all_in_one">All in One</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Default Language</label>
                        <select
                            value={settings.defaultLanguage}
                            onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Privacy & Data</legend>

                    <div className="form-group checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.allowAnonymous}
                                onChange={(e) => setSettings({ ...settings, allowAnonymous: e.target.checked })}
                            />
                            Allow anonymous responses
                        </label>
                    </div>

                    <div className="form-group checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.requireConsent}
                                onChange={(e) => setSettings({ ...settings, requireConsent: e.target.checked })}
                            />
                            Require consent before starting surveys
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Data Retention (days)</label>
                        <input
                            type="number"
                            value={settings.dataRetentionDays}
                            onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 365 })}
                            min={30}
                            max={3650}
                        />
                        <small>How long to keep response data</small>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Export & Notifications</legend>

                    <div className="form-group">
                        <label>Default Export Format</label>
                        <select
                            value={settings.exportFormat}
                            onChange={(e) => setSettings({ ...settings, exportFormat: e.target.value })}
                        >
                            <option value="csv">CSV</option>
                            <option value="spss">SPSS (.sav)</option>
                            <option value="r">R (.rds)</option>
                            <option value="stata">Stata (.dta)</option>
                        </select>
                    </div>

                    <div className="form-group checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            />
                            Email notifications for completed surveys
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Admin Email</label>
                        <input
                            type="email"
                            value={settings.adminEmail}
                            onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                            placeholder="admin@example.com"
                        />
                    </div>
                </fieldset>

                <div className="form-actions">
                    <button onClick={handleSave} className="btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .settings-tab {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                }

                .section-header h2 {
                    font-size: 1.25rem;
                    color: #1a1d24;
                    margin: 0 0 1.5rem 0;
                }

                .settings-form {
                    max-width: 600px;
                }

                fieldset {
                    border: 1px solid #e0ddd8;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                legend {
                    font-weight: 500;
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
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                }

                .form-group.checkbox label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .form-group input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    accent-color: #c94a4a;
                }

                .form-group select,
                .form-group input[type="text"],
                .form-group input[type="email"],
                .form-group input[type="number"] {
                    width: 100%;
                    padding: 0.625rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }

                .form-group small {
                    display: block;
                    font-size: 0.75rem;
                    color: #666;
                    margin-top: 0.25rem;
                }

                .form-actions {
                    margin-top: 1.5rem;
                }

                .btn-primary {
                    background: #c94a4a;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9375rem;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #b43d3d;
                }

                .btn-primary:disabled {
                    background: #d0cdc8;
                }
            `}</style>
        </div>
    );
}

// New Template Modal
function NewTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [sourceSurveyId, setSourceSurveyId] = useState('');
    const [surveys, setSurveys] = useState<{ id: string; title: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/survey/surveys')
            .then(res => res.json())
            .then(data => setSurveys(data.surveys || []))
            .catch(() => {});
    }, []);

    const handleSave = async () => {
        if (!name.trim() || !sourceSurveyId) return;

        setSaving(true);
        try {
            const res = await fetch('/api/survey/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, category, sourceSurveyId })
            });

            if (res.ok) {
                onCreated();
            }
        } catch (error) {
            console.error('Error creating template:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Template</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Template Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Customer Satisfaction Survey"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this template for?"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="general">General</option>
                            <option value="research">Research</option>
                            <option value="feedback">Feedback</option>
                            <option value="assessment">Assessment</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Create from Survey</label>
                        <select value={sourceSurveyId} onChange={(e) => setSourceSurveyId(e.target.value)}>
                            <option value="">Select a survey...</option>
                            {surveys.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>
                        <small>The template will copy this survey's structure</small>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={saving || !name.trim() || !sourceSurveyId}
                    >
                        {saving ? 'Creating...' : 'Create Template'}
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
                        max-width: 500px;
                        max-height: 90vh;
                        overflow: hidden;
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

                    .form-group small {
                        display: block;
                        font-size: 0.75rem;
                        color: #666;
                        margin-top: 0.25rem;
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

// New Label Set Modal
function NewLabelSetModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('en');
    const [labels, setLabels] = useState<{ code: string; label: string }[]>([
        { code: 'A1', label: '' },
        { code: 'A2', label: '' },
        { code: 'A3', label: '' },
    ]);
    const [saving, setSaving] = useState(false);

    const addLabel = () => {
        setLabels([...labels, { code: `A${labels.length + 1}`, label: '' }]);
    };

    const removeLabel = (index: number) => {
        if (labels.length > 2) {
            setLabels(labels.filter((_, i) => i !== index));
        }
    };

    const updateLabel = (index: number, field: 'code' | 'label', value: string) => {
        const updated = [...labels];
        updated[index] = { ...updated[index], [field]: value };
        setLabels(updated);
    };

    const handleSave = async () => {
        if (!name.trim() || labels.some(l => !l.label.trim())) return;

        setSaving(true);
        try {
            const res = await fetch('/api/survey/label-sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, language, labels })
            });

            if (res.ok) {
                onCreated();
            }
        } catch (error) {
            console.error('Error creating label set:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Label Set</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Label Set Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Agreement Scale"
                            />
                        </div>

                        <div className="form-group small">
                            <label>Language</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                    </div>

                    <div className="labels-section">
                        <div className="labels-header">
                            <label>Labels</label>
                            <button type="button" onClick={addLabel} className="btn-small">+ Add</button>
                        </div>

                        {labels.map((label, index) => (
                            <div key={index} className="label-row">
                                <input
                                    type="text"
                                    value={label.code}
                                    onChange={(e) => updateLabel(index, 'code', e.target.value)}
                                    placeholder="Code"
                                    className="code-input"
                                />
                                <input
                                    type="text"
                                    value={label.label}
                                    onChange={(e) => updateLabel(index, 'label', e.target.value)}
                                    placeholder="Label text"
                                    className="label-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeLabel(index)}
                                    className="remove-btn"
                                    disabled={labels.length <= 2}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={saving || !name.trim() || labels.some(l => !l.label.trim())}
                    >
                        {saving ? 'Creating...' : 'Create Label Set'}
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
                        max-width: 500px;
                        max-height: 90vh;
                        overflow: hidden;
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
                        max-height: 60vh;
                        overflow-y: auto;
                    }

                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 120px;
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }

                    .form-group {
                        margin-bottom: 1rem;
                    }

                    .form-group label {
                        display: block;
                        font-size: 0.875rem;
                        font-weight: 500;
                        color: #1a1d24;
                        margin-bottom: 0.5rem;
                    }

                    .form-group input,
                    .form-group select {
                        width: 100%;
                        padding: 0.625rem;
                        border: 1px solid #e0ddd8;
                        border-radius: 4px;
                        font-size: 0.875rem;
                    }

                    .labels-section {
                        border: 1px solid #e0ddd8;
                        border-radius: 6px;
                        padding: 1rem;
                    }

                    .labels-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 0.75rem;
                    }

                    .labels-header label {
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

                    .label-row {
                        display: flex;
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;
                    }

                    .code-input {
                        width: 70px;
                        padding: 0.5rem;
                        border: 1px solid #e0ddd8;
                        border-radius: 4px;
                        font-size: 0.8125rem;
                    }

                    .label-input {
                        flex: 1;
                        padding: 0.5rem;
                        border: 1px solid #e0ddd8;
                        border-radius: 4px;
                        font-size: 0.8125rem;
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

                    .remove-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
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
