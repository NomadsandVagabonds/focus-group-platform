'use client';

import React, { useState, useEffect } from 'react';
import { MediaVideo, Search } from 'iconoir-react';

interface TranscriptSegment {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
}

interface TranscriptData {
    id: string;
    transcript_text: string;
    segments: TranscriptSegment[];
    duration: number;
    language: string;
}

interface Props {
    sessionId: string;
}

export default function SessionTranscript({ sessionId }: Props) {
    const [transcript, setTranscript] = useState<TranscriptData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFullText, setShowFullText] = useState(false);

    useEffect(() => {
        fetchTranscript();
    }, [sessionId]);

    const fetchTranscript = async () => {
        try {
            const res = await fetch(`/api/transcribe?sessionId=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setTranscript(data.transcription);
            } else if (res.status === 404) {
                setError('No transcript available. Start a recording first.');
            } else {
                setError('Failed to load transcript');
            }
        } catch (err) {
            setError('Failed to load transcript');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const downloadTranscript = (format: 'txt' | 'srt') => {
        if (!transcript) return;

        let content = '';
        const filename = `transcript-${sessionId}`;

        if (format === 'txt') {
            // Plain text format
            content = transcript.transcript_text;
        } else if (format === 'srt') {
            // SRT subtitle format
            transcript.segments?.forEach((seg, i) => {
                const startTime = formatSrtTime(seg.start);
                const endTime = formatSrtTime(seg.end);
                content += `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n\n`;
            });
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatSrtTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };

    // Search functionality
    const filteredSegments = transcript?.segments?.filter(seg =>
        searchQuery ? seg.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
    ) || [];

    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} style={{ background: '#facc15', color: '#1a1a2e', padding: '0 2px', borderRadius: '2px' }}>
                    {part}
                </mark>
            ) : part
        );
    };

    if (isLoading) {
        return <div style={{ color: '#718096', padding: '20px' }}>Loading transcript...</div>;
    }

    if (error) {
        return (
            <div style={{ color: '#718096', padding: '20px', textAlign: 'center' }}>
                <p>{error}</p>
            </div>
        );
    }

    if (!transcript) return null;

    return (
        <div>
            {/* Header with search and download */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#718096' }}>
                        Duration: {formatTime(transcript.duration || 0)} • Language: {transcript.language || 'en'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => downloadTranscript('txt')}
                        style={{
                            padding: '6px 12px',
                            background: '#9A3324',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        📄 Download TXT
                    </button>
                    <button
                        onClick={() => downloadTranscript('srt')}
                        style={{
                            padding: '6px 12px',
                            background: '#4A5568',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MediaVideo width={12} height={12} /> Download SRT</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transcript..."
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                />
                {searchQuery && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                        Found {filteredSegments.length} segment{filteredSegments.length !== 1 ? 's' : ''} containing &quot;{searchQuery}&quot;
                    </div>
                )}
            </div>

            {/* Toggle full text vs segments */}
            <div style={{ marginBottom: '12px' }}>
                <button
                    onClick={() => setShowFullText(!showFullText)}
                    style={{
                        padding: '4px 10px',
                        background: showFullText ? '#9A3324' : '#EDF2F7',
                        color: showFullText ? 'white' : '#4A5568',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '8px'
                    }}
                >
                    Full Text
                </button>
                <button
                    onClick={() => setShowFullText(false)}
                    style={{
                        padding: '4px 10px',
                        background: !showFullText ? '#9A3324' : '#EDF2F7',
                        color: !showFullText ? 'white' : '#4A5568',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    By Segment
                </button>
            </div>

            {/* Content */}
            <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                background: '#F7FAFC',
                borderRadius: '8px',
                padding: '16px'
            }}>
                {showFullText ? (
                    <div style={{ lineHeight: 1.8, fontSize: '14px', color: '#2D3748' }}>
                        {highlightText(transcript.transcript_text)}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredSegments.map((seg, i) => (
                            <div
                                key={seg.id || i}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    background: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #E2E8F0'
                                }}
                            >
                                <span style={{
                                    fontSize: '11px',
                                    color: '#9A3324',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'nowrap',
                                    minWidth: '50px'
                                }}>
                                    {formatTime(seg.start)}
                                </span>
                                <span style={{ fontSize: '14px', color: '#2D3748', lineHeight: 1.5 }}>
                                    {highlightText(seg.text)}
                                </span>
                            </div>
                        ))}
                        {filteredSegments.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
                                No segments match your search.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
