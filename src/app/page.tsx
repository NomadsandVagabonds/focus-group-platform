'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: sessionName || 'Focus Group Session',
        moderatorId: userName || 'Moderator',
      }),
    });

    const session = await response.json();
    router.push(`/moderator?session=${session.id}&user=${encodeURIComponent(userName || 'Moderator')}`);
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/participant?session=${sessionId}&user=${encodeURIComponent(userName || `Participant-${Date.now()}`)}`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoMark}>R</div>
        <h1 className={styles.logoText}>Resonant</h1>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        <p className={styles.tagline}>
          Real-time perception tracking for qualitative research
        </p>

        {/* Card */}
        <div className={styles.card}>
          {/* Mode tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'create' ? styles.active : ''}`}
              onClick={() => setMode('create')}
            >
              Create Session
            </button>
            <button
              className={`${styles.tab} ${mode === 'join' ? styles.active : ''}`}
              onClick={() => setMode('join')}
            >
              Join Session
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreateSession} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="sessionName">Session Name</label>
                <input
                  id="sessionName"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Climate Messaging Study"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="moderatorName">Moderator Name</label>
                <input
                  id="moderatorName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <button type="submit" className={styles.primaryBtn}>
                Create Session
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSession} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="sessionCode">Session Code</label>
                <input
                  id="sessionCode"
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session code"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="How should we call you?"
                />
              </div>
              <button type="submit" className={styles.primaryBtn}>
                Join Session
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Resonant Research Tools</p>
      </footer>
    </div>
  );
}
