'use client';

import React from 'react';
import Link from 'next/link';
import styles from './home.module.css';

export default function MarketingPage() {
    return (
        <div className={styles.container}>

            {/* Navigation */}
            <nav className={styles.marketingHeader}>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="R" style={{ width: 36, height: 36, borderRadius: 4 }} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 'bold' }}>Resonant</span>
                </div>

                <div className={styles.marketingNav}>
                    <a href="#mission" className={styles.marketingNavLink}>Mission</a>
                    <a href="#services" className={styles.marketingNavLink}>Services</a>
                    <a href="#approach" className={styles.marketingNavLink}>Approach</a>
                    <a href="#contact" className={styles.marketingNavLink}>Contact</a>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/" className={styles.loginBtn}>
                        Login
                    </Link>
                    <a href="#contact" className={styles.demoBtn}>
                        Request Demo
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroTag}>AI Safety & Governance Research</div>
                <h1 className={styles.heroTitle}>
                    Data-driven guidance for policymakers and partners<br />
                    <span style={{ color: '#9A3324' }}>safeguarding the future of AI.</span>
                </h1>
                <p className={styles.heroSub}>
                    Resonant unites rigorous public opinion research with public education
                    to build bipartisan momentum for responsible AI governance.
                </p>

                <div className="flex gap-4">
                    <a href="#services" className={styles.demoBtn} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                        Explore Our Services
                    </a>
                    <Link href="/" className={styles.loginBtn} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                        Access Research Portal
                    </Link>
                </div>
            </section>

            {/* Mission Section */}
            <section id="mission" className={styles.features} style={{ background: '#FFFFFF' }}>
                <h2 className={styles.sectionTitle}>Building the evidence base for responsible AI governance</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.25rem', lineHeight: 1.7, color: '#2D3748', marginBottom: '2rem' }}>
                        Good policy requires good data. Resonant is a 501(c)(3) research organization dedicated to
                        understanding public attitudes toward artificial intelligence and emerging technology.
                    </p>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#4A5568' }}>
                        We provide rigorous, nonpartisan research that policymakers, advocates, and academics can trust.
                        Our role is to surface the signal—not push a message.
                    </p>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className={styles.features} style={{ background: '#F8FAFC' }}>
                <h2 className={styles.sectionTitle}>Research capabilities for the AI age</h2>

                <div className={styles.grid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🔍</div>
                        <h3 className={styles.featureTitle}>Landscape Diagnostics</h3>
                        <p className={styles.featureDesc}>
                            Map public attitudes, knowledge gaps, and existing narratives around AI policy.
                            Understand the terrain before you act.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>👥</div>
                        <h3 className={styles.featureTitle}>Audience Segmentation</h3>
                        <p className={styles.featureDesc}>
                            Identify distinct audience segments based on attitudes, values, and information exposure.
                            Know who thinks what, and why.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>💬</div>
                        <h3 className={styles.featureTitle}>Message Testing</h3>
                        <p className={styles.featureDesc}>
                            Test concepts and framings across diverse audiences. Measure comprehension and response
                            before launching communications.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>⚡</div>
                        <h3 className={styles.featureTitle}>Real-Time Perception Tracking</h3>
                        <p className={styles.featureDesc}>
                            Live focus groups with millisecond-level slider data. Capture exactly when and where
                            sentiment shifts during any stimulus.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📈</div>
                        <h3 className={styles.featureTitle}>Longitudinal Research</h3>
                        <p className={styles.featureDesc}>
                            Track how minds change over time. Repeated-measures studies reveal attitude shifts
                            in response to events and developments.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📋</div>
                        <h3 className={styles.featureTitle}>Survey Design & Fielding</h3>
                        <p className={styles.featureDesc}>
                            End-to-end survey research with validated scales, quota-balanced sampling, and full
                            documentation for publication or policy use.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🎙️</div>
                        <h3 className={styles.featureTitle}>Focus Group Intelligence</h3>
                        <p className={styles.featureDesc}>
                            Structured qualitative research with integrated recording, perception overlays, and
                            AI-assisted transcription.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📊</div>
                        <h3 className={styles.featureTitle}>Research Translation</h3>
                        <p className={styles.featureDesc}>
                            Translate complex research into accessible briefs, visualizations, and presentations
                            tailored for any audience.
                        </p>
                    </div>
                </div>
            </section>

            {/* Approach Section */}
            <section id="approach" className={styles.features} style={{ background: '#FFFFFF' }}>
                <h2 className={styles.sectionTitle}>Research that informs action—without prescribing it</h2>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <p style={{ fontSize: '1.15rem', lineHeight: 1.7, color: '#2D3748', textAlign: 'center', marginBottom: '3rem' }}>
                        Resonant maintains independence from advocacy campaigns. We do not make policy recommendations.
                        Our work provides the empirical foundation that others can use to make informed decisions.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '700px', margin: '0 auto' }}>
                        <div style={{ padding: '2rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What We Do</h4>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#166534', lineHeight: 2 }}>
                                <li>✓ Measure public attitudes</li>
                                <li>✓ Test message comprehension</li>
                                <li>✓ Identify audience segments</li>
                                <li>✓ Track attitude change over time</li>
                            </ul>
                        </div>
                        <div style={{ padding: '2rem', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#991B1B', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What We Don't Do</h4>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#991B1B', lineHeight: 2 }}>
                                <li>✗ Recommend policy positions</li>
                                <li>✗ Design persuasion campaigns</li>
                                <li>✗ Target voters or donors</li>
                                <li>✗ Advocate for specific outcomes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="contact" className={styles.cta}>
                <h2 className={styles.ctaTitle}>Partner with Resonant</h2>
                <p className={styles.ctaDesc}>
                    Whether you're fielding a survey, running focus groups, or building an evidence base
                    for policy work—we provide the tools and expertise to ground your research in rigor.
                </p>
                <div className="flex gap-4 justify-center">
                    <a href="mailto:research@resonant.org" className={styles.demoBtn} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                        Schedule a Consultation
                    </a>
                    <Link href="/" className={styles.loginBtn} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'transparent', borderColor: 'white', color: 'white' }}>
                        Access Research Portal
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#1A1A2E', color: '#718096', padding: '3rem 5%', borderTop: '1px solid #2D3748' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Georgia', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Resonant</div>
                        <p style={{ fontSize: '0.85rem' }}>A 501(c)(3) nonprofit research organization.</p>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                        © 2026 Resonant Research. All rights reserved.
                    </div>
                </div>
            </footer>

        </div>
    );
}
