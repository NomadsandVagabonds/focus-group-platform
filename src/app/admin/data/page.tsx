'use client';

import React from 'react';
import styles from '../admin.module.css';

export default function DataPage() {
    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Data</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.emptyState}>
                    <h3>Session Data & Analytics</h3>
                    <p>Aggregated rating data from completed sessions will appear here.</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Features coming soon:
                    </p>
                    <ul style={{
                        textAlign: 'left',
                        display: 'inline-block',
                        color: '#718096',
                        fontSize: '14px',
                        marginTop: '12px'
                    }}>
                        <li>Rating averages per participant</li>
                        <li>Rating timelines with charts</li>
                        <li>Export to CSV</li>
                        <li>Session comparison</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
