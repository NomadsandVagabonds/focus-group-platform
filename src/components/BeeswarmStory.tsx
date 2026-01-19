'use client';

import React, { useState, useEffect, useRef } from 'react';

// Concern type colors (matching the Sankey)
const concernColors: Record<string, string> = {
    'Human Abilities': '#4a6fa5',
    'Misinformation': '#7c6a9c',
    'Loss of Control': '#a63d40',
    'Scams & Hacking': '#5a8f7b',
    'Job Loss': '#b8860b',
    'Distrust': '#8b6b61'
};

// Generate mock respondent data with different concern types
function generateRespondents(count: number) {
    const concerns = Object.keys(concernColors);

    return Array.from({ length: count }, (_, i) => {
        const concern = concerns[Math.floor(Math.random() * concerns.length)];
        return {
            id: i,
            concern,
            baseX: Math.random(),
            baseY: Math.random(),
        };
    });
}

// Storytelling steps
const steps = [
    {
        mode: 'scattered',
        title: 'A Fragmented Landscape',
        text: 'Americans are concerned about AI — but they worry about very different things. Some fear job loss. Others worry about misinformation. Many distrust the companies building these systems.',
    },
    {
        mode: 'by-concern',
        title: 'Grouped by Concern',
        text: 'When we cluster respondents by their primary concern, the fragmentation becomes clear. Each color represents a different type of worry — and each group needs different messaging.',
    },
    {
        mode: 'polarized',
        title: 'Traditional Messaging Divides',
        text: 'Partisan framing pushes these groups apart. When AI safety becomes a political football, potential allies disengage or actively resist.',
    },
    {
        mode: 'united',
        title: 'Common Ground Unites',
        text: 'However, these different groups still overwhelmingly agree on common-sense AI policy solutions. For example, 80% of Americans across all concern types agree that AI systems should be tested for safety before public release. Common-sense policy builds durable coalitions.',
    }
];

