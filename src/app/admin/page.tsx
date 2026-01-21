'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash } from 'iconoir-react';
import styles from './admin.module.css';

interface Session {
    id: string;
    name: string;
    code: string;
    status: 'scheduled' | 'live' | 'completed';
    created_at: string;
}

export default function AdminSessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, session: Session) => {
        e.stopPropagation();
        setSessionToDelete(session);
        setDeleteModalOpen(true);
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!sessionToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/sessions/${sessionToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete session');
            }

            // Remove from local state
            setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
            setDeleteModalOpen(false);
            setSessionToDelete(null);
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'live': return styles.statusLive;
            case 'completed': return styles.statusCompleted;
            default: return styles.statusScheduled;
        }
    };

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Sessions</h1>
                <Link href="/admin/sessions/new" className={styles.primaryBtn}>
                    + New Session
                </Link>
            </div>

            {isLoading ? (
                <div className={styles.card}>
                    <p style={{ color: '#718096', textAlign: 'center' }}>Loading...</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <h3>No sessions yet</h3>
                        <p>Create your first focus group session to get started.</p>
                        <Link href="/admin/sessions/new" className={styles.primaryBtn}>
                            + Create Session
                        </Link>
                    </div>
                </div>
            ) : (
                <div className={styles.sessionList}>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className={styles.sessionItem}
                            onClick={() => router.push(`/admin/sessions/${session.id}`)}
                        >
                            <div className={styles.sessionInfo}>
                                <h3>{session.name}</h3>
                                <div className={styles.sessionMeta}>
                                    <span>Code: <span className={styles.sessionCode}>{session.code}</span></span>
                                    <span className={`${styles.statusBadge} ${getStatusClass(session.status)}`}>
                                        {session.status}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.sessionActions}>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => handleDeleteClick(e, session)}
                                    title="Delete session"
                                >
                                    <Trash width={18} height={18} />
                                </button>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/moderator?session=${session.id}&user=Moderator`);
                                    }}
                                >
                                    🚀 Launch
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && sessionToDelete && (
                <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Delete Session</h2>
                            <button className={styles.modalClose} onClick={handleDeleteCancel}>
                                &times;
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.warningIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c94a4a" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                            </div>
                            <p className={styles.warningTitle}>Are you sure you want to delete this session?</p>
                            <p className={styles.sessionName}>"{sessionToDelete.name}"</p>
                            <p className={styles.sessionCodeModal}>Code: {sessionToDelete.code}</p>
                            <div className={styles.warningMessage}>
                                <p><strong>This action cannot be undone.</strong></p>
                                <p>All associated data will be permanently deleted:</p>
                                <ul>
                                    <li>All participants in this session</li>
                                    <li>All chat messages and transcripts</li>
                                    <li>All recordings and media</li>
                                    <li>All session notes</li>
                                </ul>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.secondaryBtn}
                                onClick={handleDeleteCancel}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.dangerBtn}
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete Session'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
