'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userName, setUserName] = useState(searchParams.get('p') || '');
  const [sessionId, setSessionId] = useState(searchParams.get('session') || '');

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
          <div className={styles.tabs} style={{ borderBottom: 'none', padding: '1rem 1.5rem 0' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1A1A2E',
              margin: 0,
              textAlign: 'center',
              width: '100%'
            }}>
              Join Session
            </h2>
          </div>

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
                autoFocus={!sessionId}
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
                autoFocus={!!sessionId && !userName}
              />
            </div>
            <button type="submit" className={styles.primaryBtn}>
              Join Session
            </button>
          </form>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href="/admin" style={{ color: '#718096', fontSize: '0.875rem', textDecoration: 'none' }}>
            Moderator login →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Resonant Research Tools</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
}
