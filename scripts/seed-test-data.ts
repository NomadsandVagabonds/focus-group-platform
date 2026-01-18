import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxqhoakssescxdshzjfa.supabase.co';
const supabaseAnonKey = 'sb_publishable_OErk_wJRTExaKkw0hih1Aw_OTh5xGS6';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedTestData() {
    console.log('🌱 Seeding test data...\n');

    // Create a test session
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
            name: 'AI Messaging Focus Group - Pilot',
            code: 'PILOT-001',
            status: 'scheduled',
            moderator_notes: 'First pilot session to test messaging effectiveness. Focus on emotional resonance and clarity.',
            scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
        })
        .select()
        .single();

    if (sessionError) {
        console.error('Failed to create session:', sessionError);
        return;
    }

    console.log(`✅ Created session: ${session.name} (${session.code})\n`);

    // Create participants with rich notes
    const participants = [
        {
            code: 'MJOHN01',
            display_name: 'Maggie',
            email: 'margaret.johnson@email.com',
            notes: 'Very articulate, strong opinions on tech regulation. Prolific ID: ABC123',
            metadata: {
                name: 'Margaret Johnson',
                fullNotes: `## Pre-Session Notes
- Works in healthcare administration
- Age 42, suburban Chicago
- Expressed strong concern about AI replacing jobs in her field
- Prolific pre-screener: High concern, low trust in tech companies

## Session Notes
(To be filled during/after session)

## Key Quotes
(To be captured)

## Follow-up Questions
- What specific AI tools has she encountered at work?
- How does her workplace communicate about AI adoption?`
            }
        },
        {
            code: 'DSMITH02',
            display_name: 'David',
            email: 'david.smith@email.com',
            notes: 'Tech-savvy, works in IT. Skeptical of "doom" messaging. Prolific ID: DEF456',
            metadata: {
                name: 'David Smith',
                fullNotes: `## Pre-Session Notes
- Software developer, 10 years experience
- Age 35, Portland OR
- Uses AI tools daily (Copilot, ChatGPT)
- Prolific pre-screener: Moderate concern, high familiarity

## Session Notes
(To be filled during/after session)

## Key Quotes
(To be captured)

## Potential Biases
- May dismiss safety concerns as overblown
- Deep insider perspective could color views`
            }
        },
        {
            code: 'LGARC03',
            display_name: 'Linda',
            email: 'l.garcia@email.com',
            notes: 'Parent of teenagers, concerned about AI in education. Prolific ID: GHI789',
            metadata: {
                name: 'Linda Garcia',
                fullNotes: `## Pre-Session Notes
- High school teacher, 15 years
- Age 48, Miami FL
- Two kids (14, 17) using AI for homework
- Prolific pre-screener: High concern about youth, moderate overall

## Session Notes
(To be filled during/after session)

## Areas to Probe
- How does she handle AI-generated homework?
- What policies exist at her school?
- Does she see educational benefits or mainly risks?

## Background
Has been teaching English for 15 years and has seen dramatic shifts in student writing since ChatGPT.`
            }
        },
        {
            code: 'RWILS04',
            display_name: 'Robert',
            email: 'rwilson@email.com',
            notes: 'Retired engineer, interested in AI policy implications. Prolific ID: JKL012',
            metadata: {
                name: 'Robert Wilson',
                fullNotes: `## Pre-Session Notes
- Retired aerospace engineer (Boeing, 32 years)
- Age 67, Seattle WA
- Active in local government advisory board
- Prolific pre-screener: Moderate concern, high policy interest

## Session Notes
(To be filled during/after session)

## Valuable Perspective
- Witnessed automation waves in manufacturing
- Can compare AI transition to previous tech shifts
- Policy-oriented mindset

## Caution
May have strong political views on regulation that could dominate discussion.`
            }
        },
        {
            code: 'ACHNG05',
            display_name: 'Amy',
            email: null, // No email - Prolific participant
            notes: 'Young professional, daily AI user. Prolific ID: MNO345',
            metadata: {
                name: 'Amy Chang',
                fullNotes: `## Pre-Session Notes
- Marketing coordinator at startup
- Age 26, Austin TX
- Uses AI for content generation, image creation
- Prolific pre-screener: Low concern, high enthusiasm

## Session Notes
(To be filled during/after session)

## Discussion Goals
- Understand why low concern despite awareness
- What would change her mind?
- How does she think about job displacement in her field?

## Note
Very active on social media - may provide generational perspective.`
            }
        }
    ];

    // Insert participants
    for (const p of participants) {
        const { error } = await supabase
            .from('participants')
            .insert({
                session_id: session.id,
                ...p
            });

        if (error) {
            console.error(`Failed to create ${p.display_name}:`, error);
        } else {
            console.log(`✅ Created participant: ${p.metadata.name} (${p.display_name}) - ${p.code}`);
        }
    }

    // Also create the backup slots
    for (let i = 1; i <= 5; i++) {
        const { error } = await supabase
            .from('participants')
            .insert({
                session_id: session.id,
                code: `BACKUP${i}`,
                display_name: `Backup ${i}`,
                notes: 'Emergency backup slot - assign to participant if their code fails',
                metadata: { isBackup: true }
            });

        if (error) {
            console.error(`Failed to create BACKUP${i}:`, error);
        }
    }

    console.log(`\n✅ Created 5 backup slots`);
    console.log(`\n🎉 Done! Visit /admin to see the test session.`);
}

seedTestData();
