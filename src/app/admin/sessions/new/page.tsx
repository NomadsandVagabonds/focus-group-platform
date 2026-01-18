'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function NewSessionPage() {
    const router = useRouter();
    const [sessionName, setSessionName] = useState('');
    const [participants, setParticipants] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionName.trim()) return;

        setIsLoading(true);

        try {
            // Parse participant lines
            const participantList = participants
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    const parts = line.split(',').map(p => p.trim());
                    return {
                        email: parts[0] || null,
                        notes: parts[1] || null
                    };
                });

            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sessionName,
                    participants: participantList.length > 0 ? participantList : undefined
                }),
            });

            if (!response.ok) throw new Error('Failed to create session');

            const { session } = await response.json();
            router.push(`/admin/sessions/${session.id}`);

        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Link href="/admin" className={styles.backLink}>
                ← Back to Sessions
            </Link>

            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Create New Session</h1>
            </div>

            <div className={styles.card}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label htmlFor="sessionName">Session Name *</label>
                        <input
                            id="sessionName"
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="e.g., Climate Messaging Study"
                            autoFocus
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="participants">Import Participants (Optional)</label>
                        <textarea
                            id="participants"
                            value={participants}
                            onChange={(e) => setParticipants(e.target.value)}
                            placeholder="Enter one participant per line:&#10;email@example.com, Notes about participant&#10;another@example.com, More notes"
                            rows={6}
                        />
                        <small style={{ color: '#718096', fontSize: '12px' }}>
                            Format: email, notes (comma-separated). You can also add participants after creating the session.
                        </small>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="submit"
                            className={styles.primaryBtn}
                            disabled={isLoading || !sessionName.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create Session'}
                        </button>
                        <Link href="/admin" className={styles.secondaryBtn}>
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
