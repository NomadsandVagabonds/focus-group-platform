// API Route: Reorder Questions
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function PATCH(request: NextRequest) {
    try {
        const { surveyId, groupId, questionIds } = await request.json();

        if (!surveyId || !groupId || !Array.isArray(questionIds)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServer();

        // Update order_index for each question
        const updates = questionIds.map((questionId, index) => {
            return supabase
                .from('questions')
                .update({ order_index: index })
                .eq('id', questionId)
                .eq('group_id', groupId);
        });

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering questions:', error);
        return NextResponse.json(
            { error: 'Failed to reorder questions' },
            { status: 500 }
        );
    }
}
