'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedesignRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#4A5568'
        }}>
            Redirecting...
        </div>
    );
}
