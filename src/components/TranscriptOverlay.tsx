'use client';

import React from 'react';

interface TranscriptWord {
    word: string;
    start: number;  // seconds
    end: number;    // seconds
}

interface Props {
    words: TranscriptWord[];
    currentTimeSeconds: number;
}

/**
 * Karaoke-style transcript overlay.
 * Words turn from gray → yellow as video plays.
 */
export default function TranscriptOverlay({ words, currentTimeSeconds }: Props) {
    if (!words || words.length === 0) {
        return null;
    }

    return (
        <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            padding: '12px 16px',
            maxHeight: '120px',
            overflowY: 'auto',
            lineHeight: 1.7,
        }}>
            {words.map((word, index) => {
                // Determine if word has been spoken
                const isSpoken = currentTimeSeconds >= word.start;
                const isCurrent = currentTimeSeconds >= word.start && currentTimeSeconds < word.end;

                return (
                    <span
                        key={index}
                        style={{
                            color: isSpoken ? '#facc15' : 'rgba(255, 255, 255, 0.4)',
                            fontWeight: isCurrent ? 700 : 400,
                            fontSize: isCurrent ? '1.1rem' : '1rem',
                            transition: 'color 0.1s ease, font-weight 0.1s ease',
                            marginRight: '4px',
                            display: 'inline',
                        }}
                    >
                        {word.word}
                    </span>
                );
            })}
        </div>
    );
}
