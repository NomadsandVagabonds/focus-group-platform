// Client-side redirect to avoid potential server-side redirect issues
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SurveyIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/admin/surveys');
    }, [router]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Redirecting to admin dashboard...</p>
        </div>
    );
}
