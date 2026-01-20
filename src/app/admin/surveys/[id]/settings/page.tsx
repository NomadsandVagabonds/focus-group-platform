// Survey Settings UI
'use client';

import { useState, useEffect, use } from 'react';
import QRCodeDisplay from '@/components/survey/QRCodeDisplay';

interface EmailTemplate {
    subject: string;
    body: string;
}

interface EmailTemplates {
    invitation?: EmailTemplate;
    reminder?: EmailTemplate;
    confirmation?: EmailTemplate;
}

interface SurveySettings {
    format?: 'question_by_question' | 'group_by_group' | 'all_in_one';
    theme?: 'editorial_academic' | 'modern' | 'minimal';
    show_progress_bar?: boolean;
    show_question_index?: boolean;
    show_group_info?: boolean;
    allow_backward_navigation?: boolean;
    allow_jump_to_question?: boolean;
    keyboard_navigation?: boolean;
    save_incomplete_responses?: boolean;
    auto_save_interval?: number;
    allow_resume_later?: boolean;
    resume_token_expiry_days?: number;
    welcome_enabled?: boolean;
    welcome_title?: string;
    welcome_message?: string;
    welcome_button_text?: string;
    end_enabled?: boolean;
    end_title?: string;
    end_message?: string;
    end_redirect_url?: string;
    end_redirect_delay?: number;
    screenout_enabled?: boolean;
    screenout_title?: string;
    screenout_message?: string;
    screenout_redirect_url?: string;
    quota_full_enabled?: boolean;
    quota_full_title?: string;
    quota_full_message?: string;
    quota_full_redirect_url?: string;
    prolific_integration?: {
        enabled: boolean;
        completion_code?: string;
        screenout_code?: string;
    };
    custom_css?: string;
    custom_js?: string;
    logo_url?: string;
    logo_position?: 'left' | 'center' | 'right';
    footer_text?: string;
    collect_timing_data?: boolean;
    collect_device_info?: boolean;
    anonymize_ip?: boolean;
    // Publication & scheduling
    start_date?: string;
    expiry_date?: string;
    // Email templates
    email_templates?: EmailTemplates;
}

interface SettingsPageProps {
    params: Promise<{ id: string }>;
}

type TabId = 'display' | 'navigation' | 'messages' | 'integrations' | 'data' | 'publication' | 'custom_code' | 'email_templates' | 'qr_code';

