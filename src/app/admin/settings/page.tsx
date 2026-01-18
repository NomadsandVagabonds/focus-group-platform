'use client';

import React from 'react';
import styles from '../admin.module.css';

export default function SettingsPage() {
    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Settings</h1>
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Account Settings</h2>
                <div className={styles.emptyState} style={{ padding: '24px' }}>
                    <p>Account settings and preferences will be available here once authentication is implemented.</p>
                </div>
            </div>
        </>
    );
}
