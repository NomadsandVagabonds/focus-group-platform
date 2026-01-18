'use client';

import React, { useState } from 'react';
import styles from './ModeratorScript.module.css';

interface ScriptSection {
    id: string;
    title: string;
    duration: string;
    content: string;
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

export default function ModeratorScript() {
    const [isOpen, setIsOpen] = useState(true);
    const [activeSectionId, setActiveSectionId] = useState<string | null>('intro');

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
                {DEFAULT_SCRIPT.map((section) => (
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
                ))}
            </div>
        </div>
    );
}
