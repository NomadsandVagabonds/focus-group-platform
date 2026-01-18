'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
                    ))}
                </div>
            )}
        </>
    );
}
