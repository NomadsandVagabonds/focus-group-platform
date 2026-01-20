// Import Survey Component
// Supports JSON and LimeSurvey LSS (XML) formats
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportSurvey() {
    const router = useRouter();
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [warnings, setWarnings] = useState<string[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError('');
        setWarnings([]);

        try {
            const fileName = file.name.toLowerCase();
            const isLSS = fileName.endsWith('.lss') || fileName.endsWith('.xml');

            // Use FormData for file upload to preserve file type info
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/survey/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                if (result.warnings) {
                    setWarnings(result.warnings);
                }
                router.push(`/admin/surveys/${result.survey_id}`);
            } else {
                setError(result.error || 'Import failed');
                if (result.details) {
                    setError(`${result.error}: ${result.details.join(', ')}`);
                }
                setImporting(false);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to import file');
            setImporting(false);
        }
    };

    return (
        <div className="import-survey">
            <label htmlFor="import-file" className="import-button">
                {importing ? 'Importing...' : 'Import Survey'}
            </label>
            <input
                id="import-file"
                type="file"
                accept=".json,.lss,.xml"
                onChange={handleFileUpload}
                disabled={importing}
                style={{ display: 'none' }}
            />
            <div className="format-hint">Supports JSON and LimeSurvey LSS formats</div>
            {error && <div className="error-message">{error}</div>}
            {warnings.length > 0 && (
                <div className="warnings">
                    {warnings.map((w, i) => (
                        <div key={i} className="warning-message">{w}</div>
                    ))}
                </div>
            )}

            <style jsx>{`
        .import-survey {
          display: inline-block;
        }

        .import-button {
          background: #e0ddd8;
          color: #1a1d24;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.875rem;
          display: inline-block;
        }

        .import-button:hover {
          background: #d0cdc8;
        }

        .format-hint {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .error-message {
          color: #c94a4a;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .warnings {
          margin-top: 0.5rem;
        }

        .warning-message {
          color: #b45309;
          font-size: 0.75rem;
          padding: 0.25rem 0;
        }
      `}</style>
        </div>
    );
}
