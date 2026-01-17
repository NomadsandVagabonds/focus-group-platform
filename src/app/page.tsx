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
      <div className={styles.hero}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>📊</div>
          <h1 className={styles.title}>
            <span className={styles.gradientText}>Focus</span>Group
          </h1>
        </div>
        <p className={styles.subtitle}>
          Real-time perception tracking for qualitative research
        </p>
      </div>

      <div className={styles.cardContainer}>
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
              <label>Session Name</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Ad Testing Session 1"
              />
            </div>
            <div className={styles.field}>
              <label>Your Name (Moderator)</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Dr. Smith"
              />
            </div>
            <button type="submit" className={styles.primaryBtn}>
              Create Session
              <span className={styles.arrow}>→</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSession} className={styles.form}>
            <div className={styles.field}>
              <label>Session ID</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID or paste join link"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Participant 1"
              />
            </div>
            <button type="submit" className={styles.primaryBtn}>
              Join Session
              <span className={styles.arrow}>→</span>
            </button>
          </form>
        )}
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📹</span>
          <h3>10-Person Video</h3>
          <p>8 participants + moderator + screen share</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📊</span>
          <h3>Perception Dial</h3>
          <p>Frank Luntz-style continuous feedback</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>⚡</span>
          <h3>250ms Tracking</h3>
          <p>High-granularity sentiment capture</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📱</span>
          <h3>Mobile First</h3>
          <p>Touch-optimized slider interface</p>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>Built for qualitative research and focus group facilitation</p>
      </footer>
    </div>
  );
}
