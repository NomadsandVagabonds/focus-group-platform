'use client';

import React from 'react';
import Link from 'next/link';
import styles from '../home.module.css';

export default function PolicyPositionsPage() {
    return (
        <div className={styles.container}>
            {/* Navigation */}
            <nav className={styles.marketingHeader}>
                <Link href="/redesign" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                    <img src="/logo.png" alt="R" style={{ width: 36, height: 36, borderRadius: 4 }} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 'bold', color: '#1A1A2E' }}>Resonant</span>
                </Link>

                <div className={styles.marketingNav}>
                    <Link href="/redesign#mission" className={styles.marketingNavLink}>Mission</Link>
                    <Link href="/redesign#platform" className={styles.marketingNavLink}>Platform</Link>
                    <Link href="/redesign#research" className={styles.marketingNavLink}>Research</Link>
                    <Link href="/redesign/positions" className={styles.marketingNavLink} style={{ color: '#9A3324' }}>Positions</Link>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/" style={{
                        background: '#9A3324',
                        color: 'white',
                        padding: '0.6rem 1.25rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(154,51,36,0.2)'
                    }}>
                        Login
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                padding: '8rem 5% 5rem',
                background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EDE4 100%)',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#9A3324',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        marginBottom: '1.5rem'
                    }}>
                        Policy Positions
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        lineHeight: 1.2,
                        color: '#1A1A2E',
                        margin: 0,
                        marginBottom: '1.5rem'
                    }}>
                        What we stand for
                    </h1>
                    <p style={{
                        fontSize: '1.2rem',
                        lineHeight: 1.7,
                        color: '#4A5568',
                        maxWidth: '650px',
                        margin: '0 auto'
                    }}>
                        Our research reveals consistent public support for common-sense AI safety measures.
                        We support policies that reflect the national consensus—and lead on issues where
                        the public would agree if they understood the stakes.
                    </p>
                </div>
            </section>

            {/* Key Stat Banner */}
            <section style={{
                padding: '3rem 5%',
                background: 'linear-gradient(135deg, #9A3324 0%, #7A2A1E 100%)',
                color: 'white'
            }}>
                <div style={{
                    maxWidth: '1100px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2rem',
                    textAlign: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>67%</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                            prioritize safety rules over competing with China
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            Searchlight Institute, Dec 2025
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>80%</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                            favor safety testing even at cost of development speed
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            Gallup-SCSP, May 2025
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>82%</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                            don't trust tech executives to regulate AI on their own
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            AI Policy Institute, 2023
                        </div>
                    </div>
                </div>
            </section>

            {/* Position Cards */}
            <section style={{ padding: '5rem 5%', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    {/* Position 1 */}
                    <div style={{
                        padding: '2.5rem',
                        marginBottom: '2rem',
                        background: '#FAFAF8',
                        borderRadius: '12px',
                        borderLeft: '4px solid #9A3324'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.5rem',
                            color: '#1A1A2E',
                            marginBottom: '1rem',
                            marginTop: 0
                        }}>
                            Mandatory third-party safety testing
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#2D3748', marginBottom: '1.5rem' }}>
                            Before deployment of powerful AI systems, independent testing should verify they meet
                            safety standards. The public overwhelmingly supports this approach—and we do too.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            padding: '1rem',
                            background: 'rgba(154, 51, 36, 0.05)',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>80%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>favor safety testing</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>62%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>prefer "regulate with safety testing"</span>
                            </div>
                        </div>
                    </div>

                    {/* Position 2 */}
                    <div style={{
                        padding: '2.5rem',
                        marginBottom: '2rem',
                        background: '#FAFAF8',
                        borderRadius: '12px',
                        borderLeft: '4px solid #9A3324'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.5rem',
                            color: '#1A1A2E',
                            marginBottom: '1rem',
                            marginTop: 0
                        }}>
                            Independent government oversight
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#2D3748', marginBottom: '1.5rem' }}>
                            AI development is too consequential to be left to industry self-regulation.
                            We support robust federal oversight mechanisms and adequate funding for agencies
                            like NIST's AI Safety Institute.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            padding: '1rem',
                            background: 'rgba(154, 51, 36, 0.05)',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>67%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>say Congress does "too little" to regulate AI</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>22%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>trust developers to prioritize safety</span>
                            </div>
                        </div>
                    </div>

                    {/* Position 3 */}
                    <div style={{
                        padding: '2.5rem',
                        marginBottom: '2rem',
                        background: '#FAFAF8',
                        borderRadius: '12px',
                        borderLeft: '4px solid #9A3324'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.5rem',
                            color: '#1A1A2E',
                            marginBottom: '1rem',
                            marginTop: 0
                        }}>
                            Safety over speed
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#2D3748', marginBottom: '1.5rem' }}>
                            The "race with China" argument doesn't resonate with the American public.
                            By a 4-to-1 margin, Americans prefer maintaining safety rules even if it means
                            developing AI capabilities more slowly than competitors.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            padding: '1rem',
                            background: 'rgba(154, 51, 36, 0.05)',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>67%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>prioritize safety over speed</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>15%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>prioritize speed over safety</span>
                            </div>
                        </div>
                    </div>

                    {/* Position 4 */}
                    <div style={{
                        padding: '2.5rem',
                        marginBottom: '2rem',
                        background: '#FAFAF8',
                        borderRadius: '12px',
                        borderLeft: '4px solid #9A3324'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.5rem',
                            color: '#1A1A2E',
                            marginBottom: '1rem',
                            marginTop: 0
                        }}>
                            Transparency and disclosure
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#2D3748', marginBottom: '1.5rem' }}>
                            The public deserves to know when content is AI-generated and what data powers
                            these systems. We support mandatory watermarking, content labeling, and
                            training data transparency requirements.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            padding: '1rem',
                            background: 'rgba(154, 51, 36, 0.05)',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>50%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>highly worried about deepfakes</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, color: '#9A3324', fontSize: '1.5rem' }}>40%</span>
                                <span style={{ color: '#4A5568', marginLeft: '0.5rem' }}>highly worried about misinformation</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Methodology Note */}
            <section style={{
                padding: '4rem 5%',
                background: '#F8FAFC',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h3 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        color: '#1A1A2E',
                        marginBottom: '1rem'
                    }}>
                        Our approach
                    </h3>
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#4A5568', marginBottom: '1.5rem' }}>
                        We take public positions on AI safety policies when national polling consistently shows
                        majority support. For emerging issues where the public hasn't yet formed views, we focus
                        on education—helping people understand the stakes so they can make informed decisions.
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#718096' }}>
                        All cited statistics are from nationally representative surveys conducted by
                        independent research organizations. Sources include Pew Research Center, Gallup,
                        Searchlight Institute, Sentience Institute, and AI Policy Institute.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '3rem 5%',
                background: '#1A1A2E',
                color: '#E2E8F0',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <Link href="/redesign" style={{ color: '#E2E8F0', textDecoration: 'none' }}>Home</Link>
                        <Link href="/redesign#mission" style={{ color: '#E2E8F0', textDecoration: 'none' }}>Mission</Link>
                        <Link href="/redesign#research" style={{ color: '#E2E8F0', textDecoration: 'none' }}>Research</Link>
                        <Link href="/redesign/positions" style={{ color: '#E2E8F0', textDecoration: 'none' }}>Positions</Link>
                        <Link href="/redesign/ethics" style={{ color: '#E2E8F0', textDecoration: 'none' }}>Ethics</Link>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#A0AEC0' }}>
                        Resonant is a 501(c)(3) nonprofit research organization.
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '1rem' }}>
                        © 2025 Resonant. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
