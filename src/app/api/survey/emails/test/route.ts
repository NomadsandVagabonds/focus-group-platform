// API Route: Send Test Email
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { createEmailService, EmailOptions } from '@/lib/email/email-service';


interface TestEmailRequest {
    surveyId: string;
    templateType: 'invitation' | 'reminder' | 'confirmation';
    testEmail: string;
    customTemplate?: {
        subject?: string;
        body?: string;
    };
}

// POST /api/survey/emails/test - Send a test email
export async function POST(request: NextRequest) {
    try {
        const body: TestEmailRequest = await request.json();
        const { surveyId, templateType, testEmail, customTemplate } = body;

        if (!surveyId) {
            return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
        }

        if (!testEmail) {
            return NextResponse.json({ error: 'testEmail is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Fetch survey details
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('id, title, description')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        // Generate test content with sample placeholders
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const testSurveyUrl = `${baseUrl}/survey/${surveyId}?token=TEST-TOKEN-EXAMPLE`;

        // Replace placeholders in custom template
        const sampleData: Record<string, string> = {
            '{FIRSTNAME}': 'John',
            '{LASTNAME}': 'Doe',
            '{EMAIL}': testEmail,
            '{TOKEN}': 'TEST-TOKEN-EXAMPLE',
            '{SURVEYURL}': testSurveyUrl,
            '{SURVEYTITLE}': survey.title,
        };

        // Default templates
        const defaultTemplates: Record<string, { subject: string; body: string }> = {
            invitation: {
                subject: `You're invited to participate in ${survey.title}`,
                body: `Dear John,

You have been invited to participate in our survey: ${survey.title}.

Please click the link below to begin:
${testSurveyUrl}

Thank you for your time.

Best regards`,
            },
            reminder: {
                subject: `Reminder: Please complete ${survey.title}`,
                body: `Dear John,

This is a friendly reminder to complete the survey: ${survey.title}.

If you haven't had a chance to complete it yet, please click the link below:
${testSurveyUrl}

Thank you for your participation.

Best regards`,
            },
            confirmation: {
                subject: `Thank you for completing ${survey.title}`,
                body: `Dear John,

Thank you for completing our survey: ${survey.title}.

Your response has been recorded.

Best regards`,
            },
        };

        // Use custom template if provided, otherwise use default
        let emailSubject = customTemplate?.subject || defaultTemplates[templateType].subject;
        let emailBody = customTemplate?.body || defaultTemplates[templateType].body;

        // Replace placeholders
        for (const [placeholder, value] of Object.entries(sampleData)) {
            emailSubject = emailSubject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            emailBody = emailBody.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        }

        // Convert plain text body to simple HTML
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f5f3ef; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { color: #1a1d24; margin: 0; font-size: 20px; }
                    .content { padding: 20px; background: white; white-space: pre-wrap; }
                    .footer { padding: 15px; text-align: center; font-size: 11px; color: #666; background: #f5f3ef; border-radius: 0 0 8px 8px; }
                    .test-banner { background: #fef3cd; border: 1px solid #f0ad4e; color: #856404; padding: 10px; text-align: center; font-weight: bold; margin-bottom: 15px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="test-banner">TEST EMAIL - This is a preview of your email template</div>
                    <div class="header">
                        <h1>${survey.title}</h1>
                    </div>
                    <div class="content">${emailBody}</div>
                    <div class="footer">
                        <p>This email was sent by Resonant Surveys</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send the test email
        const emailService = createEmailService();
        const emailOptions: EmailOptions = {
            to: testEmail,
            subject: `[TEST] ${emailSubject}`,
            html: htmlBody,
            text: `[TEST EMAIL]\n\n${emailBody}`,
        };

        const result = await emailService.send(emailOptions);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send test email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
        });
    } catch (error: any) {
        console.error('Error sending test email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
