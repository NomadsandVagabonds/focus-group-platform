'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../admin.module.css';

interface MediaItem {
    id: string;
    filename: string;
    file_type: 'image' | 'video' | 'audio' | 'pdf' | 'other';
    display_order: number;
    url: string;
    created_at: string;
}

export default function SessionMediaPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [session, setSession] = useState<{ name: string; code: string } | null>(null);

    // Fetch session info
    useEffect(() => {
        async function fetchSession() {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setSession({ name: data.session.name, code: data.session.code });
            }
        }
        fetchSession();
    }, [sessionId]);

    // Fetch media
    const fetchMedia = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/session-media?sessionId=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setMedia(data.media || []);
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
        }
        setIsLoading(false);
    }, [sessionId]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    // Upload handler
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('sessionId', sessionId);
            formData.append('file', file);

            try {
                console.log('[MediaUpload] Uploading:', file.name);
                const res = await fetch('/api/session-media', {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    successCount++;
                    console.log('[MediaUpload] Success:', file.name);
                } else {
                    errorCount++;
                    const errData = await res.json();
                    console.error('[MediaUpload] Failed:', file.name, errData);
                }
            } catch (error) {
                errorCount++;
                console.error('[MediaUpload] Error:', error);
            }
        }

        setIsUploading(false);

        if (errorCount > 0) {
            alert(`Upload: ${successCount} succeeded, ${errorCount} failed. Check console for details.`);
        }

        fetchMedia();
        e.target.value = ''; // Reset input
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this media?')) return;
        await fetch(`/api/session-media?id=${id}`, { method: 'DELETE' });
        fetchMedia();
    };

    // Move handler
    const handleMove = async (id: string, direction: 'up' | 'down') => {
        const index = media.findIndex(m => m.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= media.length) return;

        // Swap orders
        const currentOrder = media[index].display_order;
        const targetOrder = media[newIndex].display_order;

        await Promise.all([
            fetch('/api/session-media', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaId: id, displayOrder: targetOrder }),
            }),
            fetch('/api/session-media', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaId: media[newIndex].id, displayOrder: currentOrder }),
            }),
        ]);

        fetchMedia();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'image': return '🖼️';
            case 'video': return '🎬';
            case 'audio': return '🔊';
            case 'pdf': return '📄';
            default: return '📁';
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        ← Back
                    </button>
                    <h1 className={styles.title}>
                        Session Media - {session?.name || 'Loading...'}
                    </h1>
                </div>
            </header>

            {/* Main content */}
            <main className={styles.main} style={{ padding: '24px' }}>
                {/* Upload zone */}
                <div style={{
                    background: '#F7FAFC',
                    border: '2px dashed #E2E8F0',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                    <p style={{ color: '#4A5568', marginBottom: '16px' }}>
                        Upload images, videos, audio, or PDFs for the moderator to present
                    </p>
                    <label style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        background: '#9A3324',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: isUploading ? 'wait' : 'pointer',
                        fontWeight: 500
                    }}>
                        {isUploading ? 'Uploading...' : 'Choose Files'}
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*,audio/*,.pdf"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                {/* Media list */}
                {isLoading ? (
                    <div style={{ color: '#718096', textAlign: 'center' }}>Loading media...</div>
                ) : media.length === 0 ? (
                    <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
                        No media uploaded yet. Upload files above to add them to this session.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {media.map((item, index) => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    background: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #E2E8F0'
                                }}
                            >
                                {/* Order number */}
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    background: '#9A3324',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    {index + 1}
                                </div>

                                {/* Type icon */}
                                <span style={{ fontSize: '20px' }}>{getTypeIcon(item.file_type)}</span>

                                {/* Filename */}
                                <span style={{ flex: 1, color: '#1A1A2E', fontWeight: 500 }}>
                                    {item.filename}
                                </span>

                                {/* Preview link */}
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#9A3324', fontSize: '12px' }}
                                >
                                    Preview ↗
                                </a>

                                {/* Move buttons */}
                                <button
                                    onClick={() => handleMove(item.id, 'up')}
                                    disabled={index === 0}
                                    style={{
                                        padding: '4px 8px',
                                        background: index === 0 ? '#E2E8F0' : '#4A5568',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: index === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => handleMove(item.id, 'down')}
                                    disabled={index === media.length - 1}
                                    style={{
                                        padding: '4px 8px',
                                        background: index === media.length - 1 ? '#E2E8F0' : '#4A5568',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: index === media.length - 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    ↓
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    style={{
                                        padding: '4px 8px',
                                        background: '#e53e3e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
