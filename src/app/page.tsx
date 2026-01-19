'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './home.module.css';
import DimensionalProblem from '@/components/DimensionalProblem';
import BeeswarmStory from '@/components/BeeswarmStory';

// Redirect component for session/participant invite links
function SessionRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const session = searchParams.get('session');
        const p = searchParams.get('p');
        if (session || p) {
            // Redirect to /join with the same params
            router.replace(`/join?${searchParams.toString()}`);
        }
    }, [searchParams, router]);

    return null;
}

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
            {/* Redirect session/participant invite links to /join */}
            <React.Suspense fallback={null}>
                <SessionRedirect />
            </React.Suspense>
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
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes expandLine {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                .animate-slide-up { opacity: 0; animation: fadeIn 1s ease-out forwards; }
                .animate-expand { opacity: 0; animation: expandLine 1.2s ease-out forwards; transform-origin: left; }
            `}</style>

            {/* Navigation */}
            <nav className={styles.marketingHeader} style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.7s' }}>
                <div className="flex items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="/logo.png" alt="R" style={{ width: 36, height: 36, borderRadius: 4 }} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 'bold' }}>Resonant</span>
                </div>

                <div className={styles.marketingNav}>
                    <a href="#mission" className={styles.marketingNavLink}>Mission</a>
                    <a href="#platform" className={styles.marketingNavLink}>Platform</a>
                    <a href="#research" className={styles.marketingNavLink}>Research</a>
                    <Link href="/positions" className={styles.marketingNavLink}>Positions</Link>
                    <a href="#contact" className={styles.marketingNavLink}>Contact</a>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/join" className={styles.demoBtn}>
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
                        maxWidth: 680,
                        margin: '0 auto',
                        textAlign: 'center'
                    }}>
                        {/* Eyebrow */}
                        <div
                            className={loaded ? 'animate-slide-up' : ''}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                                marginBottom: 32,
                                opacity: loaded ? undefined : 0
                            }}
                        >
                            <div
                                className={loaded ? 'animate-expand' : ''}
                                style={{
                                    height: 1,
                                    width: 48,
                                    backgroundColor: '#9A3324'
                                }}
                            />
                            <span style={{
                                color: '#9A3324',
                                fontSize: '0.75rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                fontWeight: 600
                            }}>
                                AI Public Opinion Research
                            </span>
                            <div
                                className={loaded ? 'animate-expand' : ''}
                                style={{
                                    height: 1,
                                    width: 48,
                                    backgroundColor: '#9A3324'
                                }}
                            />
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
                                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                    fontWeight: 300,
                                    opacity: loaded ? undefined : 0
                                }}
                            >
                                Guiding those who
                            </span>
                            <span
                                className={loaded ? 'animate-slide-up' : ''}
                                style={{
                                    display: 'block',
                                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                    fontStyle: 'italic',
                                    fontWeight: 300,
                                    color: '#9A3324',
                                    marginTop: 8,
                                    opacity: loaded ? undefined : 0
                                }}
                            >
                                shape the future
                            </span>
                            <span
                                className={loaded ? 'animate-slide-up' : ''}
                                style={{
                                    display: 'block',
                                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                    fontWeight: 300,
                                    marginTop: 8,
                                    opacity: loaded ? undefined : 0
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
                                fontSize: '1.2rem',
                                lineHeight: 1.7,
                                maxWidth: 560,
                                margin: '40px auto 0',
                                opacity: loaded ? undefined : 0,
                                animationDelay: '0.3s'
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
                                justifyContent: 'center',
                                gap: 16,
                                opacity: loaded ? undefined : 0,
                                animationDelay: '0.5s'
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
                        Funders need to know what actually moves the needle. And the public deserves to be heard.
                    </p>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#4A5568' }}>
                        Resonant provides the research infrastructure to understand how people actually weigh
                        the promises of AI against its risks. Then we translate those findings into the
                        evidence base that can move governance forward.
                    </p>
                </div>
            </section>

            {/* Three Pillars Section */}
            <section style={{ padding: '5rem 5%', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div className={styles.grid}>
                        {/* Research Integrity */}
                        <div style={{
                            padding: '2rem',
                            background: '#F8FAFC',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                background: 'rgba(154, 51, 36, 0.1)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A3324" strokeWidth="2">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    <path d="M9 12h6M9 16h6" />
                                </svg>
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.25rem',
                                color: '#1A1A2E',
                                marginBottom: '0.75rem'
                            }}>Research Integrity</h3>
                            <p style={{
                                fontSize: '1rem',
                                lineHeight: 1.65,
                                color: '#4A5568'
                            }}>
                                We design robust qualitative and quantitative studies that reveal public sentiment,
                                stakeholder priorities, and policy trade-offs across the political spectrum.
                            </p>
                        </div>

                        {/* Strategic Mobilization */}
                        <div style={{
                            padding: '2rem',
                            background: '#F8FAFC',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                background: 'rgba(154, 51, 36, 0.1)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A3324" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                                </svg>
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.25rem',
                                color: '#1A1A2E',
                                marginBottom: '0.75rem'
                            }}>Strategic Mobilization</h3>
                            <p style={{
                                fontSize: '1rem',
                                lineHeight: 1.65,
                                color: '#4A5568'
                            }}>
                                Our field-tested education campaigns align messages with local context,
                                building durable coalitions that champion safe AI adoption.
                            </p>
                        </div>

                        {/* Impact Translation */}
                        <div style={{
                            padding: '2rem',
                            background: '#F8FAFC',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                background: 'rgba(154, 51, 36, 0.1)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A3324" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.25rem',
                                color: '#1A1A2E',
                                marginBottom: '0.75rem'
                            }}>Impact Translation</h3>
                            <p style={{
                                fontSize: '1rem',
                                lineHeight: 1.65,
                                color: '#4A5568'
                            }}>
                                We transform complex technical insights into compelling stories and policy briefs
                                that resonate with public officials and the communities they serve.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quote Section */}
            <section style={{
                padding: '5rem 5%',
                background: 'linear-gradient(135deg, #9A3324 0%, #7A2A1E 100%)',
                color: 'white'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        margin: 0
                    }}>
                        "AI governance requires not just more expert intervention and regulation but more citizen voice and input."
                    </p>
                    <p style={{
                        fontSize: '1rem',
                        marginTop: '1.5rem',
                        opacity: 0.9,
                        fontWeight: 500
                    }}>
                        — Hélène Landemore, Yale University
                    </p>
                </div>
            </section>

            {/* Focus Group Platform Section */}
            <section id="platform" style={{ padding: '6rem 5%', background: '#F8FAFC' }}>
                <div className={styles.platformGrid}>
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
                            Run your entire session from one dashboard: custom scripts, seamless media
                            playback, and live perception tracking without switching tools. AI-assisted
                            transcription generates a searchable database with feedback linked to every
                            word spoken. Understand not just what participants think, but exactly when
                            their thinking changes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Survey Platform Section */}
            <section style={{ padding: '6rem 5%', background: '#FFFFFF' }}>
                <div className={styles.platformGrid}>
                    {/* Survey Screenshot */}
                    <div style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
                    }}>
                        <img
                            src="/survey-screenshot.png"
                            alt="AI Safety Survey - Questions about AI concern levels and policy preferences"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                            }}
                        />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#1A1A2E', marginBottom: '1.5rem' }}>
                            Rigorous survey research
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: '#2D3748', marginBottom: '1.5rem' }}>
                            From instrument design through data collection, we build surveys that meet
                            publication standards. We use validated scales, cognitive pretesting, and representative
                            samples with transparent methodology.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#4A5568' }}>
                            Our survey work integrates directly with qualitative follow-up. Respondents
                            can be segmented and invited to focus groups based on their attitudes,
                            creating a complete research pipeline from hypothesis to insight.
                        </p>
                    </div>
                </div>
            </section>

            {/* Public Education & Media Section */}
            <section style={{ padding: '6rem 5%', background: '#F8FAFC' }}>
                <div className={styles.platformGrid}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#1A1A2E', marginBottom: '1.5rem' }}>
                            Public education & media
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: '#2D3748', marginBottom: '1.5rem' }}>
                            Research only matters if it reaches the public. We produce educational video content
                            and explainer campaigns, then rigorously test them with focus groups to identify
                            the messages that genuinely resonate.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#4A5568' }}>
                            We develop multiple approaches, test with real audiences, and refine until effective.
                            Our integrated platform means every piece of content is validated by
                            authentic public response, not assumptions.
                        </p>
                    </div>
                    {/* Media Image */}
                    <div style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)'
                    }}>
                        <img
                            src="/shoggoth-video.png"
                            alt="Still from educational video about AI safety evaluations"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                            }}
                        />
                        <div style={{
                            background: '#1A1A2E',
                            padding: '12px 16px',
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.8)',
                            fontStyle: 'italic',
                            textAlign: 'center'
                        }}>
                            Translating research into content people share
                        </div>
                    </div>
                </div>
            </section>

            {/* Research Section */}
            <section id="research" style={{ padding: '6rem 5%', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>
                        Current research
                    </h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#4A5568', marginBottom: '3rem' }}>
                        Our ongoing work investigates how the American public understands AI risk,
                        what messaging frameworks resonate across political lines, and how to build
                        durable coalitions for governance.
                    </p>

                    {/* Sankey Visualization - Native React Component */}
                    <div style={{
                        width: '100%',
                        height: 500,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                        margin: '0 auto',
                        border: '1px solid rgba(154,51,36,0.1)'
                    }}>
                        <DimensionalProblem />
                    </div>

                    <p style={{
                        marginTop: '2rem',
                        fontSize: '0.9rem',
                        color: '#718096',
                        fontStyle: 'italic'
                    }}>
                        Hover over concern categories to explore the detailed breakdown from Pew Research data.
                    </p>
                </div>
            </section>

            {/* Beeswarm Scrollytelling Section - NO PADDING for sticky to work */}
            <section style={{ background: '#f5f3ef' }}>
                <BeeswarmStory />
            </section>

            {/* CTA */}
            <section id="contact" className={styles.cta}>
                <h2 className={styles.ctaTitle}>Work with us</h2>
                <p className={styles.ctaDesc}>
                    We partner with researchers, advocates, and policymakers working on AI governance.
                    If our approach <em>resonates</em>, we would love to explore how we might collaborate.
                </p>
                <div className="flex gap-4 justify-center">
                    <a href="mailto:info@resonantresearch.io" className={styles.demoBtn} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                        Get in Touch
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Georgia', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Resonant</div>
                        <p style={{ fontSize: '0.85rem' }}>A research organization focused on AI governance.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '0.85rem' }}>
                        <Link href="/ethics" style={{ color: '#A0AEC0', textDecoration: 'none' }}>Ethical Funding</Link>
                        <span>© 2026 Resonant Research</span>
                    </div>
                </div>
            </footer>

        </div>
    );
}
