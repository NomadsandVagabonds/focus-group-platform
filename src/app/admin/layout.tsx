'use client';

import AdminLayoutClient from './AdminLayoutClient';
import { Suspense } from 'react';

function LoadingFallback() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#f8fafc'
        }}>
            <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AdminLayoutClient>{children}</AdminLayoutClient>
        </Suspense>
    );
}

