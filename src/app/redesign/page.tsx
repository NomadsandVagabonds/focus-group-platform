'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './home.module.css';

// Animated wave visualization representing "resonance" - sentiment patterns emerging
function ResonanceWaves() {
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePos({
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height
                });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const generateWavePath = (index: number, total: number) => {
        const baseY = 50 + (index - total / 2) * 8;
        const amplitude = 15 + Math.sin(index * 0.5) * 10;
        const frequency = 0.8 + index * 0.1;
        const mouseInfluence = (mousePos.x - 0.5) * 20;

        let path = `M -10 ${baseY}`;
        for (let x = 0; x <= 110; x += 2) {
            const y = baseY +
                Math.sin((x * frequency * 0.05) + index) * amplitude +
                Math.sin((x * 0.02) + index * 0.3) * (amplitude * 0.5) +
                (mouseInfluence * Math.sin(x * 0.03));
            path += ` L ${x} ${y}`;
        }
        return path;
    };

    const waveCount = 12;
    const colors = [
        'rgba(154, 51, 36, 0.5)',
        'rgba(154, 51, 36, 0.35)',
        'rgba(139, 69, 54, 0.45)',
        'rgba(154, 51, 36, 0.25)',
        'rgba(180, 120, 100, 0.35)',
        'rgba(154, 51, 36, 0.2)',
        'rgba(120, 60, 50, 0.3)',
        'rgba(154, 51, 36, 0.15)',
        'rgba(200, 150, 130, 0.25)',
        'rgba(154, 51, 36, 0.12)',
        'rgba(140, 80, 65, 0.2)',
        'rgba(154, 51, 36, 0.08)',
    ];

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: 'blur(0.5px)' }}>
                {Array.from({ length: waveCount }).map((_, i) => (
                    <path
                        key={i}
                        d={generateWavePath(i, waveCount)}
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth="0.3"
                        style={{
                            animation: `waveFlow ${8 + i * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`
                        }}
                    />
                ))}
            </svg>
            {/* Floating data points */}
            <div style={{ position: 'absolute', inset: 0 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: '#9A3324',
                            left: `${10 + (i * 4.5) % 80}%`,
                            top: `${20 + (i * 7) % 60}%`,
                            opacity: 0.2 + (i % 3) * 0.15,
                            animation: `float ${4 + (i % 3)}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// Animated counter for statistics
function AnimatedStat({ value, label, delay, suffix = '' }: { value: number; label: string; delay: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    useEffect(() => {
        if (!isVisible) return;
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [isVisible, value]);

    return (
        <div style={{
            transition: 'all 0.7s',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: `${delay}ms`
        }}>
            <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                color: '#9A3324',
                fontWeight: 300,
                letterSpacing: '-0.02em'
            }}>
                {count.toLocaleString()}{suffix}
            </div>
            <div style={{
                color: '#78716c',
                fontSize: '0.7rem',
                marginTop: 4,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
            }}>{label}</div>
        </div>
    );
}

export default function MarketingPage() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
    }, []);

    return (
        <div className={styles.container}>
            {/* Animation keyframes */}
            <style>{`
                @keyframes waveFlow {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    50% { transform: translateX(-2%) translateY(2px); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-10px) scale(1.2); opacity: 0.6; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes expandLine {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-expand { animation: expandLine 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: left; }
            `}</style>

            {/* Navigation */}
            <nav className={styles.marketingHeader} style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.7s' }}>
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
                    <Link href="/" className={styles.demoBtn}>
                        Login
                    </Link>
                </div>
            </nav>

            {/* Hero Section - Flowing Waves */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EDE4 100%)',
                overflow: 'hidden'
            }}>
                {/* Background visualization */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
                    <ResonanceWaves />
                </div>

                {/* Subtle grid overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.03,
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

                {/* Content */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    maxWidth: 1280,
                    margin: '0 auto',
                    padding: '128px 48px 80px',
                    width: '100%'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '7fr 5fr',
                        gap: 48,
                        alignItems: 'center'
                    }}>
                        {/* Left - Main headline */}
                        <div>
                            {/* Eyebrow */}
                            <div
                                className={loaded ? 'animate-slide-up' : ''}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    marginBottom: 32,
                                    opacity: loaded ? undefined : 0,
                                    animationDelay: '0.1s'
                                }}
                            >
                                <div
                                    className={loaded ? 'animate-expand' : ''}
                                    style={{
                                        height: 1,
                                        width: 48,
                                        backgroundColor: '#9A3324',
                                        animationDelay: '0.3s'
                                    }}
                                />
                                <span style={{
                                    color: '#9A3324',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    fontWeight: 600
                                }}>
                                    AI Safety Research
                                </span>
                            </div>

                            {/* Main headline - staggered reveal */}
                            <h1 style={{
                                fontFamily: 'var(--font-serif)',
                                color: '#1A1A2E',
                                lineHeight: 0.95,
                                letterSpacing: '-0.02em'
                            }}>
                                <span
                                    className={loaded ? 'animate-slide-up' : ''}
                                    style={{
                                        display: 'block',
                                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                                        fontWeight: 300,
                                        opacity: loaded ? undefined : 0,
                                        animationDelay: '0.2s'
                                    }}
                                >
                                    Guiding those who
                                </span>
                                <span
                                    className={loaded ? 'animate-slide-up' : ''}
                                    style={{
                                        display: 'block',
                                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                                        fontStyle: 'italic',
                                        fontWeight: 300,
                                        color: '#9A3324',
                                        marginTop: 8,
                                        opacity: loaded ? undefined : 0,
                                        animationDelay: '0.35s'
                                    }}
                                >
                                    shape the future
                                </span>
                                <span
                                    className={loaded ? 'animate-slide-up' : ''}
                                    style={{
                                        display: 'block',
                                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                                        fontWeight: 300,
                                        marginTop: 8,
                                        opacity: loaded ? undefined : 0,
                                        animationDelay: '0.5s'
                                    }}
                                >
                                    of AI.
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <p
                                className={loaded ? 'animate-slide-up' : ''}
                                style={{
                                    marginTop: 40,
                                    color: '#4A5568',
                                    fontSize: '1.15rem',
                                    lineHeight: 1.7,
                                    maxWidth: 520,
                                    opacity: loaded ? undefined : 0,
                                    animationDelay: '0.65s'
                                }}
                            >
                                We unite rigorous public opinion research with strategic communication
                                to build bipartisan momentum for responsible AI governance.
                            </p>

                            {/* CTAs */}
                            <div
                                className={loaded ? 'animate-slide-up' : ''}
                                style={{
                                    marginTop: 40,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 16,
                                    opacity: loaded ? undefined : 0,
                                    animationDelay: '0.8s'
                                }}
                            >
                                <a href="#research" className={styles.demoBtn} style={{
                                    padding: '1rem 2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12
                                }}>
                                    Explore Our Research
                                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </a>
                                <a href="#mission" className={styles.loginBtn} style={{ padding: '1rem 2rem' }}>
                                    Our Mission
                                </a>
                            </div>
                        </div>

                        {/* Right - Stats + Featured insight */}
                        <div style={{ paddingLeft: 32 }}>
                            {/* Featured research card */}
                            <div
                                className={loaded ? 'animate-slide-up' : ''}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(214,211,209,0.5)',
                                    padding: 32,
                                    marginBottom: 32,
                                    opacity: loaded ? undefined : 0,
                                    animationDelay: '0.9s'
                                }}
                            >
                                <div style={{
                                    fontSize: '0.65rem',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#a8a29e',
                                    marginBottom: 16
                                }}>Latest Finding</div>
                                <blockquote style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                                    color: '#1A1A2E',
                                    fontStyle: 'italic',
                                    lineHeight: 1.4,
                                    margin: 0
                                }}>
                                    "Only 17% of Americans concerned about AI focus on existential risks—the rest worry about jobs, privacy, and bias."
                                </blockquote>
                                <div style={{
                                    marginTop: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12
                                }}>
                                    <div style={{ height: 1, flex: 1, backgroundColor: '#e7e5e4' }} />
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: '#a8a29e',
                                        letterSpacing: '0.05em'
                                    }}>The Dimensional Problem, 2025</span>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 24,
                                opacity: loaded ? 1 : 0,
                                transition: 'opacity 1s',
                                transitionDelay: '1.1s'
                            }}>
                                <AnimatedStat value={47} label="Focus Groups" delay={1200} suffix="" />
                                <AnimatedStat value={12000} label="Respondents" delay={1400} suffix="+" />
                                <AnimatedStat value={8} label="Publications" delay={1600} suffix="" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom scroll indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: 32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    opacity: loaded ? 0.6 : 0,
                    transition: 'opacity 1s',
                    transitionDelay: '1.5s'
                }}>
                    <span style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: '#9A3324'
                    }}>Scroll</span>
                    <div style={{
                        width: 1,
                        height: 32,
                        background: 'linear-gradient(to bottom, #9A3324, transparent)'
                    }} />
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
