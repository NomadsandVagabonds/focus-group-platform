// API Route: Survey Quotas
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Quota {
    id: string;
    survey_id: string;
    name: string;
    description?: string;
    limit: number;
    current_count: number;
    action: 'screenout' | 'stop' | 'redirect';
    redirect_url?: string;
    conditions: QuotaCondition[];
    is_active: boolean;
    created_at: string;
}

export interface QuotaCondition {
    question_code: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater' | 'less';
    value: string | string[];
}

// GET /api/survey/quotas?surveyId=xxx - Get quotas for a survey
export async function GET(request: NextRequest) {
    try {
        const surveyId = request.nextUrl.searchParams.get('surveyId');

        if (!surveyId) {
            return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
        }

        const { data: quotas, error } = await supabase
            .from('survey_quotas')
            .select('*')
            .eq('survey_id', surveyId)
            .order('created_at', { ascending: true });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ quotas: [] });
            }
            throw error;
        }

        return NextResponse.json({ quotas: quotas || [] });
    } catch (error: any) {
        console.error('Error fetching quotas:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/survey/quotas - Create a new quota
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { surveyId, name, description, limit, action, redirectUrl, conditions } = body;

        if (!surveyId || !name || !limit) {
            return NextResponse.json(
                { error: 'surveyId, name, and limit are required' },
                { status: 400 }
            );
        }

        const { data: quota, error } = await supabase
            .from('survey_quotas')
            .insert({
                survey_id: surveyId,
                name,
                description: description || '',
                limit: parseInt(limit),
                current_count: 0,
                action: action || 'screenout',
                redirect_url: redirectUrl || null,
                conditions: conditions || [],
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'Quotas table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        return NextResponse.json({ quota }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating quota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
