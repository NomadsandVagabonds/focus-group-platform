// API Route: Survey Emails - Send survey invitations and reminders
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { createEmailService, emailTemplates, EmailOptions } from '@/lib/email/email-service';


interface EmailRequest {
    surveyId: string;
    type: 'invitation' | 'reminder' | 'completion';
    tokenIds?: string[];
    customSubject?: string;
    customMessage?: string;
}

// POST /api/survey/emails - Send emails to token holders
export async function POST(request: NextRequest) {
    try {
        const body: EmailRequest = await request.json();
        const {
            surveyId,
            type,
            tokenIds,
            customSubject,
            customMessage,
        } = body;

        if (!surveyId) {
            return NextResponse.json(
                { error: 'surveyId is required' },
                { status: 400 }
            );
        }

        // Fetch survey details
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('id, title, description, settings')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            );
        }

        // Fetch tokens to email
        let query = supabase
            .from('survey_tokens')
            .select('*')
            .eq('survey_id', surveyId)
            .not('email', 'is', null);

        if (tokenIds && tokenIds.length > 0) {
            query = query.in('id', tokenIds);
        } else if (type === 'invitation') {
            // For invitations, only send to unused tokens
            query = query.eq('status', 'unused');
        } else if (type === 'reminder') {
            // For reminders, send to unused tokens that haven't been emailed recently
            query = query.eq('status', 'unused');
        }

        const { data: tokens, error: tokensError } = await query;

        if (tokensError) {
            throw tokensError;
        }

        if (!tokens || tokens.length === 0) {
            return NextResponse.json(
                { error: 'No eligible tokens found' },
                { status: 400 }
            );
        }

        // Generate survey URL base
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Send emails
        const emailService = createEmailService();
        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const token of tokens) {
            try {
                const surveyUrl = `${baseUrl}/survey/${surveyId}?token=${token.token}`;

                let emailContent;
                switch (type) {
                    case 'invitation':
                        emailContent = emailTemplates.surveyInvitation({
                            surveyTitle: survey.title,
                            surveyUrl,
                            message: customMessage,
                        });
                        break;
                    case 'reminder':
                        emailContent = emailTemplates.surveyReminder({
                            surveyTitle: survey.title,
                            surveyUrl,
                            daysRemaining: token.expires_at
                                ? Math.ceil((new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                : undefined,
                        });
                        break;
                    case 'completion':
                        emailContent = emailTemplates.surveyComplete({
                            surveyTitle: survey.title,
                        });
                        break;
                    default:
                        throw new Error(`Unknown email type: ${type}`);
                }

                const emailOptions: EmailOptions = {
                    to: token.email,
                    subject: customSubject || emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text,
                };

                const result = await emailService.send(emailOptions);

                if (result.success) {
                    results.sent++;

                    // Update token metadata to track email sent
                    await supabase
                        .from('survey_tokens')
                        .update({
                            metadata: {
                                ...token.metadata,
                                [`${type}_sent_at`]: new Date().toISOString(),
                                [`${type}_message_id`]: result.messageId,
                            },
                        })
                        .eq('id', token.id);
                } else {
                    results.failed++;
                    results.errors.push(`${token.email}: ${result.error}`);
                }
            } catch (emailError: any) {
                results.failed++;
                results.errors.push(`${token.email}: ${emailError.message}`);
            }
        }

        // Log email batch (ignore errors if table doesn't exist)
        try {
            await getSupabaseServer().from('email_logs').insert({
                survey_id: surveyId,
                type,
                total_recipients: tokens.length,
                sent_count: results.sent,
                failed_count: results.failed,
                errors: results.errors.length > 0 ? results.errors : null,
                created_at: new Date().toISOString(),
            });
        } catch {
            // Ignore if email_logs table doesn't exist
        }

        return NextResponse.json({
            success: true,
            results,
        });
    } catch (error: any) {
        console.error('Error sending emails:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/survey/emails?surveyId=xxx - Get email sending history
export async function GET(request: NextRequest) {
    try {
        const surveyId = request.nextUrl.searchParams.get('surveyId');

        if (!surveyId) {
            return NextResponse.json(
                { error: 'surveyId is required' },
                { status: 400 }
            );
        }

        const { data: logs, error } = await supabase
            .from('email_logs')
            .select('*')
            .eq('survey_id', surveyId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ logs: [] });
            }
            throw error;
        }

        return NextResponse.json({ logs: logs || [] });
    } catch (error: any) {
        console.error('Error fetching email logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
