# Security Review Report: Focus Group Platform

**Date:** January 17, 2026
**Reviewer:** Claude (Security & Ops)
**For:** Engineering Team
**Status:** Awaiting Approval Before Implementation

---

## Overview

I've completed a security and code review of the focus-group-platform codebase. This document summarizes the findings and outlines proposed fixes for your review. **No changes have been made yet** - I'm seeking your input and approval before proceeding.

The platform is a Next.js 16 application with LiveKit (WebRTC video), Supabase (PostgreSQL), and D3.js visualization. It's well-structured overall, but has security gaps that should be addressed before production use.

---

## Summary of Findings

| Severity | Count | Summary |
|----------|-------|---------|
| Critical | 3 | No auth on APIs, privilege escalation, exposed credentials |
| High | 4 | Weak randomness, no rate limiting, IDOR, permissive RLS |
| Medium | 2 | Unvalidated file uploads, in-memory data loss |
| Low | 1 | Verbose error messages |

---

## Critical Issues

### 1. No Authentication on API Endpoints

**What's happening:**
All API routes (`/api/sessions`, `/api/token`, `/api/recording`, etc.) accept requests from anyone without any authentication. The admin dashboard at `/admin` is also publicly accessible.

**Risk:**
Anyone who discovers the URL can list all sessions, create/delete sessions, start/stop recordings, and export research data.

**Proposed Fix:**
Implement Supabase Auth with two user types:
- **Moderators:** Full admin access (create sessions, manage participants, control recordings)
- **Participants:** Join sessions only via validated session+participant code

**Files to modify:**
- `src/lib/supabase.ts` - Add auth helpers
- `src/app/api/*/route.ts` - Add auth middleware to each endpoint
- `src/app/admin/layout.tsx` - Add auth gate for admin pages
- New file: `src/middleware.ts` - Next.js middleware for route protection

---

### 2. Privilege Escalation via `isModerator` Flag

**What's happening:**
In `src/app/api/token/route.ts` (lines 10-33), the `isModerator` flag is taken directly from the client request:

```typescript
const { roomName, participantName, isModerator } = await request.json();
// ...
roomAdmin: isModerator || false,  // Client controls this!
roomRecord: isModerator || false,
```

**Risk:**
Any user can request a token with `isModerator: true` and gain full room admin privileges (including recording control).

**Proposed Fix:**
Verify moderator status server-side by checking against an authenticated session:

```typescript
// Proposed approach
const session = await getServerSession(request);
const isActualModerator = session?.user?.role === 'moderator';

at.addGrant({
    roomAdmin: isActualModerator,
    roomRecord: isActualModerator,
});
```

---

### 3. Credentials in .env.local

**What's happening:**
The `.env.local` file contains real credentials:
- LiveKit API key/secret
- Supabase anon key

**Current status:**
Per discussion with the team lead, these are on free-tier accounts with no billing attached, and the repo has only been up a few hours. The plan is to rotate credentials before upgrading to paid plans.

**Recommendation:**
- Add `.env.local` to `.gitignore` (already done - good!)
- Rotate credentials before any paid plan upgrade
- Consider using a secrets manager (Vercel env vars, etc.) for production

**No immediate action required** per team lead's guidance.

---

## High Priority Issues

### 4. Weak Randomness for Security Codes

**What's happening:**
Session codes (`ABC-123`) and participant codes (`XYZ789`) use `Math.random()`:

```typescript
// src/app/api/sessions/route.ts lines 121-146
code += letters.charAt(Math.floor(Math.random() * letters.length));
```

**Risk:**
`Math.random()` is not cryptographically secure. Combined with the small keyspace (17.5M session codes, 2.1B participant codes), codes could theoretically be brute-forced.

**Proposed Fix:**
```typescript
import { randomBytes } from 'crypto';

function generateSessionCode(): string {
    const bytes = randomBytes(4);
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O to avoid confusion
    const numbers = '23456789'; // Removed 0, 1 to avoid confusion

    let code = '';
    for (let i = 0; i < 3; i++) {
        code += letters[bytes[i] % letters.length];
    }
    code += '-';
    for (let i = 0; i < 3; i++) {
        code += numbers[bytes[i + 1] % numbers.length];
    }
    return code;
}
```

---

### 5. No Rate Limiting

**What's happening:**
No rate limiting on any endpoint, especially `/api/validate-join` which validates session/participant codes.

**Risk:**
Brute-force attacks on codes, DoS potential.

**Proposed Fix:**
Add rate limiting middleware using Upstash Redis (free tier available) or in-memory limiting for development:

```typescript
// Using @upstash/ratelimit or similar
const ratelimit = new Ratelimit({
    limiter: Ratelimit.slidingWindow(10, '1m'), // 10 requests per minute
});
```

**Files to modify:**
- `src/app/api/validate-join/route.ts` - Add rate limiting
- `src/app/api/token/route.ts` - Add rate limiting

---

### 6. Insecure Direct Object Reference (IDOR)

**What's happening:**
Anyone can access any session or participant by UUID:
- `GET /api/sessions/{uuid}` - Returns full details
- `DELETE /api/sessions/{uuid}` - Deletes the session
- `PATCH /api/participants/{uuid}` - Modifies participant data

**Risk:**
If an attacker guesses or obtains a valid UUID, they can read/modify/delete that resource.

**Proposed Fix:**
After implementing authentication, add ownership checks:

