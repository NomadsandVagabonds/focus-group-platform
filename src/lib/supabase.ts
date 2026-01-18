import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
