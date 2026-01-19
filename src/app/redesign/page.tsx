'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './home.module.css';
import DimensionalProblem from '@/components/DimensionalProblem';

// Hero Carousel Component
function HeroCarousel() {
    const [activeSlide, setActiveSlide] = useState(0);
    const slides = [
        { id: 'analytics', label: 'Focus Groups' },
        { id: 'sankey', label: 'Research' },
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(154,51,36,0.03) 0%, rgba(154,51,36,0.08) 100%)',
            padding: '2rem',
            height: '100%',
        }}>
            {/* Decorative elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                right: '5%',
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                border: '1px solid rgba(154,51,36,0.12)',
                opacity: 0.4,
                pointerEvents: 'none'
            }} />

            {/* Slide Container */}
            <div style={{
                width: '95%',
                height: '80%',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)',
                border: '1px solid rgba(154,51,36,0.1)',
                position: 'relative',
                background: '#fff'
            }}>
                {activeSlide === 0 ? (
                    <img
                        src="/focus-group-lifestyle.jpg"
                        alt="Researchers analyzing focus group session data"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top left',
                            display: 'block'
                        }}
                    />
                ) : (
                    <DimensionalProblem />
                )}
            </div>

            {/* Slide Indicators */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '1.5rem',
            }}>
                {slides.map((slide, i) => (
                    <button
                        key={slide.id}
                        onClick={() => setActiveSlide(i)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: activeSlide === i ? '2px solid #9A3324' : '1px solid rgba(154,51,36,0.3)',
                            background: activeSlide === i ? 'rgba(154,51,36,0.1)' : 'rgba(255,255,255,0.8)',
                            color: activeSlide === i ? '#9A3324' : '#666',
                            fontSize: '0.75rem',
                            fontWeight: activeSlide === i ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {slide.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

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
                    <Link href="/redesign/positions" className={styles.marketingNavLink}>Positions</Link>
                    <a href="#contact" className={styles.marketingNavLink}>Contact</a>
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

            {/* Hero Section - Split Dramatic */}
            <section style={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EDE4 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Left side - Typography */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '6rem 4rem 6rem 8%',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#9A3324',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        marginBottom: '2rem'
                    }}>
                        AI Safety Research
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        lineHeight: 1.1,
                        color: '#1A1A2E',
                        margin: 0,
                        marginBottom: '1.5rem'
                    }}>
                        Guiding those who<br />
                        <span style={{
                            color: '#9A3324',
                            fontStyle: 'italic'
                        }}>shape the future</span><br />
                        of AI.
                    </h1>
                    <p style={{
                        fontSize: '1.15rem',
                        lineHeight: 1.7,
                        color: '#4A5568',
                        maxWidth: '440px',
                        marginBottom: '2.5rem'
                    }}>
                        Resonant unites rigorous public opinion research with public education
                        to build bipartisan momentum for responsible AI governance.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href="#mission" className={styles.demoBtn} style={{ padding: '1rem 2rem' }}>
                            Our Mission
                        </a>
                        <a href="#contact" className={styles.loginBtn} style={{ padding: '1rem 2rem' }}>
                            Partner With Us
                        </a>
                    </div>
                </div>

                {/* Right side - Carousel Viz Area */}
                <HeroCarousel />

                {/* Scroll indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#9A3324',
                    opacity: 0.6
                }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Scroll</span>
                    <div style={{ width: '1px', height: '30px', background: '#9A3324' }} />
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

            {/* Humanity Section */}
            <section style={{
                padding: '5rem 5%',
                background: 'linear-gradient(135deg, #9A3324 0%, #7A2A1E 100%)',
                color: 'white'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                        margin: 0
                    }}>
                        "If AI represents the largest technological transformation since electricity,
                        then the public deserves a voice in how we proceed."
                    </p>
                    <p style={{
                        fontSize: '1rem',
                        marginTop: '2rem',
                        opacity: 0.8
                    }}>
                        We connect public opinion to policymakers—and help audiences understand the stakes
                        so they can clearly voice what they want for the future.
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
                    {/* Focus Group Platform Screenshot */}
                    <div style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <img
                            src="/platform-screenshot.png"
                            alt="Resonant focus group platform showing moderator view with live perception tracking"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                            }}
                        />
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
                            Research only matters if it reaches the public. We produce pilot video content
                            and educational campaigns—then rigorously test them with our focus groups to identify
                            the messages that genuinely connect with people.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#4A5568' }}>
                            Create multiple approaches. Test with real audiences. Refine until effective.
                            Our integrated platform means every piece of content is validated by
                            authentic public response—not assumptions or gut instinct.
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

                    {/* Sankey Visualization */}
                    <div style={{
                        width: '100%',
                        maxWidth: '1000px',
                        aspectRatio: '16/9',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                        margin: '0 auto',
                        border: '1px solid rgba(154,51,36,0.1)'
                    }}>
                        <iframe
                            src="https://nomads-liard.vercel.app/mats-research/dimensional-problem/index.html"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            title="AI Safety Messaging Research - Dimensional Problem"
                        />
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