export default function BeeswarmStory() {
    const [respondents] = useState(() => generateRespondents(150));
    const [currentStep, setCurrentStep] = useState(0);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize positions
    useEffect(() => {
        const initial = respondents.map(() => ({
            x: 0.5 + (Math.random() - 0.5) * 0.6,
            y: 0.5 + (Math.random() - 0.5) * 0.6
        }));
        setPositions(initial);
    }, [respondents]);

    // Update positions when step changes
    useEffect(() => {
        const mode = steps[currentStep].mode;
        const concerns = Object.keys(concernColors);

        setPositions(respondents.map((r) => {
            switch (mode) {
                case 'scattered':
                    return {
                        x: 0.15 + r.baseX * 0.7,
                        y: 0.15 + r.baseY * 0.7
                    };
                case 'by-concern':
                    const concernIdx = concerns.indexOf(r.concern);
                    const col = concernIdx % 3;
                    const row = Math.floor(concernIdx / 3);
                    return {
                        x: 0.2 + col * 0.3 + (Math.random() - 0.5) * 0.12,
                        y: 0.3 + row * 0.4 + (Math.random() - 0.5) * 0.15
                    };
                case 'polarized':
                    const isPolarizedLeft = concerns.indexOf(r.concern) < 3;
                    return {
                        x: isPolarizedLeft ? 0.25 + (Math.random() - 0.5) * 0.2 : 0.75 + (Math.random() - 0.5) * 0.2,
                        y: 0.3 + Math.random() * 0.4
                    };
                case 'united':
                    // 80% inside the circle, 20% outside (holdouts)
                    const isHoldout = Math.random() > 0.8;
                    if (isHoldout) {
                        // Scatter these outside the main cluster
                        return {
                            x: Math.random() < 0.5 ? 0.15 + Math.random() * 0.15 : 0.7 + Math.random() * 0.15,
                            y: 0.2 + Math.random() * 0.6
                        };
                    }
                    return {
                        x: 0.5 + (Math.random() - 0.5) * 0.25,
                        y: 0.5 + (Math.random() - 0.5) * 0.25
                    };
                default:
                    return { x: 0.5, y: 0.5 };
            }
        }));
    }, [currentStep, respondents]);

    // Intersection Observer for scroll-triggered storytelling
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = stepRefs.current.indexOf(entry.target as HTMLDivElement);
                        if (index !== -1) {
                            setCurrentStep(index);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        stepRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div>
            {/* Scrollytelling Container - Key: display flex, no overflow hidden */}
            <div style={{
                position: 'relative',
                display: 'flex',
                background: '#f5f3ef'
            }}>
                {/* Sticky Graphic - 55% width, 100vh, position sticky */}
                <div style={{
                    position: 'sticky',
                    top: 80,
                    width: '55%',
                    height: 'calc(100vh - 80px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingTop: '2rem',
                    paddingLeft: '2rem',
                    paddingRight: '2rem'
                }}>
                    {/* Section Header - Inside sticky so it stays in frame */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.4rem',
                            color: '#1A1A2E',
                            marginBottom: '0.5rem'
                        }}>
                            From Fragmentation to Coalition
                        </h3>
                        <p style={{ color: '#4A5568', fontSize: '0.95rem', maxWidth: 500 }}>
                            How we find common ground across different AI concerns
                        </p>
                    </div>

                    <div style={{
                        width: '100%',
                        maxWidth: 500,
                        background: 'linear-gradient(180deg, #faf9f6 0%, #f5f3ef 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                    }}>
                        {/* Step indicator */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 8,
                            marginBottom: 16
                        }}>
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: currentStep === i ? '#9A3324' : '#E2E8F0',
                                        transition: 'background 0.3s'
                                    }}
                                />
                            ))}
                        </div>

                        {/* SVG Beeswarm */}
                        <svg
                            viewBox="0 0 400 280"
                            style={{ width: '100%', height: 280 }}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {/* Center marker for "united" state */}
                            {currentStep === 3 && (
                                <circle
                                    cx="200"
                                    cy="140"
                                    r="60"
                                    fill="none"
                                    stroke="#2d8a4e"
                                    strokeWidth="2"
                                    strokeDasharray="6,4"
                                    opacity="0.4"
                                />
                            )}

                            {/* Respondent dots */}
                            {positions.map((pos, i) => (
                                <circle
                                    key={i}
                                    cx={pos.x * 400}
                                    cy={pos.y * 280}
                                    r={4}
                                    fill={concernColors[respondents[i].concern]}
                                    opacity={0.75}
                                    style={{
                                        transition: 'cx 0.8s ease-out, cy 0.8s ease-out'
                                    }}
                                />
                            ))}

                            {/* Coalition label */}
                            {currentStep === 3 && (
                                <text
                                    x="200"
                                    y="240"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#2d8a4e"
                                >
                                    80% agree on safety testing
                                </text>
                            )}
                        </svg>

                        {/* Legend */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '8px 16px',
                            marginTop: '12px',
                            fontSize: '0.7rem',
                            color: '#666'
                        }}>
                            {Object.entries(concernColors).map(([concern, color]) => (
                                <span key={concern} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: color
                                    }} />
                                    {concern}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrolling Text - 45% width */}
                <div style={{
                    width: '45%',
                    padding: '4rem 3rem'
                }}>
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            ref={el => { stepRefs.current[i] = el; }}
                            style={{
                                minHeight: i === steps.length - 1 ? '80vh' : '50vh',
                                marginBottom: i === steps.length - 1 ? '40vh' : 0,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '1rem 0',
                                opacity: currentStep === i ? 1 : 0.25,
                                transition: 'opacity 0.5s ease'
                            }}
                        >
                            <div style={{
                                padding: '24px',
                                background: currentStep === i ? 'white' : 'transparent',
                                borderRadius: '12px',
                                border: currentStep === i ? '1px solid rgba(154,51,36,0.15)' : '1px solid transparent',
                                boxShadow: currentStep === i ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: currentStep === i ? '#9A3324' : '#E2E8F0',
                                    color: currentStep === i ? 'white' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    marginBottom: '16px',
                                    transition: 'all 0.3s'
                                }}>
                                    {i + 1}
                                </div>
                                <h4 style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '1.4rem',
                                    color: '#1A1A2E',
                                    marginBottom: '12px',
                                    lineHeight: 1.3
                                }}>
                                    {step.title}
                                </h4>
                                <p style={{
                                    fontSize: '1.1rem',
                                    lineHeight: 1.7,
                                    color: '#4A5568'
                                }}>
                                    {step.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
