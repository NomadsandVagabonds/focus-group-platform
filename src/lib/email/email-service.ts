// Email Service - Send survey invitations
// Supports multiple email providers

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface EmailProvider {
    send(options: EmailOptions): Promise<EmailResult>;
}

// Mock Email Provider (for development/testing)
class MockEmailProvider implements EmailProvider {
    async send(options: EmailOptions): Promise<EmailResult> {
        console.log('📧 Mock Email Sent:', {
            to: options.to,
            subject: options.subject,
        });
        return {
            success: true,
            messageId: `mock-${Date.now()}`,
        };
    }
}

// Resend Email Provider
class ResendEmailProvider implements EmailProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async send(options: EmailOptions): Promise<EmailResult> {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: options.from || 'Resonant Surveys <noreply@resonant.app>',
                    to: [options.to],
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                    reply_to: options.replyTo,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Failed to send email',
                };
            }

            return {
                success: true,
                messageId: data.id,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// SendGrid Email Provider
class SendGridEmailProvider implements EmailProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async send(options: EmailOptions): Promise<EmailResult> {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: options.to }] }],
                    from: { email: options.from || 'noreply@resonant.app' },
                    subject: options.subject,
                    content: [
                        { type: 'text/html', value: options.html },
                        ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
                    ],
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                return {
                    success: false,
                    error: data.errors?.[0]?.message || 'Failed to send email',
                };
            }

            return {
                success: true,
                messageId: response.headers.get('X-Message-Id') || undefined,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Email Service Factory
export function createEmailService(): EmailProvider {
    const resendKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    if (resendKey) {
        return new ResendEmailProvider(resendKey);
    }

    if (sendgridKey) {
        return new SendGridEmailProvider(sendgridKey);
    }

    // Default to mock provider
    console.warn('No email provider configured, using mock provider');
    return new MockEmailProvider();
}

// Email Templates
export const emailTemplates = {
    surveyInvitation: (params: {
        surveyTitle: string;
        surveyUrl: string;
        message?: string;
        deadline?: string;
    }) => ({
        subject: `You're invited: ${params.surveyTitle}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f5f3ef; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { color: #1a1d24; margin: 0; font-size: 24px; }
                    .content { padding: 30px; background: white; }
                    .button { display: inline-block; background: #c94a4a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${params.surveyTitle}</h1>
                    </div>
                    <div class="content">
                        <p>You've been invited to participate in a survey.</p>
                        ${params.message ? `<p>${params.message}</p>` : ''}
                        ${params.deadline ? `<p><strong>Please complete by:</strong> ${params.deadline}</p>` : ''}
                        <p style="text-align: center;">
                            <a href="${params.surveyUrl}" class="button">Take Survey</a>
                        </p>
                        <p style="font-size: 12px; color: #666;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="${params.surveyUrl}">${params.surveyUrl}</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This email was sent by Resonant Surveys</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
You're invited: ${params.surveyTitle}

You've been invited to participate in a survey.

${params.message || ''}

${params.deadline ? `Please complete by: ${params.deadline}` : ''}

Take the survey here: ${params.surveyUrl}
        `.trim(),
    }),

    surveyReminder: (params: {
        surveyTitle: string;
        surveyUrl: string;
        daysRemaining?: number;
    }) => ({
        subject: `Reminder: ${params.surveyTitle}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #fff3cd; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { color: #856404; margin: 0; font-size: 24px; }
                    .content { padding: 30px; background: white; }
                    .button { display: inline-block; background: #c94a4a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Reminder: Survey Incomplete</h1>
                    </div>
                    <div class="content">
                        <p>This is a friendly reminder that you haven't completed the survey <strong>${params.surveyTitle}</strong>.</p>
                        ${params.daysRemaining ? `<p>You have <strong>${params.daysRemaining} days</strong> remaining to complete it.</p>` : ''}
                        <p style="text-align: center;">
                            <a href="${params.surveyUrl}" class="button">Complete Survey</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This email was sent by Resonant Surveys</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Reminder: Survey Incomplete

This is a friendly reminder that you haven't completed the survey "${params.surveyTitle}".

${params.daysRemaining ? `You have ${params.daysRemaining} days remaining to complete it.` : ''}

Complete the survey here: ${params.surveyUrl}
        `.trim(),
    }),

    surveyComplete: (params: {
        surveyTitle: string;
        completionCode?: string;
    }) => ({
        subject: `Thank you for completing: ${params.surveyTitle}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #d4edda; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { color: #155724; margin: 0; font-size: 24px; }
                    .content { padding: 30px; background: white; }
                    .code-box { background: #f5f3ef; padding: 20px; text-align: center; border-radius: 4px; margin: 20px 0; }
                    .code { font-size: 24px; font-family: monospace; color: #1a1d24; letter-spacing: 2px; }
                    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank You!</h1>
                    </div>
                    <div class="content">
                        <p>Thank you for completing <strong>${params.surveyTitle}</strong>.</p>
                        <p>Your response has been recorded.</p>
                        ${params.completionCode ? `
                            <div class="code-box">
                                <p>Your completion code:</p>
                                <p class="code">${params.completionCode}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="footer">
                        <p>This email was sent by Resonant Surveys</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Thank You!

Thank you for completing "${params.surveyTitle}".

Your response has been recorded.

${params.completionCode ? `Your completion code: ${params.completionCode}` : ''}
        `.trim(),
    }),
};