```typescript
// Verify the authenticated user owns/has access to this session
const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('moderator_id', authenticatedUserId)  // Add ownership check
    .single();

if (!session) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
}
```

---

### 7. Overly Permissive Database RLS Policies

**What's happening:**
In `supabase/schema.sql` (lines 62-70):

```sql
CREATE POLICY "Allow public read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read participants" ON participants FOR SELECT USING (true);
```

**Risk:**
Anyone with the Supabase URL and anon key (exposed in client-side code) can directly query the database and read ALL data.

**Proposed Fix:**
Update RLS policies to require authentication:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public read participants" ON participants;

-- New policies requiring auth
CREATE POLICY "Moderators can read own sessions" ON sessions
    FOR SELECT USING (auth.uid() = moderator_id);

CREATE POLICY "Participants can read their session" ON participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM sessions WHERE auth.uid() = moderator_id
        )
        OR id = auth.uid()
    );
```

**Note:** This requires adding a `moderator_id` column to the sessions table.

---

## Medium Priority Issues

### 8. File Upload Without Validation

**What's happening:**
In `src/app/api/participants/[id]/documents/route.ts`, files are uploaded without validation:

```typescript
const file = formData.get('file') as File;
// No type checking, no size limit
await supabase.storage.from('participant-documents').upload(...);
```

**Risk:**
Users could upload malicious files (executables, HTML with scripts) that could be served to other users.

**Proposed Fix:**
```typescript
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
}

if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
}
```

---

### 9. In-Memory Data Storage

**What's happening:**
Slider/perception data and active recordings are stored in memory:

```typescript
// src/app/api/slider-data/route.ts
const sliderDataStore = new Map<string, SliderEvent[]>();

// src/app/api/recording/route.ts
const activeRecordings = new Map<string, string>();
```

**Risk:**
A server restart loses all perception tracking data from active sessions.

**Proposed Fix:**
Move slider data to Supabase:

```sql
-- Add to schema.sql
CREATE TABLE perception_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    value INTEGER CHECK (value >= 0 AND value <= 100),
    session_timestamp INTEGER, -- ms from session start
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Low Priority Issues

### 10. Verbose Error Messages

**What's happening:**
Error details are returned to clients:

```typescript
return NextResponse.json(
    { error: 'Recording operation failed', details: String(error) },
    { status: 500 }
);
```

**Risk:**
Stack traces or internal details could leak implementation information.

**Proposed Fix:**
Log full errors server-side, return generic messages to clients:

```typescript
console.error('[Recording] Error:', error);
return NextResponse.json(
    { error: 'Recording operation failed' },
    { status: 500 }
);
```

---

## Proposed Implementation Plan

### Phase 1: Authentication (Highest Priority)
1. Set up Supabase Auth
2. Create login page for moderators
3. Add auth middleware to protect admin routes
4. Fix the `isModerator` privilege escalation

### Phase 2: Authorization & Access Control
1. Update RLS policies in Supabase
2. Add ownership checks to API endpoints
3. Implement rate limiting on sensitive endpoints

### Phase 3: Data Integrity
1. Replace `Math.random()` with crypto randomness
2. Add file upload validation
3. Move slider data to database

### Phase 4: Hardening
1. Sanitize error messages
2. Add security headers (CSP, HSTS)
3. Set up audit logging

---

## Questions for Your Review

1. **Authentication approach:** I'm proposing Supabase Auth since you're already using Supabase. Are you okay with this, or do you prefer a different auth solution (NextAuth, Clerk, etc.)?

2. **Moderator management:** How should moderators be created?
   - Option A: Self-registration with email verification
   - Option B: Admin-only creation (requires a super-admin)
   - Option C: Environment variable whitelist of allowed emails

3. **Rate limiting:** Okay to add Upstash Redis (has free tier), or prefer in-memory rate limiting?

4. **Schema changes:** The proposed fixes require adding a `moderator_id` column to sessions. This will require a database migration. Okay to proceed?

5. **Implementation order:** Do you want me to tackle these in the order listed, or prioritize differently based on your timeline?

---

## Files That Will Be Modified

```
src/
├── app/
│   ├── api/
│   │   ├── token/route.ts         (auth + fix isModerator)
│   │   ├── sessions/route.ts      (auth + ownership)
│   │   ├── sessions/[id]/route.ts (auth + ownership)
│   │   ├── participants/[id]/route.ts (auth)
│   │   ├── participants/[id]/documents/route.ts (auth + validation)
│   │   ├── recording/route.ts     (auth + error handling)
│   │   ├── slider-data/route.ts   (auth + DB persistence)
│   │   └── validate-join/route.ts (rate limiting)
│   ├── admin/
│   │   └── layout.tsx             (auth gate)
│   └── login/
│       └── page.tsx               (NEW - moderator login)
├── lib/
│   ├── supabase.ts                (add auth helpers)
│   └── auth.ts                    (NEW - auth utilities)
└── middleware.ts                  (NEW - route protection)

supabase/
└── schema.sql                     (RLS policy updates)
```

---

## Next Steps

Please review this report and let me know:
1. Any concerns or questions about the proposed approach
2. Which items you'd like me to prioritize
3. Your preferences on the questions above
4. Approval to proceed with implementation

I'll wait for your go-ahead before making any changes to the codebase.

---

*Report generated by Claude (Security & Ops Review)*
