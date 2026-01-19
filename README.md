# Resonant - Focus Group Platform

A real-time focus group platform with Frank Luntz-style perception tracking, live moderator controls, and comprehensive session analytics.

## Features

### Video & Audio
- 🎥 **10-participant video conferencing** via LiveKit
- 🔇 **Moderator audio controls** - Mute all, unmute all, per-participant mute
- 🎤 **Moderator self-mute** - Independent mic toggle
- ✋ **Hand raise system** - Participants raise hands, moderator sees indicators
- 🔊 **Active speaker highlighting** - Green glow on speaking participants

### Perception Tracking
- 📊 **Real-time slider** (0-100) with emoji quick-tap buttons
- 📈 **Live perception overlay** - Aggregate sentiment visualization
- 👤 **Per-participant perception scores** in moderator sidebar
- 💾 **Persistent data** - Stored in Supabase `slider_events` table

### Session Management
- 📅 **Scheduled sessions** with date/time picker
- 📝 **Script templates** - Create, save, and reuse moderator scripts
- 🎬 **Media library** - Upload and manage session media (images/videos)
- 🏷️ **Participant tags** - Segment participants by demographics/attributes
- 🎵 **Session recordings** - Record and store to S3

### Transcription (Whisper AI)
- 📄 **Auto-transcription** - OpenAI Whisper transcribes recordings
- 🔍 **Word search** - Search across full transcript
- ⏱️ **Timestamped segments** - Click to jump to specific moments
- 📥 **Download formats** - TXT (plain text) and SRT (subtitles)

### Admin Dashboard
- 📋 **Session list** with status badges (scheduled/live/completed)
- 👥 **Participant management** - Add, edit, view notes
- 📊 **Session analytics** - Rating charts per participant
- 📂 **Document uploads** - Attach files to participants

### Moderator View
- 🖥️ **Video grid** with participant tiles
- 📊 **Live perception chart** in sidebar
- ☑️ **"Has spoken" checkbox** - Track who's been called on
- 📋 **Participant list** with mute/hand/score status

### Participant View
- 🎯 **Focused layout** - Moderator video + perception slider
- 🔔 **Mute notifications** - Visual indicator when muted
- ✋ **Raise hand button** - Get moderator attention

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Video**: LiveKit (WebRTC)
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3 (recordings, media, documents)
- **AI**: OpenAI Whisper (transcription)
- **Visualization**: D3.js / Recharts

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure:

```bash
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AWS S3 (recordings & media)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# OpenAI (transcription)
OPENAI_API_KEY=sk-xxx

# Admin auth
NEXT_PUBLIC_MODERATOR_SECRET=your-admin-secret
```

4. Run database migrations (in Supabase SQL Editor):
   - `migrations/001_slider_events.sql`
   - `migrations/002_session_scripts.sql`
   - `migrations/003_participant_tags.sql`

5. Run development server: `npm run dev`

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   │   ├── tags/        # Tag management
│   │   ├── transcribe/  # Whisper transcription
│   │   ├── sessions/    # Session CRUD
│   │   └── ...
│   ├── join/            # Participant join flow
│   ├── moderator/       # Moderator view
│   └── participant/     # Participant view
├── components/
│   ├── ModeratorVideoGrid.tsx
│   ├── ParticipantVideoGrid.tsx
│   ├── PerceptionOverlay.tsx
│   ├── SessionAnalytics.tsx
│   ├── SessionTranscript.tsx
│   └── ...
└── ...
migrations/              # SQL migrations for Supabase
```

## Key Database Tables

- `sessions` - Focus group sessions
- `participants` - Participants with codes and notes
- `slider_events` - Real-time perception data
- `tags` / `participant_tags` - Participant segmentation
- `session_transcripts` - Whisper transcriptions
- `recordings` - S3 recording URLs
- `session_scripts` - Moderator script templates

## Deployment

Deployed via Vercel. Push to `main` triggers auto-deploy.

Production URL: https://resonant.vercel.app (or your custom domain)
