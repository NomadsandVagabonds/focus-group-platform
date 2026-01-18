'use client';

import React, { useState, useCallback } from 'react';

interface Props {
    onNotesChange?: (notes: string) => void;
    initialNotes?: string;
}

export default function ModeratorNotepad({ onNotesChange, initialNotes = '' }: Props) {
    const [notes, setNotes] = useState(initialNotes);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNotes(value);
        onNotesChange?.(value);
    }, [onNotesChange]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <div style={{
                color: '#a0aec0',
                fontSize: '10px',
                textTransform: 'uppercase',
                marginBottom: '4px',
                fontWeight: 600
            }}>
                Session Notes
            </div>
            <textarea
                value={notes}
                onChange={handleChange}
                placeholder="Take notes during the session..."
                style={{
                    flex: 1,
                    width: '100%',
                    minHeight: '60px',
                    background: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    padding: '8px',
                    fontSize: '12px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.4
                }}
            />
        </div>
    );
}
