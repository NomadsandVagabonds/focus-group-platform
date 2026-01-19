'use client';

import React from 'react';
import Link from 'next/link';

export default function EthicsPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#FAF6F1',
            color: '#1A1A2E',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 5%',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="R" style={{ width: 32, height: 32, borderRadius: 4 }} />
                    <span style={{ fontFamily: 'Georgia', fontSize: '1.25rem', fontWeight: 'bold', color: '#1A1A2E' }}>Resonant</span>
                </Link>
                <Link href="/" style={{ color: '#9A3324', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Back to Home
                </Link>
            </header>

            {/* Content */}
            <main style={{ maxWidth: '700px', margin: '0 auto', padding: '4rem 2rem' }}>
                <h1 style={{
                    fontFamily: 'Georgia',
                    fontSize: '2.5rem',
                    marginBottom: '2rem',
                    color: '#1A1A2E'
                }}>
                    Ethical Funding
                </h1>

                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ fontSize: '1.15rem', lineHeight: 1.8, color: '#2D3748', marginBottom: '1.5rem' }}>
                        Resonant is an independent research organization with a mission to build the evidence base for
                        responsible AI governance. Our research must remain free from the influence of the
                        entities whose products and policies we may study.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{
                        fontFamily: 'Georgia',
                        fontSize: '1.5rem',
                        marginBottom: '1rem',
                        color: '#1A1A2E'
                    }}>
                        Our Funding Model
                    </h2>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#4A5568' }}>
                        Our work is supported by philanthropic foundations and individual donors.
                        Resonant's research agenda is not influenced by funders. This independence
                        allows us to pursue questions, and report findings, without commercial or
                        political pressure.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{
                        fontFamily: 'Georgia',
                        fontSize: '1.5rem',
                        marginBottom: '1rem',
                        color: '#1A1A2E'
                    }}>
                        Funding We Decline
                    </h2>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#4A5568', marginBottom: '1rem' }}>
                        To preserve research integrity, Resonant does not accept funding from:
                    </p>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        fontSize: '1.05rem',
                        lineHeight: 2,
                        color: '#4A5568'
                    }}>
                        <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#9A3324' }}>—</span>
                            Frontier AI laboratories and AI development companies
                        </li>
                        <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#9A3324' }}>—</span>
                            Entities with direct financial stakes in AI development outcomes
                        </li>
                    </ul>
                </section>

                <section style={{
                    padding: '2rem',
                    background: '#F5F0E8',
                    borderRadius: '8px',
                    borderLeft: '4px solid #9A3324'
                }}>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#2D3748', margin: 0 }}>
                        This policy allows us to hold ourselves accountable to the public, not to
                        industry interests. Our findings reflect what the evidence shows, not what
                        any funder might prefer.
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer style={{
                padding: '2rem 5%',
                borderTop: '1px solid rgba(0,0,0,0.08)',
                textAlign: 'center',
                color: '#718096',
                fontSize: '0.85rem'
            }}>
                © 2026 Resonant Research.
            </footer>
        </div>
    );
}
