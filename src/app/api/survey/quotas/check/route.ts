// API Route: Check Quota Status for a Response
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface QuotaCondition {
    question_code: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater' | 'less';
    value: string | string[];
}

interface QuotaCheckResult {
    quotaId: string;
    quotaName: string;
    isFull: boolean;
    action: 'screenout' | 'stop' | 'redirect';
    redirectUrl?: string;
    currentCount: number;
    limit: number;
}

// POST /api/survey/quotas/check - Check if any quota is full based on response data
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { surveyId, responseData } = body;

        if (!surveyId || !responseData) {
            return NextResponse.json(
                { error: 'surveyId and responseData are required' },
                { status: 400 }
            );
        }

        // Fetch all active quotas for this survey
        const { data: quotas, error } = await getSupabaseServer()
            .from('survey_quotas')
            .select('*')
            .eq('survey_id', surveyId)
            .eq('is_active', true);

        if (error) {
            if (error.code === '42P01') {
                // Table doesn't exist, no quotas to check
                return NextResponse.json({ fullQuotas: [], allClear: true });
            }
            throw error;
        }

        if (!quotas || quotas.length === 0) {
            return NextResponse.json({ fullQuotas: [], allClear: true });
        }

        const fullQuotas: QuotaCheckResult[] = [];

        // Check each quota
        for (const quota of quotas) {
            // Check if conditions match
            const conditionsMatch = checkConditions(quota.conditions, responseData);

            if (conditionsMatch) {
                // Check if quota is full
                if (quota.current_count >= quota.limit) {
                    fullQuotas.push({
                        quotaId: quota.id,
                        quotaName: quota.name,
                        isFull: true,
                        action: quota.action,
                        redirectUrl: quota.redirect_url,
                        currentCount: quota.current_count,
                        limit: quota.limit,
                    });
                }
            }
        }

        return NextResponse.json({
            fullQuotas,
            allClear: fullQuotas.length === 0,
            matchingQuotas: quotas.filter(q =>
                checkConditions(q.conditions, responseData)
            ).map(q => ({
                id: q.id,
                name: q.name,
                currentCount: q.current_count,
                limit: q.limit,
                percentFull: q.limit > 0 ? Math.round((q.current_count / q.limit) * 100) : 0,
            })),
        });
    } catch (error: any) {
        console.error('Error checking quotas:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function checkConditions(
    conditions: QuotaCondition[] | null,
    responseData: Record<string, any>
): boolean {
    if (!conditions || conditions.length === 0) {
        // No conditions means quota applies to all responses
        return true;
    }

    // All conditions must match (AND logic)
    return conditions.every(condition => {
        const responseValue = responseData[condition.question_code];

        if (responseValue === undefined || responseValue === null) {
            return false;
        }

        switch (condition.operator) {
            case 'equals':
                return String(responseValue) === String(condition.value);

            case 'not_equals':
                return String(responseValue) !== String(condition.value);

            case 'in':
                if (Array.isArray(condition.value)) {
                    return condition.value.includes(String(responseValue));
                }
                return false;

            case 'not_in':
                if (Array.isArray(condition.value)) {
                    return !condition.value.includes(String(responseValue));
                }
                return true;

            case 'greater':
                return Number(responseValue) > Number(condition.value);

            case 'less':
                return Number(responseValue) < Number(condition.value);

            default:
                return false;
        }
    });
}
