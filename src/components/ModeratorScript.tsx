'use client';

import React, { useState, useEffect } from 'react';
import styles from './ModeratorScript.module.css';

interface ScriptSection {
    id: string;
    title: string;
    duration: string;
    content: string;
}

interface ModeratorScriptProps {
    sessionId?: string;
}

const DEFAULT_SCRIPT: ScriptSection[] = [
    {
        id: 'intro',
        title: '1. Introduction',
        duration: '2 min',
        content: "Hi everyone, thank you for joining today. My name is [Name] and I'll be moderating our discussion.\n\nWe're here to talk about [Topic]. There are no right or wrong answers, just your honest opinions."
    },
    {
        id: 'privacy',
        title: '2. Privacy & Consent',
        duration: '1 min',
        content: "This session is being recorded for research purposes. Your identities will be kept confidential in our reports.\n\nBy staying in the session, you consent to this recording."
    },
    {
        id: 'warmup',
        title: '3. Warm-up',
        duration: '5 min',
        content: "Let's go around the room. Please state your first name and one interesting thing you did this weekend."
    },
    {
        id: 'topic_1',
        title: '4. AI Familiarity',
        duration: '10 min',
        content: "Q1: When you hear the term 'Artificial Intelligence', what is the first word that comes to mind?\n\nQ2: Do you use any AI tools in your daily life?"
    },
    {
        id: 'topic_2',
        title: '5. Governance Perspectives',
        duration: '15 min',
        content: "We're going to show you a video shortly. Before we do, I want to ask: Who do you think should be responsible for making AI safe?\n\n- Government?\n- Companies?\n- International bodies?"
    },
    {
        id: 'closing',
        title: '6. Closing',
        duration: '2 min',
        content: "That wraps up our time. Thank you so much for sharing your perspectives.\n\nPlease check your email for the incentive processing link."
    }
];

export default function ModeratorScript({ sessionId }: ModeratorScriptProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeSectionId, setActiveSectionId] = useState<string | null>('intro');
    const [sections, setSections] = useState<ScriptSection[]>(DEFAULT_SCRIPT);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch script from API if sessionId is provided
    useEffect(() => {
        if (!sessionId) return;

        async function fetchScript() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/session-scripts?sessionId=${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.sections && data.sections.length > 0) {
                        // Transform from API format
                        const loadedSections = data.sections.map((s: {
                            section_id: string;
                            title: string;
                            estimated_minutes: number;
                            content: string;
                        }) => ({
                            id: s.section_id,
                            title: s.title,
                            duration: `${s.estimated_minutes} min`,
                            content: s.content || '',
                        }));
                        setSections(loadedSections);
                        // Set first section as active
                        if (loadedSections.length > 0) {
                            setActiveSectionId(loadedSections[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error('[ModeratorScript] Failed to fetch:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchScript();
    }, [sessionId]);

    return (
        <div className={`${styles.container} ${isOpen ? '' : styles.collapsed}`}>
            {/* Toggle Button */}
            <button
                className={styles.toggleBtn}
                onClick={() => setIsOpen(!isOpen)}
                title={isOpen ? "Hide Script" : "Show Script"}
            >
                {isOpen ? '←' : '→'}
            </button>

            {/* Header */}
            <div className={styles.header}>
                <span className={styles.title}>Moderator Script</span>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        Loading script...
                    </div>
                ) : (
                    sections.map((section) => (
                        <div
                            key={section.id}
                            className={`${styles.section} ${activeSectionId === section.id ? styles.active : ''}`}
                            onClick={() => setActiveSectionId(section.id)}
                        >
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>{section.title}</span>
                                <span className={styles.duration}>{section.duration}</span>
                            </div>
                            {activeSectionId === section.id && (
                                <div className={styles.sectionBody}>
                                    {section.content}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