export default function SettingsPage({ params }: SettingsPageProps) {
    const { id: surveyId } = use(params);
    const [settings, setSettings] = useState<SurveySettings>({});
    const [surveyTitle, setSurveyTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('display');

    useEffect(() => {
        fetchSettings();
    }, [surveyId]);

    async function fetchSettings() {
        try {
            setLoading(true);
            const response = await fetch(`/api/survey/${surveyId}/settings`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch settings');
            }

            setSettings(data.settings);
            setSurveyTitle(data.survey_title);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch(`/api/survey/${surveyId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            setSettings(data.settings);
            setSuccess('Settings saved successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function updateSetting<K extends keyof SurveySettings>(key: K, value: SurveySettings[K]) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }

    function updateProlific(key: string, value: any) {
        setSettings(prev => ({
            ...prev,
            prolific_integration: {
                ...prev.prolific_integration,
                enabled: prev.prolific_integration?.enabled ?? false,
                [key]: value,
            },
        }));
    }

    function updateEmailTemplate(templateType: 'invitation' | 'reminder' | 'confirmation', field: 'subject' | 'body', value: string) {
        setSettings(prev => ({
            ...prev,
            email_templates: {
                ...prev.email_templates,
                [templateType]: {
                    ...prev.email_templates?.[templateType],
                    [field]: value,
                },
            },
        }));
    }

    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<'invitation' | 'reminder' | 'confirmation'>('invitation');
    const [testEmailAddress, setTestEmailAddress] = useState('');
    const [sendingTestEmail, setSendingTestEmail] = useState(false);
    const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

    async function handleSendTestEmail() {
        if (!testEmailAddress) {
            setTestEmailResult({ success: false, message: 'Please enter an email address' });
            return;
        }
        try {
            setSendingTestEmail(true);
            setTestEmailResult(null);
            const response = await fetch('/api/survey/emails/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId,
                    templateType: selectedEmailTemplate,
                    testEmail: testEmailAddress,
                    customTemplate: settings.email_templates?.[selectedEmailTemplate],
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send test email');
            }
            setTestEmailResult({ success: true, message: 'Test email sent successfully!' });
        } catch (err: any) {
            setTestEmailResult({ success: false, message: err.message });
        } finally {
            setSendingTestEmail(false);
        }
    }

    const emailPlaceholders = [
        { code: '{FIRSTNAME}', description: 'Participant first name' },
        { code: '{LASTNAME}', description: 'Participant last name' },
        { code: '{EMAIL}', description: 'Participant email' },
        { code: '{TOKEN}', description: 'Access token' },
        { code: '{SURVEYURL}', description: 'Survey URL with token' },
        { code: '{SURVEYTITLE}', description: 'Survey title' },
    ];

    const defaultTemplates = {
        invitation: {
            subject: "You're invited to participate in {SURVEYTITLE}",
            body: "Dear {FIRSTNAME},\n\nYou have been invited to participate in our survey: {SURVEYTITLE}.\n\nPlease click the link below to begin:\n{SURVEYURL}\n\nThank you for your time.\n\nBest regards"
        },
        reminder: {
            subject: "Reminder: Please complete {SURVEYTITLE}",
            body: "Dear {FIRSTNAME},\n\nThis is a friendly reminder to complete the survey: {SURVEYTITLE}.\n\nIf you haven't had a chance to complete it yet, please click the link below:\n{SURVEYURL}\n\nThank you for your participation.\n\nBest regards"
        },
        confirmation: {
            subject: "Thank you for completing {SURVEYTITLE}",
            body: "Dear {FIRSTNAME},\n\nThank you for completing our survey: {SURVEYTITLE}.\n\nYour response has been recorded.\n\nBest regards"
        }
    };

    const tabs: { id: TabId; label: string }[] = [
        { id: 'display', label: 'Display' },
        { id: 'navigation', label: 'Navigation' },
        { id: 'messages', label: 'Messages' },
        { id: 'email_templates', label: 'Email Templates' },
        { id: 'qr_code', label: 'QR Code' },
        { id: 'publication', label: 'Publication' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'data', label: 'Data Collection' },
        { id: 'custom_code', label: 'Custom Code' },
    ];

    if (loading) {
        return <div className="loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <header className="page-header">
                <h1>Survey Settings</h1>
                <p className="subtitle">{surveyTitle}</p>
            </header>

            {error && (
                <div className="message error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className="message success-message">
                    {success}
                </div>
            )}

            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="settings-content">
                {activeTab === 'display' && (
                    <section className="settings-section">
                        <h2>Display Settings</h2>

                        <div className="form-group">
                            <label>Survey Format</label>
                            <select
                                value={settings.format || 'group_by_group'}
                                onChange={(e) => updateSetting('format', e.target.value as any)}
                            >
                                <option value="question_by_question">Question by Question</option>
                                <option value="group_by_group">Group by Group</option>
                                <option value="all_in_one">All in One Page</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Theme</label>
                            <select
                                value={settings.theme || 'editorial_academic'}
                                onChange={(e) => updateSetting('theme', e.target.value as any)}
                            >
                                <option value="editorial_academic">Editorial Academic</option>
                                <option value="modern">Modern</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.show_progress_bar ?? true}
                                    onChange={(e) => updateSetting('show_progress_bar', e.target.checked)}
                                />
                                Show Progress Bar
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.show_question_index ?? true}
                                    onChange={(e) => updateSetting('show_question_index', e.target.checked)}
                                />
                                Show Question Numbers
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.show_group_info ?? true}
                                    onChange={(e) => updateSetting('show_group_info', e.target.checked)}
                                />
                                Show Group Information
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Logo URL</label>
                            <input
                                type="url"
                                value={settings.logo_url || ''}
                                onChange={(e) => updateSetting('logo_url', e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        <div className="form-group">
                            <label>Logo Position</label>
                            <select
                                value={settings.logo_position || 'left'}
                                onChange={(e) => updateSetting('logo_position', e.target.value as any)}
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Footer Text</label>
                            <input
                                type="text"
                                value={settings.footer_text || ''}
                                onChange={(e) => updateSetting('footer_text', e.target.value)}
                                placeholder="Powered by Resonant"
                            />
                        </div>
                    </section>
                )}

                {activeTab === 'navigation' && (
                    <section className="settings-section">
                        <h2>Navigation Settings</h2>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.allow_backward_navigation ?? true}
                                    onChange={(e) => updateSetting('allow_backward_navigation', e.target.checked)}
                                />
                                Allow Backward Navigation
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.allow_jump_to_question ?? false}
                                    onChange={(e) => updateSetting('allow_jump_to_question', e.target.checked)}
                                />
                                Allow Jumping to Any Question
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.keyboard_navigation ?? true}
                                    onChange={(e) => updateSetting('keyboard_navigation', e.target.checked)}
                                />
                                Enable Keyboard Navigation
                            </label>
                        </div>

                        <h3>Save & Resume</h3>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.save_incomplete_responses ?? true}
                                    onChange={(e) => updateSetting('save_incomplete_responses', e.target.checked)}
                                />
                                Save Incomplete Responses
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.allow_resume_later ?? true}
                                    onChange={(e) => updateSetting('allow_resume_later', e.target.checked)}
                                />
                                Allow Resume Later
                            </label>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Auto-save Interval (seconds)</label>
                                <input
                                    type="number"
                                    value={settings.auto_save_interval ?? 30}
                                    onChange={(e) => updateSetting('auto_save_interval', parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={300}
                                />
                                <small>Set to 0 to disable</small>
                            </div>
                            <div className="form-group">
                                <label>Resume Token Expiry (days)</label>
                                <input
                                    type="number"
                                    value={settings.resume_token_expiry_days ?? 7}
                                    onChange={(e) => updateSetting('resume_token_expiry_days', parseInt(e.target.value) || 7)}
                                    min={1}
                                    max={90}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'messages' && (
                    <section className="settings-section">
                        <h2>Welcome Message</h2>

                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.welcome_enabled ?? true}
                                onChange={(e) => updateSetting('welcome_enabled', e.target.checked)}
                            />
                            Show Welcome Page
                        </label>

                        {settings.welcome_enabled !== false && (
                            <>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={settings.welcome_title || ''}
                                        onChange={(e) => updateSetting('welcome_title', e.target.value)}
                                        placeholder="Welcome"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        value={settings.welcome_message || ''}
                                        onChange={(e) => updateSetting('welcome_message', e.target.value)}
                                        placeholder="Thank you for participating..."
                                        rows={4}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Button Text</label>
                                    <input
                                        type="text"
                                        value={settings.welcome_button_text || ''}
                                        onChange={(e) => updateSetting('welcome_button_text', e.target.value)}
                                        placeholder="Start Survey"
                                    />
                                </div>
                            </>
                        )}

                        <h2>Completion Message</h2>

                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.end_enabled ?? true}
                                onChange={(e) => updateSetting('end_enabled', e.target.checked)}
                            />
                            Show Completion Page
                        </label>

                        {settings.end_enabled !== false && (
                            <>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={settings.end_title || ''}
                                        onChange={(e) => updateSetting('end_title', e.target.value)}
                                        placeholder="Thank You"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        value={settings.end_message || ''}
                                        onChange={(e) => updateSetting('end_message', e.target.value)}
                                        placeholder="Your response has been recorded."
                                        rows={4}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Redirect URL</label>
                                        <input
                                            type="url"
                                            value={settings.end_redirect_url || ''}
                                            onChange={(e) => updateSetting('end_redirect_url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Delay (seconds)</label>
                                        <input
                                            type="number"
                                            value={settings.end_redirect_delay ?? 0}
                                            onChange={(e) => updateSetting('end_redirect_delay', parseInt(e.target.value) || 0)}
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <h2>Screenout Message</h2>

                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.screenout_enabled ?? true}
                                onChange={(e) => updateSetting('screenout_enabled', e.target.checked)}
                            />
                            Show Screenout Page
                        </label>

                        {settings.screenout_enabled !== false && (
                            <>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={settings.screenout_title || ''}
                                        onChange={(e) => updateSetting('screenout_title', e.target.value)}
                                        placeholder="Thank You"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        value={settings.screenout_message || ''}
                                        onChange={(e) => updateSetting('screenout_message', e.target.value)}
                                        placeholder="Unfortunately, you do not qualify..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Redirect URL</label>
                                    <input
                                        type="url"
                                        value={settings.screenout_redirect_url || ''}
                                        onChange={(e) => updateSetting('screenout_redirect_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </>
                        )}

                        <h2>Quota Full Message</h2>

                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.quota_full_enabled ?? true}
                                onChange={(e) => updateSetting('quota_full_enabled', e.target.checked)}
                            />
                            Show Quota Full Page
                        </label>

                        {settings.quota_full_enabled !== false && (
                            <>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={settings.quota_full_title || ''}
                                        onChange={(e) => updateSetting('quota_full_title', e.target.value)}
                                        placeholder="Survey Closed"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        value={settings.quota_full_message || ''}
                                        onChange={(e) => updateSetting('quota_full_message', e.target.value)}
                                        placeholder="This survey has reached its quota..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Redirect URL</label>
                                    <input
                                        type="url"
                                        value={settings.quota_full_redirect_url || ''}
                                        onChange={(e) => updateSetting('quota_full_redirect_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </>
                        )}
                    </section>
                )}

                {activeTab === 'email_templates' && (
                    <section className="settings-section">
                        <h2>Email Templates</h2>
                        <p className="section-description">
                            Customize the emails sent to participants for invitations, reminders, and confirmations.
                            Use placeholders to personalize your messages.
                        </p>

                        <div className="template-tabs">
                            {(['invitation', 'reminder', 'confirmation'] as const).map(type => (
                                <button
                                    key={type}
                                    className={`template-tab ${selectedEmailTemplate === type ? 'active' : ''}`}
                                    onClick={() => setSelectedEmailTemplate(type)}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="template-editor">
                            <div className="form-group">
                                <label>Subject Line</label>
                                <input
                                    type="text"
                                    value={settings.email_templates?.[selectedEmailTemplate]?.subject || defaultTemplates[selectedEmailTemplate].subject}
                                    onChange={(e) => updateEmailTemplate(selectedEmailTemplate, 'subject', e.target.value)}
                                    placeholder={defaultTemplates[selectedEmailTemplate].subject}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Body</label>
                                <textarea
                                    value={settings.email_templates?.[selectedEmailTemplate]?.body || defaultTemplates[selectedEmailTemplate].body}
                                    onChange={(e) => updateEmailTemplate(selectedEmailTemplate, 'body', e.target.value)}
                                    placeholder={defaultTemplates[selectedEmailTemplate].body}
                                    rows={12}
                                />
                            </div>

                            <div className="placeholders-panel">
                                <h4>Available Placeholders</h4>
                                <p className="placeholders-help">Click a placeholder to copy it to your clipboard.</p>
                                <div className="placeholders-list">
                                    {emailPlaceholders.map(p => (
                                        <button
                                            key={p.code}
                                            className="placeholder-chip"
                                            onClick={() => {
                                                navigator.clipboard.writeText(p.code);
                                                alert(`Copied ${p.code} to clipboard`);
                                            }}
                                            title={p.description}
                                        >
                                            {p.code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn-reset"
                                onClick={() => {
                                    updateEmailTemplate(selectedEmailTemplate, 'subject', defaultTemplates[selectedEmailTemplate].subject);
                                    updateEmailTemplate(selectedEmailTemplate, 'body', defaultTemplates[selectedEmailTemplate].body);
                                }}
                            >
                                Reset to Default
                            </button>
                        </div>

                        <div className="test-email-section">
                            <h3>Send Test Email</h3>
                            <p className="section-description">
                                Send a test email to verify your template looks correct before sending to participants.
                            </p>
                            <div className="test-email-form">
                                <input
                                    type="email"
                                    value={testEmailAddress}
                                    onChange={(e) => setTestEmailAddress(e.target.value)}
                                    placeholder="your@email.com"
                                    className="test-email-input"
                                />
                                <button
                                    className="btn-secondary"
                                    onClick={handleSendTestEmail}
                                    disabled={sendingTestEmail}
                                >
                                    {sendingTestEmail ? 'Sending...' : 'Send Test'}
                                </button>
                            </div>
                            {testEmailResult && (
                                <div className={`test-email-result ${testEmailResult.success ? 'success' : 'error'}`}>
                                    {testEmailResult.message}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'qr_code' && (
                    <section className="settings-section">
                        <h2>QR Code Distribution</h2>
                        <p className="section-description">
                            Generate a QR code for easy survey distribution. Perfect for in-person events,
                            printed materials, or digital signage.
                        </p>

                        <QRCodeDisplay
                            surveyId={surveyId}
                            surveyTitle={surveyTitle}
                        />
                    </section>
                )}

                {activeTab === 'publication' && (
                    <section className="settings-section">
                        <h2>Publication Schedule</h2>
                        <p className="section-description">
                            Control when your survey becomes available and when it closes.
                            Leave fields empty for no restriction.
                        </p>

                        <div className="form-group">
                            <label>Start Date & Time</label>
                            <input
                                type="datetime-local"
                                value={settings.start_date ? settings.start_date.slice(0, 16) : ''}
                                onChange={(e) => updateSetting('start_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                            />
                            <small>Survey will not be accessible before this date</small>
                        </div>

                        <div className="form-group">
                            <label>Expiry Date & Time</label>
                            <input
                                type="datetime-local"
                                value={settings.expiry_date ? settings.expiry_date.slice(0, 16) : ''}
                                onChange={(e) => updateSetting('expiry_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                            />
                            <small>Survey will automatically close after this date</small>
                        </div>

                        {(settings.start_date || settings.expiry_date) && (
                            <div className="schedule-preview">
                                <h3>Schedule Preview</h3>
                                {settings.start_date && (
                                    <p>
                                        <strong>Opens:</strong> {new Date(settings.start_date).toLocaleString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                                {settings.expiry_date && (
                                    <p>
                                        <strong>Closes:</strong> {new Date(settings.expiry_date).toLocaleString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'integrations' && (
                    <section className="settings-section">
                        <h2>Prolific Integration</h2>

                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.prolific_integration?.enabled ?? false}
                                onChange={(e) => updateProlific('enabled', e.target.checked)}
                            />
                            Enable Prolific Integration
                        </label>

                        {settings.prolific_integration?.enabled && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Completion Code</label>
                                    <input
                                        type="text"
                                        value={settings.prolific_integration?.completion_code || ''}
                                        onChange={(e) => updateProlific('completion_code', e.target.value)}
                                        placeholder="Enter completion code"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Screenout Code</label>
                                    <input
                                        type="text"
                                        value={settings.prolific_integration?.screenout_code || ''}
                                        onChange={(e) => updateProlific('screenout_code', e.target.value)}
                                        placeholder="Enter screenout code"
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'data' && (
                    <section className="settings-section">
                        <h2>Data Collection</h2>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.collect_timing_data ?? true}
                                    onChange={(e) => updateSetting('collect_timing_data', e.target.checked)}
                                />
                                Collect Timing Data
                                <small>Track time spent on each question</small>
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.collect_device_info ?? true}
                                    onChange={(e) => updateSetting('collect_device_info', e.target.checked)}
                                />
                                Collect Device Information
                                <small>Browser, OS, screen size</small>
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.anonymize_ip ?? false}
                                    onChange={(e) => updateSetting('anonymize_ip', e.target.checked)}
                                />
                                Anonymize IP Addresses
                                <small>Store only partial IP addresses</small>
                            </label>
                        </div>
                    </section>
                )}

                {activeTab === 'custom_code' && (
                    <section className="settings-section">
                        <h2>Custom Code</h2>
                        <p className="section-description">
                            Add custom CSS and JavaScript to customize the survey appearance and behavior.
                            Use with caution - custom code runs in the respondent's browser.
                        </p>

                        <div className="form-group">
                            <label>Custom CSS</label>
                            <p className="field-description">
                                Styles are automatically scoped to <code>.survey-container</code>.
                                You can override survey colors, fonts, spacing, and more.
                            </p>
                            <textarea
                                value={settings.custom_css || ''}
                                onChange={(e) => updateSetting('custom_css', e.target.value)}
                                placeholder={`/* Example: Change primary button color */
.btn-primary {
    background: #3b82f6;
}

/* Example: Customize question text */
.question-text {
    font-size: 1.1rem;
    font-weight: 500;
}`}
                                rows={10}
                                className="code-textarea"
                            />
                        </div>

                        <div className="form-group">
                            <label>Custom JavaScript</label>
                            <p className="field-description">
                                JavaScript runs when the survey loads. You have access to the <code>SurveyAPI</code> object
                                with methods like <code>getResponse(code)</code>, <code>setResponse(code, value)</code>,
                                <code>getAllResponses()</code>, <code>getSurveyId()</code>, and <code>getResponseId()</code>.
                            </p>
                            <textarea
                                value={settings.custom_js || ''}
                                onChange={(e) => updateSetting('custom_js', e.target.value)}
                                placeholder={`// Example: Log when survey loads
console.log('Survey loaded:', SurveyAPI.getSurveyId());

// Example: Get a response value
const answer = SurveyAPI.getResponse('Q1');

// Example: Set a response value programmatically
// SurveyAPI.setResponse('Q2', 'some value');

// Example: Get all responses
const allResponses = SurveyAPI.getAllResponses();`}
                                rows={12}
                                className="code-textarea"
                            />
                        </div>

                        <div className="api-reference">
                            <h3>SurveyAPI Reference</h3>
                            <ul>
                                <li><code>SurveyAPI.getResponse(code)</code> - Get the current value for a question</li>
                                <li><code>SurveyAPI.setResponse(code, value, subquestionCode?)</code> - Set a response value</li>
                                <li><code>SurveyAPI.getAllResponses()</code> - Get all response data as an object</li>
                                <li><code>SurveyAPI.getSurveyId()</code> - Get the current survey ID</li>
                                <li><code>SurveyAPI.getResponseId()</code> - Get the current response session ID</li>
                                <li><code>SurveyAPI.getCurrentGroupIndex()</code> - Get the current question group index</li>
                                <li><code>SurveyAPI.getTotalGroups()</code> - Get the total number of visible groups</li>
                            </ul>
                        </div>
                    </section>
                )}
            </div>

            <div className="save-bar">
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <style jsx>{`
                .settings-page {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 2rem;
                    padding-bottom: 100px;
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

                .message {
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .error-message {
                    background: #fef2f2;
                    border: 1px solid #c94a4a;
                    color: #c94a4a;
                }

                .success-message {
                    background: #f0fdf4;
                    border: 1px solid #22c55e;
                    color: #166534;
                }

                .message button {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    cursor: pointer;
                    color: inherit;
                }

                .tabs {
                    display: flex;
                    gap: 0.25rem;
                    border-bottom: 1px solid #e0ddd8;
                    margin-bottom: 2rem;
                }

                .tab {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                    color: #666;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                    transition: all 0.2s;
                }

                .tab:hover {
                    color: #1a1d24;
                }

                .tab.active {
                    color: #c94a4a;
                    border-bottom-color: #c94a4a;
                }

                .settings-section {
                    background: white;
                    border: 1px solid #e0ddd8;
                    border-radius: 8px;
                    padding: 2rem;
                }

                .settings-section h2 {
                    font-family: 'EB Garamond', Georgia, serif;
                    font-size: 1.25rem;
                    font-weight: 500;
                    color: #1a1d24;
                    margin: 0 0 1.5rem 0;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #e0ddd8;
                }

                .settings-section h2:not(:first-child) {
                    margin-top: 2rem;
                }

                .settings-section h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1a1d24;
                    margin: 1.5rem 0 1rem 0;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group > label {
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
                    font-family: inherit;
                }

                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none;
                    border-color: #c94a4a;
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

                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                }

                .checkbox-group label {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    cursor: pointer;
                    color: #1a1d24;
                }

                .checkbox-group label small {
                    display: block;
                    color: #666;
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }

                .checkbox-group input[type="checkbox"] {
                    margin-top: 0.25rem;
                    width: 16px;
                    height: 16px;
                    flex-shrink: 0;
                }

                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    margin-bottom: 1rem;
                    font-weight: 500;
                    color: #1a1d24;
                }

                .toggle-label input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                }

                .save-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    border-top: 1px solid #e0ddd8;
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: flex-end;
                    z-index: 100;
                }

                .btn-primary {
                    padding: 0.75rem 2rem;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                    border: none;
                    background: #c94a4a;
                    color: white;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    background: #b43939;
                }

                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                }

                .section-description {
                    color: #666;
                    margin: 0 0 1.5rem 0;
                    font-size: 0.875rem;
                }

                .schedule-preview {
                    background: #f5f3ef;
                    border-radius: 4px;
                    padding: 1rem;
                    margin-top: 1.5rem;
                }

                .schedule-preview h3 {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #1a1d24;
                    margin: 0 0 0.75rem 0;
                }

                .schedule-preview p {
                    margin: 0.5rem 0;
                    font-size: 0.875rem;
                    color: #1a1d24;
                }

                .schedule-preview strong {
                    color: #c94a4a;
                }

                .field-description {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0 0 0.75rem 0;
                    line-height: 1.5;
                }

                .field-description code {
                    background: #f5f3ef;
                    padding: 0.125rem 0.375rem;
                    border-radius: 3px;
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 0.8125rem;
                }

                .code-textarea {
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    tab-size: 2;
                }

                .api-reference {
                    background: #f5f3ef;
                    border-radius: 4px;
                    padding: 1rem 1.5rem;
                    margin-top: 1.5rem;
                }

                .api-reference h3 {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #1a1d24;
                    margin: 0 0 0.75rem 0;
                }

                .api-reference ul {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                .api-reference li {
                    font-size: 0.8125rem;
                    color: #444;
                    padding: 0.375rem 0;
                    border-bottom: 1px solid #e0ddd8;
                }

                .api-reference li:last-child {
                    border-bottom: none;
                }

                .api-reference code {
                    background: white;
                    padding: 0.125rem 0.375rem;
                    border-radius: 3px;
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 0.75rem;
                    color: #c94a4a;
                }

                /* Email Templates Styles */
                .template-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #e0ddd8;
                    padding-bottom: 0.5rem;
                }

                .template-tab {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px 4px 0 0;
                    background: #fafaf8;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .template-tab:hover {
                    background: #f0eeea;
                }

                .template-tab.active {
                    background: #c94a4a;
                    color: white;
                    border-color: #c94a4a;
                }

                .template-editor textarea {
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 0.875rem;
                    line-height: 1.6;
                    min-height: 200px;
                }

                .placeholders-panel {
                    background: #f5f3ef;
                    border-radius: 4px;
                    padding: 1rem;
                    margin-top: 1rem;
                }

                .placeholders-panel h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 0.875rem;
                    color: #1a1d24;
                }

                .placeholders-help {
                    font-size: 0.75rem;
                    color: #666;
                    margin: 0 0 0.75rem 0;
                }

                .placeholders-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .placeholder-chip {
                    padding: 0.375rem 0.75rem;
                    background: white;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 0.75rem;
                    color: #c94a4a;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .placeholder-chip:hover {
                    background: #c94a4a;
                    color: white;
                    border-color: #c94a4a;
                }

                .btn-reset {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    color: #666;
                    transition: all 0.2s;
                }

                .btn-reset:hover {
                    background: #f5f3ef;
                    color: #1a1d24;
                }

                /* Test Email Section */
                .test-email-section {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e0ddd8;
                }

                .test-email-section h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                }

                .test-email-form {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }

                .test-email-input {
                    flex: 1;
                    max-width: 300px;
                    padding: 0.625rem 0.875rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }

                .test-email-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .test-email-result {
                    margin-top: 0.75rem;
                    padding: 0.625rem 0.875rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }

                .test-email-result.success {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #22c55e;
                }

                .test-email-result.error {
                    background: #fef2f2;
                    color: #c94a4a;
                    border: 1px solid #c94a4a;
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .tabs {
                        overflow-x: auto;
                    }

                    .tab {
                        white-space: nowrap;
                    }
                }
            `}</style>
        </div>
    );
}
