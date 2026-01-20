import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSupabaseServer } from '@/lib/supabase/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
