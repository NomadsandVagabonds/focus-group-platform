'use client';

import React_ from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './home.module.css';

// Reusing the logo styles from the other module just for consistency in a pinch
// or we could inline the SVG for better quality. 
// For now, simple text/mark structure.

export default function MarketingPage() {
    return (
        <div className={styles.container}>

            {/* Navigation */}
            <nav className={styles.marketingHeader}>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="R" style={{ width: 32, height: 32, borderRadius: 4 }} />
                    <span style={{ fontFamily: 'Georgia', fontSize: '1.25rem', fontWeight: 'bold' }}>Resonant</span>
                </div>

                <div className={styles.marketingNav}>
                    <a href="#" className={styles.marketingNavLink}>Platform</a>
                    <a href="#" className={styles.marketingNavLink}>Solutions</a>
                    <a href="#" className={styles.marketingNavLink}>Customers</a>
                    <a href="#" className={styles.marketingNavLink}>Pricing</a>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/redesign/portal" className={styles.loginBtn}>
                        Login to Session
                    </Link>
                    <a href="#" className={styles.demoBtn}>
                        Book a Demo
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroTag}>AI Safety & Governance</div>
                <h1 className={styles.heroTitle}>
                    Safeguarding the future<br />
                    <span style={{ color: '#4A5568', fontStyle: 'italic' }}>through rigorous public inquiry.</span>
                </h1>
                <p className={styles.heroSub}>
                    Resonant unites rigorous public opinion research with scalable education testing to
                    build the bipartisan momentum necessary for responsible AI governance. We provide the
                    high-fidelity perception tracking tools needed to align advanced AI development with
                    authentic public values.
                </p>

                <div className="flex gap-4">
                    <a href="#" className={styles.demoBtn} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                        View Research Methodology
                    </a>
                    <Link href="/redesign/portal" className={styles.loginBtn} style={{ padding: '0.8rem 2rem', fontSize: '1rem', background: 'white' }}>
                        Join Research Session
                    </Link>
                </div>

                <div className={styles.heroImageWrapper}>
                    <Image
                        src="/dashboard-mockup.png"
                        alt="Resonant Dashboard Interface"
                        width={1000}
                        height={600}
                        className={styles.heroImg}
                        priority
                    />
                </div>
            </section>

            {/* Social Proof (Mock) */}
            <section style={{ padding: '2rem 5%', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                    Trusted by premier research institutions
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', opacity: 0.5, filter: 'grayscale(100%)' }}>
                    {/* Simple Placeholders for Logos */}
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>POLITICO</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Gallup</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Luntz Global</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Pew Research</span>
                </div>
            </section>

            {/* Features Grid */}
            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>Data for the public good</h2>

                <div className={styles.grid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🔍</div>
                        <h3 className={styles.featureTitle}>Research Integrity</h3>
                        <p className={styles.featureDesc}>
                            We design robust qualitative and quantitative studies that reveal voter sentiment,
                            stakeholder priorities, and policy trade-offs. Our tools capture authentic,
                            privacy-preserved reactions free from groupthink or moderator bias, ensuring
                            your data reflects true public opinion.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>⚡️</div>
                        <h3 className={styles.featureTitle}>Policy Education</h3>
                        <p className={styles.featureDesc}>
                            Our field-tested education campaigns align messages with local context.
                            We help researchers test how specific educational materials resonate across
                            diverse demographic subgroups to inform the safety discourse and build
                            durable coalitions for progress.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🛡️</div>
                        <h3 className={styles.featureTitle}>Actionable Governance</h3>
                        <p className={styles.featureDesc}>
                            We transform complex technical insights into data-driven policy briefs.
                            Resonant translates millisecond-level reaction logs into the compelling
                            narratives needed to resonate with public officials and their constituents,
                            turning raw data into legislative momentum.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta}>
                <h2 className={styles.ctaTitle}>Ready to see the unseen?</h2>
                <p className={styles.ctaDesc}>
                    Join the leading firms using Resonant to decode public opinion.
                </p>
                <a href="#" className={styles.demoBtn} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                    Request Access
                </a>
            </section>

            {/* Footer */}
            <footer style={{ background: '#1A1A2E', color: '#718096', padding: '4rem 5%', borderTop: '1px solid #2D3748' }}>
                <div className={styles.grid} style={{ gap: '2rem' }}>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Georgia', fontSize: '1.5rem', marginBottom: '1rem' }}>Resonant</div>
                        <p style={{ fontSize: '0.9rem' }}>Advanced perception tracking for the<br />modern world.</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'white', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Product</h4>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', lineHeight: '2' }}>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Roadmap</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: 'white', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Company</h4>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', lineHeight: '2' }}>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Careers</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #2D3748', textAlign: 'center', fontSize: '0.8rem' }}>
                    © 2026 Resonant Research Tools. All rights reserved.
                </div>
            </footer>

        </div>
    );
}
