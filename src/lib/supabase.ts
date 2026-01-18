import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to handle build-time when env vars may not be available
let _supabase: SupabaseClient | null = null;

export const supabase = (() => {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            // Return a mock client during build time that won't be used
            console.warn('Supabase credentials not found - using placeholder during build');
            return createClient('https://placeholder.supabase.co', 'placeholder-key');
        }

        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
})();

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
