import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to handle build-time when env vars may not be available
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (_supabase) return _supabase;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // During build time, return a placeholder that won't be used for actual requests
        console.warn('Supabase credentials not found - using placeholder during build');
        return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey);
    return _supabase;
}

// Export as a getter so it's evaluated at runtime, not import time
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        const client = getSupabaseClient();
        return (client as unknown as Record<string, unknown>)[prop as string];
    }
});

// Type definitions for our tables
export interface Session {
    id: string;
    name: string;
    code: string;
    status: 'scheduled' | 'live' | 'completed';
    moderator_notes?: string;
    scheduled_at?: string;
    created_at: string;
}

export interface Participant {
    id: string;
    session_id: string;
    code: string;
    display_name?: string;
    email?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface Rating {
    id: string;
    session_id: string;
    participant_id: string;
    value: number;
    recorded_at: string;
}

export interface Recording {
    id: string;
    session_id: string;
    s3_url: string;
    duration_seconds?: number;
    created_at: string;
}
