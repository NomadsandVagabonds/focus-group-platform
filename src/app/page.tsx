'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

interface ValidationResult {
  valid: boolean;
  sessionId: string;
  sessionName: string;
  participantId: string;
  displayName?: string;
  error?: string;
}

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [sessionCode, setSessionCode] = useState(searchParams.get('session') || '');
  const [participantCode, setParticipantCode] = useState(searchParams.get('p') || '');

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  // Display name modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [validatedData, setValidatedData] = useState<ValidationResult | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const response = await fetch('/api/validate-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode: sessionCode.trim().toUpperCase(),
          participantCode: participantCode.trim().toUpperCase()
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid credentials');
        setIsValidating(false);
        return;
      }

      // Success! Show display name modal
      setValidatedData(data);
      setDisplayName(data.displayName || '');
      setShowNameModal(true);
      setIsValidating(false);

    } catch (err) {
      setError('Connection error. Please try again.');
      setIsValidating(false);
    }
  };

  const handleJoinSession = () => {
    if (!validatedData) return;

    // Navigate to participant page with validated session info
    const params = new URLSearchParams({
      session: validatedData.sessionId,
      pid: validatedData.participantId,
      name: displayName.trim() || 'Anonymous'
    });

    router.push(`/participant?${params.toString()}`);
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

        {/* Login Card */}
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

          <form onSubmit={handleValidate} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="sessionCode">Session Code</label>
              <input
                id="sessionCode"
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC-123"
                required
                autoFocus={!sessionCode}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="participantCode">Your Personal Code</label>
              <input
                id="participantCode"
                type="text"
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value.toUpperCase())}
                placeholder="e.g. XYZ789"
                required
                autoFocus={!!sessionCode && !participantCode}
                style={{ textTransform: 'uppercase' }}
              />
              <small style={{ color: '#718096', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Check your invite email for this code
              </small>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                color: '#991B1B',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isValidating}
              style={{ opacity: isValidating ? 0.7 : 1 }}
            >
              {isValidating ? 'Verifying...' : 'Continue'}
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

      {/* Display Name Modal */}
      {showNameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: '0.5rem'
            }}>
              Welcome! 👋
            </h3>
            <p style={{
              color: '#4A5568',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              Joining: <strong>{validatedData?.sessionName}</strong>
            </p>

            <div className={styles.field}>
              <label htmlFor="displayName" style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#4A5568',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                What should we call you?
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your first name or nickname"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginTop: '0.5rem'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleJoinSession();
                  }
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                This will appear on your video for others to see
              </small>
            </div>

            <button
              onClick={handleJoinSession}
              className={styles.primaryBtn}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Join Session
            </button>
          </div>
        </div>
      )}
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
