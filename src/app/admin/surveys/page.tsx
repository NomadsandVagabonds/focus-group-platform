// Admin Survey List Page - Modern Web3 Style
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImportSurvey from '@/components/survey/builder/ImportSurvey';
import LiveResponseCounter from '@/components/survey/analytics/LiveResponseCounter';
import type { Survey } from '@/lib/supabase/survey-types';

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  async function fetchSurveys() {
    const response = await fetch('/api/survey/surveys');
    const { surveys: data } = await response.json();
    setSurveys(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleDeleteClick = (survey: Survey) => {
    setSurveyToDelete(survey);
    setDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSurveyToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!surveyToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/survey/surveys/${surveyToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete survey');
      }

      // Remove from local state
      setSurveys(surveys.filter(s => s.id !== surveyToDelete.id));
      setDeleteModalOpen(false);
      setSurveyToDelete(null);
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleClone = async (survey: Survey) => {
    setCloning(survey.id);
    try {
      const response = await fetch(`/api/survey/surveys/${survey.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clone survey');
      }

      // Refresh the surveys list
      await fetchSurveys();
    } catch (error: any) {
      alert(`Error cloning survey: ${error.message}`);
    } finally {
      setCloning(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading surveys...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 1rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e0ddd8;
            border-top-color: #c94a4a;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p { color: #666; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <h1>Surveys</h1>
          <p className="header-subtitle">Manage and create your research surveys</p>
        </div>
        <div className="header-actions">
          <ImportSurvey />
          <Link href="/admin/surveys/new" className="btn-new-survey">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Survey
          </Link>
        </div>
      </div>

      <div className="survey-list">
        {surveys?.map((survey: Survey) => (
          <div key={survey.id} className="survey-card">
            <div className="survey-info">
              <div className="survey-header">
                <h3>{survey.title}</h3>
                <span className={`status-badge status-${survey.status}`}>
                  {survey.status === 'active' && <span className="status-dot"></span>}
                  {survey.status}
                </span>
              </div>
              <p className="survey-description">{survey.description || 'No description'}</p>
              <div className="survey-meta">
                <LiveResponseCounter
                  surveyId={survey.id}
                  compact
                  pollInterval={survey.status === 'active' ? 30000 : 0}
                />
                <span className="meta-separator">•</span>
                <span className="date">
                  Created {new Date(survey.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="survey-actions">
              <Link href={`/admin/surveys/${survey.id}`} className="btn-action btn-edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </Link>
              <button
                onClick={() => handleClone(survey)}
                className="btn-action btn-clone"
                disabled={cloning === survey.id}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                {cloning === survey.id ? 'Cloning...' : 'Clone'}
              </button>
              <button
                onClick={() => handleDeleteClick(survey)}
                className="btn-action btn-delete"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          </div>
        ))}

        {(!surveys || surveys.length === 0) && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c94a4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3>No surveys yet</h3>
            <p>Create your first survey to start collecting responses</p>
            <Link href="/admin/surveys/new" className="btn-new-survey">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Survey
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && surveyToDelete && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Survey</h2>
              <button className="modal-close" onClick={handleDeleteCancel}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c94a4a" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="warning-title">Are you sure you want to delete this survey?</p>
              <p className="survey-name">"{surveyToDelete.title}"</p>
              <div className="warning-message">
                <p><strong>This action cannot be undone.</strong></p>
                <p>All associated data will be permanently deleted:</p>
                <ul>
                  <li>All responses and response data</li>
                  <li>All questions and answer options</li>
                  <li>All question groups and quotas</li>
                </ul>
              </div>
              {deleteError && (
                <div className="error-message">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-action btn-secondary-modal"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-action btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Survey'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          gap: 2rem;
        }

        .header-content h1 {
          font-size: 2.25rem;
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

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .btn-new-survey {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #c94a4a 0%, #a83232 100%);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9375rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(201, 74, 74, 0.25);
          border: none;
          cursor: pointer;
        }

        .btn-new-survey:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(201, 74, 74, 0.35);
        }

        .survey-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .survey-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          transition: all 0.2s ease;
          border: 1px solid rgba(0,0,0,0.04);
        }

        .survey-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .survey-info {
          flex: 1;
          min-width: 0;
        }

        .survey-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .survey-info h3 {
          font-size: 1.125rem;
          color: #1a1d24;
          margin: 0;
          font-weight: 600;
        }

        .survey-description {
          color: #666;
          margin: 0 0 0.75rem 0;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .survey-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          font-size: 0.875rem;
          color: #888;
        }

        .meta-separator {
          color: #ddd;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-draft {
          background: #f0eeea;
          color: #666;
        }

        .status-active {
          background: #dcfce7;
          color: #15803d;
        }

        .status-closed {
          background: #fee2e2;
          color: #b91c1c;
        }

        .date {
          color: #999;
        }

        .survey-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          border: 1px solid transparent;
        }

        .btn-edit {
          background: linear-gradient(135deg, #1a1d24 0%, #2d3748 100%);
          color: white;
          border-color: #1a1d24;
        }

        .btn-edit:hover {
          background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
          transform: translateY(-1px);
        }

        .btn-clone {
          background: white;
          color: #2563eb;
          border-color: #2563eb;
        }

        .btn-clone:hover:not(:disabled) {
          background: #2563eb;
          color: white;
        }

        .btn-clone:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-delete {
          background: white;
          color: #dc2626;
          border-color: #fecaca;
        }

        .btn-delete:hover {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          border: 2px dashed #e0ddd8;
        }

        .empty-icon {
          margin-bottom: 1.5rem;
          opacity: 0.6;
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e0ddd8;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #1a1d24;
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
          border-radius: 6px;
          display: flex;
          transition: all 0.15s;
        }

        .modal-close:hover {
          color: #1a1d24;
          background: #f0eeea;
        }

        .modal-body {
          padding: 1.5rem;
          text-align: center;
        }

        .warning-icon {
          margin-bottom: 1rem;
        }

        .warning-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1d24;
          margin-bottom: 0.5rem;
        }

        .survey-name {
          font-size: 1rem;
          color: #666;
          font-style: italic;
          margin-bottom: 1.5rem;
        }

        .warning-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          text-align: left;
          font-size: 0.9rem;
          color: #991b1b;
        }

        .warning-message p {
          margin: 0 0 0.5rem 0;
        }

        .warning-message ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.25rem;
        }

        .warning-message li {
          margin-bottom: 0.25rem;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 1rem;
          font-size: 0.9rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #e0ddd8;
        }

        .btn-secondary-modal {
          background: #f0eeea;
          color: #1a1d24;
          border-color: #e0ddd8;
        }

        .btn-secondary-modal:hover:not(:disabled) {
          background: #e0ddd8;
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border-color: #dc2626;
        }

        .btn-danger:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        }

        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            flex-wrap: wrap;
          }

          .survey-card {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .survey-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
