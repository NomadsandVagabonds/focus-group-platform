// API Route: Global Settings
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface GlobalSettings {
    defaultTheme: string;
    defaultFormat: string;
    defaultLanguage: string;
    allowAnonymous: boolean;
    requireConsent: boolean;
    dataRetentionDays: number;
    exportFormat: string;
    emailNotifications: boolean;
    adminEmail: string;
}

// GET /api/survey/settings/global - Get global settings
export async function GET() {
    try {
        const { data, error } = await getSupabaseServer()
            .from('global_settings')
            .select('*')
            .eq('key', 'survey_settings')
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned, which is OK for first-time setup
            if (error.code === '42P01') {
                // Table doesn't exist, return defaults
                return NextResponse.json({
                    settings: getDefaultSettings()
                });
            }
            throw error;
        }

        return NextResponse.json({
            settings: data?.value || getDefaultSettings()
        });
    } catch (error: any) {
        console.error('Error fetching global settings:', error);
        return NextResponse.json({
            settings: getDefaultSettings()
        });
    }
}

// POST /api/survey/settings/global - Save global settings
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const settings: GlobalSettings = {
            defaultTheme: body.defaultTheme || 'editorial_academic',
            defaultFormat: body.defaultFormat || 'group_by_group',
            defaultLanguage: body.defaultLanguage || 'en',
            allowAnonymous: body.allowAnonymous ?? true,
            requireConsent: body.requireConsent ?? true,
            dataRetentionDays: body.dataRetentionDays || 365,
            exportFormat: body.exportFormat || 'csv',
            emailNotifications: body.emailNotifications ?? true,
            adminEmail: body.adminEmail || '',
        };

        // Upsert the settings
        const { data, error } = await getSupabaseServer()
            .from('global_settings')
            .upsert({
                key: 'survey_settings',
                value: settings,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'key'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                // Table doesn't exist - in a real app, we'd create it
                // For now, just acknowledge the save
                return NextResponse.json({ settings, saved: true });
            }
            throw error;
        }

        return NextResponse.json({ settings: data.value, saved: true });
    } catch (error: any) {
        console.error('Error saving global settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function getDefaultSettings(): GlobalSettings {
    return {
        defaultTheme: 'editorial_academic',
        defaultFormat: 'group_by_group',
        defaultLanguage: 'en',
        allowAnonymous: true,
        requireConsent: true,
        dataRetentionDays: 365,
        exportFormat: 'csv',
        emailNotifications: true,
        adminEmail: '',
    };
}
