'use client';

import React, { useMemo } from 'react';

interface TranscriptWord {
    word: string;
    start: number;  // seconds
    end: number;    // seconds
}

interface SliderEvent {
    participantId: string;
    value: number;
    timestamp: number;
    sessionMs: number;
}

interface Props {
    words: TranscriptWord[];
    events: SliderEvent[];
    windowSeconds?: number;  // How many seconds before/after word to analyze
    onWordClick?: (word: TranscriptWord, reactionScore: number) => void;
}

interface WordReaction {
    word: string;
    count: number;
    avgReaction: number;  // Positive = perception increased, negative = decreased
    instances: Array<{
        timestamp: number;
        reaction: number;
    }>;
}

/**
 * Word Reaction Map - Shows which words triggered positive or negative reactions
 * by correlating transcript timestamps with perception slider data.
 */
export default function WordReactionMap({
    words,
    events,
    windowSeconds = 5,
    onWordClick
}: Props) {

    // Calculate reaction score for each unique word
    const wordReactions = useMemo(() => {
        if (!words?.length || !events?.length) return [];

        const reactionMap = new Map<string, WordReaction>();

        words.forEach(wordData => {
            const wordLower = wordData.word.toLowerCase().replace(/[^a-z]/g, '');
            if (!wordLower || wordLower.length < 2) return;  // Skip punctuation and single chars

            const wordTimeMs = wordData.start * 1000;
            const windowMs = windowSeconds * 1000;

            // Get perception values BEFORE the word (baseline)
            const beforeEvents = events.filter(e =>
                e.sessionMs >= wordTimeMs - windowMs &&
                e.sessionMs < wordTimeMs
            );

            // Get perception values AFTER the word (reaction)
            const afterEvents = events.filter(e =>
                e.sessionMs >= wordTimeMs &&
                e.sessionMs <= wordTimeMs + windowMs
            );

            if (beforeEvents.length === 0 || afterEvents.length === 0) return;

            const avgBefore = beforeEvents.reduce((sum, e) => sum + e.value, 0) / beforeEvents.length;
            const avgAfter = afterEvents.reduce((sum, e) => sum + e.value, 0) / afterEvents.length;
            const reaction = avgAfter - avgBefore;  // Positive = increased, negative = decreased

            // Aggregate by word
            const existing = reactionMap.get(wordLower);
            if (existing) {
                existing.count++;
                existing.avgReaction = (existing.avgReaction * (existing.count - 1) + reaction) / existing.count;
                existing.instances.push({ timestamp: wordData.start, reaction });
            } else {
                reactionMap.set(wordLower, {
                    word: wordLower,
                    count: 1,
                    avgReaction: reaction,
                    instances: [{ timestamp: wordData.start, reaction }]
                });
            }
        });

        // Convert to array and sort by absolute reaction strength
        return Array.from(reactionMap.values())
            .filter(w => Math.abs(w.avgReaction) > 1)  // Only show words with measurable impact
            .sort((a, b) => Math.abs(b.avgReaction) - Math.abs(a.avgReaction));
    }, [words, events, windowSeconds]);

    if (wordReactions.length === 0) {
        return (
            <div style={{
                padding: '20px',
                background: '#F7FAFC',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#718096',
                border: '1px solid #E2E8F0'
            }}>
                Not enough data for word-reaction analysis. Need transcript and perception data.
            </div>
        );
    }

    // Find max reaction for scaling
    const maxReaction = Math.max(...wordReactions.map(w => Math.abs(w.avgReaction)));

    // Get reaction color
    const getColor = (reaction: number) => {
        if (reaction > 5) return '#22c55e';      // Strong positive - green
        if (reaction > 2) return '#86efac';      // Mild positive - light green
        if (reaction < -5) return '#ef4444';     // Strong negative - red
        if (reaction < -2) return '#fca5a5';     // Mild negative - light red
        return '#94a3b8';                        // Neutral - gray
    };

    // Get font size based on reaction magnitude
    const getFontSize = (reaction: number) => {
        const magnitude = Math.abs(reaction) / maxReaction;
        return 12 + magnitude * 20;  // 12px to 32px
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#9A3324', marginBottom: '12px', fontSize: '1rem', fontWeight: 600 }}>
                Word Reaction Map
            </h3>
            <p style={{ color: '#718096', fontSize: '12px', marginBottom: '16px' }}>
                Words sized by impact strength. 🟢 Green = positive reaction, 🔴 Red = negative reaction
            </p>

            {/* Word cloud container */}
            <div style={{
                background: '#1A1A2E',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px'
            }}>
                {wordReactions.slice(0, 30).map((wordData, index) => (
                    <span
                        key={`${wordData.word}-${index}`}
                        onClick={() => onWordClick?.(words.find(w =>
                            w.word.toLowerCase().includes(wordData.word)
                        )!, wordData.avgReaction)}
                        style={{
                            color: getColor(wordData.avgReaction),
                            fontSize: `${getFontSize(wordData.avgReaction)}px`,
                            fontWeight: Math.abs(wordData.avgReaction) > 5 ? 700 : 500,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            transition: 'transform 0.2s, background 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        title={`"${wordData.word}" → ${wordData.avgReaction > 0 ? '+' : ''}${wordData.avgReaction.toFixed(1)}% reaction`}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        {wordData.word}
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>
                            {wordData.avgReaction > 0 ? '▲' : '▼'}
                            {Math.abs(wordData.avgReaction).toFixed(0)}
                        </span>
                    </span>
                ))}
            </div>

            {/* Top positive/negative words table */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginTop: '16px'
            }}>
                {/* Positive words */}
                <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                    <div style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                        🟢 Top Positive Reactions
                    </div>
                    {wordReactions
                        .filter(w => w.avgReaction > 0)
                        .slice(0, 5)
                        .map((w, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                padding: '4px 0',
                                color: '#1A1A2E'
                            }}>
                                <span>"{w.word}"</span>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                    +{w.avgReaction.toFixed(1)}%
                                </span>
                            </div>
                        ))
                    }
                </div>

                {/* Negative words */}
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                    <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                        🔴 Top Negative Reactions
                    </div>
                    {wordReactions
                        .filter(w => w.avgReaction < 0)
                        .slice(0, 5)
                        .map((w, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                padding: '4px 0',
                                color: '#1A1A2E'
                            }}>
                                <span>"{w.word}"</span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                    {w.avgReaction.toFixed(1)}%
                                </span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
