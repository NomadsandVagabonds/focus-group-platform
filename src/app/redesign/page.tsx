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
                    <a href="#platform" className={styles.marketingNavLink}>Platform</a>
                    <a href="#research" className={styles.marketingNavLink}>Research</a>
                    <a href="#contact" className={styles.marketingNavLink}>Contact</a>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/" className={styles.loginBtn}>
                        Login
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <h1 className={styles.heroTitle}>
                    Data-driven guidance for policymakers and partners<br />
                    <span style={{ color: '#9A3324' }}>safeguarding the future of AI.</span>
                </h1>
                <p className={styles.heroSub}>
                    Resonant unites rigorous public opinion research with public education
                    to build bipartisan momentum for responsible AI governance.
                </p>

                {/* Hero Banner Placeholder */}
                <div style={{
                    width: '100%',
                    maxWidth: '1000px',
                    aspectRatio: '16/9',
                    background: 'linear-gradient(135deg, #F5F0E8 0%, #E8E0D8 100%)',
                    borderRadius: '12px',
                    marginTop: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #C4B8A8',
                    color: '#8B7355'
                }}>
                    <span style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>Hero image placeholder — 16:9</span>
                </div>
            </section>

            {/* Mission Section */}
            <section id="mission" className={styles.features} style={{ background: '#FFFFFF' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>
                        Translating public sentiment into policy momentum
                    </h2>
                    <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#2D3748', marginBottom: '1.5rem' }}>
                        The AI policy conversation moves faster than our democratic institutions can respond.
                        Legislators need evidence. Advocates need data. Funders need insight into what
                        the public actually believes—not what algorithms predict they believe.
                    </p>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#4A5568' }}>
                        Resonant provides the research infrastructure to understand public attitudes toward
                        emerging technology with the rigor that policy work demands. We design instruments,
                        field studies, and translate findings into the actionable intelligence that moves
                        governance forward.
                    </p>
                </div>
            </section>

            {/* Focus Group Platform Section */}
            <section id="platform" style={{ padding: '6rem 5%', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#1A1A2E', marginBottom: '1.5rem' }}>
                            Real-time perception tracking
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: '#2D3748', marginBottom: '1.5rem' }}>
                            Our focus group platform captures continuous participant reactions during video,
                            audio, or text stimuli. Moderators see perception data overlaid in real-time,
                            enabling precise follow-up on moments of shift.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#4A5568' }}>
                            Millisecond-level slider data. Synchronized recordings. AI-assisted transcription.
                            Everything you need to understand not just what participants think, but
                            exactly when their thinking changes.
                        </p>
                    </div>
                    {/* Focus Group Image Placeholder */}
                    <div style={{
                        aspectRatio: '4/3',
                        background: 'linear-gradient(135deg, #F5F0E8 0%, #E8E0D8 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #C4B8A8',
                        color: '#8B7355'
                    }}>
                        <span style={{ fontSize: '1rem', fontStyle: 'italic' }}>Focus group platform — 4:3</span>
                    </div>
                </div>
            </section>

            {/* Survey Platform Section */}
            <section style={{ padding: '6rem 5%', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    {/* Survey Image Placeholder */}
                    <div style={{
                        aspectRatio: '4/3',
                        background: 'linear-gradient(135deg, #F5F0E8 0%, #E8E0D8 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #C4B8A8',
                        color: '#8B7355'
                    }}>
                        <span style={{ fontSize: '1rem', fontStyle: 'italic' }}>Survey platform — 4:3</span>
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#1A1A2E', marginBottom: '1.5rem' }}>
                            Rigorous survey research
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: '#2D3748', marginBottom: '1.5rem' }}>
                            From instrument design through data collection, we build surveys that meet
                            publication standards. Validated scales. Cognitive pretesting. Representative
                            samples with transparent methodology.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#4A5568' }}>
                            Our survey work integrates directly with qualitative follow-up—respondents
                            can be segmented and invited to focus groups based on their attitudes,
                            creating a complete research pipeline from hypothesis to insight.
                        </p>
                    </div>
                </div>
            </section>

            {/* Public Education & Media Section */}
            <section style={{ padding: '6rem 5%', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#1A1A2E', marginBottom: '1.5rem' }}>
                            Public education & media
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: '#2D3748', marginBottom: '1.5rem' }}>
                            Research is only powerful if it reaches people. We produce video content,
                            digital campaigns, and educational materials that translate complex findings
                            into compelling narratives for public audiences.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#4A5568' }}>
                            From explanatory shorts to targeted online campaigns, our media work is grounded
                            in tested messaging and authentic audience insight—ensuring every piece we
                            create has the best chance of cutting through.
                        </p>
                    </div>
                    {/* Media Image Placeholder */}
                    <div style={{
                        aspectRatio: '16/9',
                        background: 'linear-gradient(135deg, #F5F0E8 0%, #E8E0D8 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #C4B8A8',
                        color: '#8B7355'
                    }}>
                        <span style={{ fontSize: '1rem', fontStyle: 'italic' }}>Media & campaigns — 16:9</span>
                    </div>
                </div>
            </section>

            {/* Research Section */}
            <section id="research" style={{ padding: '6rem 5%', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>
                        Current research
                    </h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#4A5568', marginBottom: '3rem' }}>
                        Our ongoing work investigates how the American public understands AI risk,
                        what messaging frameworks resonate across political lines, and how to build
                        durable coalitions for governance.
                    </p>

                    {/* Research Preview Placeholder */}
                    <div style={{
                        aspectRatio: '16/9',
                        background: 'linear-gradient(135deg, #F5F0E8 0%, #E8E0D8 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #C4B8A8',
                        color: '#8B7355',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        <span style={{ fontSize: '1rem', fontStyle: 'italic' }}>Interactive research visualization — 16:9</span>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="contact" className={styles.cta}>
                <h2 className={styles.ctaTitle}>Support this research</h2>
                <p className={styles.ctaDesc}>
                    Resonant is a 501(c)(3) nonprofit. Our work is funded by foundations
                    and donors committed to evidence-based AI governance.
                </p>
                <div className="flex gap-4 justify-center">
                    <a href="mailto:research@resonant.org" className={styles.demoBtn} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                        Get in Touch
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#1A1A2E', color: '#718096', padding: '3rem 5%', borderTop: '1px solid #2D3748' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Georgia', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Resonant</div>
                        <p style={{ fontSize: '0.85rem' }}>A 501(c)(3) nonprofit research organization.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '0.85rem' }}>
                        <Link href="/redesign/ethics" style={{ color: '#A0AEC0', textDecoration: 'none' }}>Ethical Funding</Link>
                        <span>© 2026 Resonant Research</span>
                    </div>
                </div>
            </footer>

        </div>
    );
}
