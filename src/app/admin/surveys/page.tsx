// Admin Survey List Page
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
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Surveys</h1>
        <div className="header-actions">
          <ImportSurvey />
          <Link href="/admin/surveys/new" className="btn-primary">
            + New Survey
          </Link>
        </div>
      </div>

      <div className="survey-list">
        {surveys?.map((survey: Survey) => (
          <div key={survey.id} className="survey-card">
            <div className="survey-info">
              <h3>{survey.title}</h3>
              <p className="survey-description">{survey.description}</p>
              <div className="survey-meta">
                <span className={`status-badge status-${survey.status}`}>
                  {survey.status}
                </span>
                <LiveResponseCounter
                  surveyId={survey.id}
                  compact
                  pollInterval={survey.status === 'active' ? 30000 : 0}
                />
                <span className="date">
                  Created {new Date(survey.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="survey-actions">
              <Link href={`/admin/surveys/${survey.id}`} className="btn-secondary">
                Edit
              </Link>
              {survey.status === 'active' && (
                <Link href={`/survey/take/${survey.id}`} className="btn-secondary">
                  Preview
                </Link>
              )}
              <button
                onClick={() => handleClone(survey)}
                className="btn-clone"
                title="Clone survey"
                disabled={cloning === survey.id}
              >
                {cloning === survey.id ? 'Cloning...' : 'Clone'}
              </button>
              <button
                onClick={() => handleDeleteClick(survey)}
                className="btn-delete"
                title="Delete survey"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {(!surveys || surveys.length === 0) && (
          <div className="empty-state">
            <p>No surveys yet. Create your first survey to get started.</p>
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
                &times;
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
                  <li>All questions, subquestions, and answer options</li>
                  <li>All question groups</li>
                  <li>All quotas</li>
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
                className="btn-secondary"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
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
          background: #f5f3ef;
          min-height: 100vh;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 2rem;
          color: #1a1d24;
          font-family: 'Libre Baskerville', serif;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn-primary {
          background: #c94a4a;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          text-decoration: none;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #b03a3a;
        }

        .survey-list {
          display: grid;
          gap: 1rem;
        }

        .survey-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .survey-info h3 {
          font-size: 1.25rem;
          color: #1a1d24;
          margin-bottom: 0.5rem;
        }

        .survey-description {
          color: #666;
          margin-bottom: 0.75rem;
        }

        .survey-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-draft {
          background: #e0ddd8;
          color: #666;
        }

        .status-active {
          background: #d4edda;
          color: #155724;
        }

        .status-closed {
          background: #f8d7da;
          color: #721c24;
        }

        .date {
          color: #999;
          font-size: 0.875rem;
        }

        .survey-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-secondary {
          background: #e0ddd8;
          color: #1a1d24;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          text-decoration: none;
          transition: background 0.2s;
        }

        .btn-secondary:hover {
          background: #d0cdc8;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #666;
        }

        .btn-clone {
          background: transparent;
          color: #2563eb;
          padding: 0.5rem 1rem;
          border: 1px solid #2563eb;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
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
          background: transparent;
          color: #c94a4a;
          padding: 0.5rem 1rem;
          border: 1px solid #c94a4a;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .btn-delete:hover {
          background: #c94a4a;
          color: white;
        }

        /* Modal Styles */
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
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 500px;
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
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          line-height: 1;
        }

        .modal-close:hover {
          color: #1a1d24;
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
          background: #fff8f8;
          border: 1px solid #f8d7da;
          border-radius: 4px;
          padding: 1rem;
          text-align: left;
          font-size: 0.9rem;
          color: #721c24;
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
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 0.75rem;
          border-radius: 4px;
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

        .modal-footer .btn-secondary {
          background: #e0ddd8;
          color: #1a1d24;
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .modal-footer .btn-secondary:hover:not(:disabled) {
          background: #d0cdc8;
        }

        .btn-danger {
          background: #c94a4a;
          color: white;
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .btn-danger:hover:not(:disabled) {
          background: #b03a3a;
        }

        .btn-danger:disabled,
        .modal-footer .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
