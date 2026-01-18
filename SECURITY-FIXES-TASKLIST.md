# Security Fixes - Task List for Claude Code

**Context:** This platform is a focus group tool with LiveKit video, Supabase backend, Next.js 16. We need basic security before pilot testing with real users.

**Scope:** Option A - Quick fixes (30 min). Full auth can come later.

---

## Task 1: Fix isModerator Privilege Escalation (CRITICAL)

**File:** `src/app/api/token/route.ts`

**Problem:** The `isModerator` flag comes directly from client request. Anyone can set `isModerator: true` and get admin privileges.

**Fix:** For now, check against an environment variable password instead of trusting the client:

```typescript
// Add to .env.local (you'll need to tell the user to add this):
// MODERATOR_SECRET=your-secret-password-here

export async function POST(request: NextRequest) {
    const { roomName, participantName, isModerator, moderatorSecret } = await request.json();
    
    // Verify moderator status with secret, not just client flag
    const isActualModerator = isModerator && moderatorSecret === process.env.MODERATOR_SECRET;
    
    // ... rest of token generation
    at.addGrant({
        roomAdmin: isActualModerator,
        roomRecord: isActualModerator,
        // ...
    });
}
```

**Also update:** Any client code that requests moderator tokens needs to pass the secret.

---

## Task 2: Add Basic Admin Password Protection

**Files to modify:**
- `src/app/admin/layout.tsx` - Add password gate
- Create `src/app/api/admin-auth/route.ts` - Verify password

**Approach:** Simple session-based password check (not full auth, just a gate):

1. Create a password check page that appears before any admin content
2. Store "authenticated" state in a cookie or localStorage
3. Check this state in the admin layout

**Password:** Use env var `ADMIN_PASSWORD` (user sets in Vercel and .env.local)

**Example flow:**
- User visits `/admin` → sees password prompt
- User enters password → stored in httpOnly cookie with 24hr expiry
- Subsequent visits check cookie before rendering admin content

---

## Task 3: Add File Upload Validation

**File:** `src/app/api/participants/[id]/documents/route.ts`

**Add this validation before the upload:**

```typescript
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 
    'image/png',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const file = formData.get('file') as File;

if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
}

if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ 
        error: `File type not allowed. Allowed: PDF, images, text, Word docs` 
    }, { status: 400 });
}

if (file.size > MAX_SIZE) {
    return NextResponse.json({ 
        error: 'File too large. Maximum size: 10MB' 
    }, { status: 400 });
}
```

---

## Task 4: Fix Inconsistent Error Handling

**File:** `src/app/api/participants/[id]/documents/route.ts`

**Problem (line ~46):** Returns `{ status: 200 }` on errors.

**Fix:** Return proper 4xx/5xx status codes for all error cases.

---

## Task 5: Remove/Update Legacy Code

**File:** `src/app/api/session/route.ts`

**Action:** Either delete this file (it's the old single-session route) or add a deprecation warning. The current code uses in-memory storage which is inconsistent with the rest of the app.

---

## Task 6: Sanitize Error Messages

**Files:** All API routes in `src/app/api/`

**Change this pattern:**
```typescript
// Before (leaks internal details)
return NextResponse.json(
    { error: 'Operation failed', details: String(error) },
    { status: 500 }
);

// After (safe for production)
console.error('[API] Error:', error);
return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
);
```

---

## Task 7: Use Crypto Randomness for Codes

**File:** `src/app/api/sessions/route.ts` (the code generation functions)

**Replace:**
```typescript
code += letters.charAt(Math.floor(Math.random() * letters.length));
```

**With:**
```typescript
import { randomBytes } from 'crypto';

function generateSecureCode(length: number, charset: string): string {
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
    }
    return result;
}
```

---

## Environment Variables to Add

Tell the user to add these to both `.env.local` and Vercel:

```
ADMIN_PASSWORD=<user-chosen-password>
MODERATOR_SECRET=<random-string-for-moderator-verification>
```

---

## Order of Implementation

1. Task 1 (isModerator) - Most critical, privilege escalation
2. Task 2 (admin password) - Protects the dashboard
3. Task 3 (file validation) - Prevents malicious uploads
4. Tasks 4-7 - Code quality improvements

---

## Testing Checklist

After implementing:
- [ ] Cannot access `/admin` without password
- [ ] Participant cannot become moderator without secret
- [ ] File upload rejects `.exe`, `.js`, oversized files
- [ ] Error responses don't leak stack traces
- [ ] Session codes are generated with crypto randomness

---

## DO NOT Do (Out of Scope for Option A)

- Full Supabase Auth setup
- RLS policy changes
- Database migrations
- Rate limiting
- Moving slider data to database

These are for Option B (full production hardening) later.
