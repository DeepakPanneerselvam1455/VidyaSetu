# VidyaSetu — Production Architecture & Interview Guide

## 1. Final Folder Structure

```
VidyaSetu-main/
├── server/
│   ├── schema.sql              # Complete PostgreSQL schema with RLS, indexes, functions
│   └── token-server.js         # Jitsi JWT token server (port 3002)
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   └── cors.ts         # CORS headers for Edge Functions
│       ├── generate-quiz/      # AI quiz generation (Gemini, server-side only)
│       ├── delete-user/        # Admin user deletion (service_role key)
│       └── disable-user/       # Admin user ban/enable (service_role key)
├── lib/
│   ├── api.ts                  # All Supabase API calls (paginated, secure)
│   ├── auth.tsx                # AuthProvider context (session management)
│   ├── supabase.ts             # Supabase client (anon key only)
│   ├── utils.ts                # Utility functions
│   ├── theme.tsx               # Theme context (light/dark)
│   └── activityLog.ts          # Activity log system
├── types/
│   └── index.ts                # All TypeScript interfaces
├── components/
│   ├── Layout.tsx              # Main layout with role-based sidebar
│   ├── ProtectedRoute.tsx      # Route guard with role enforcement
│   ├── ChatModal.tsx           # Real-time DM with optimistic updates
│   ├── ChatBot.tsx             # AI assistant (disabled API for security)
│   ├── SessionCalendar.tsx     # Tutoring session calendar view
│   └── ui/                     # Reusable UI primitives
├── pages/
│   ├── admin/                  # Admin dashboards, user mgmt, analytics
│   ├── mentor/                 # Course/quiz creation, grading, tutoring
│   ├── student/                # Course viewing, quiz taking, progress
│   ├── common/                 # Forums, tutoring room
│   ├── Login.tsx               # Login with demo accounts
│   ├── Register.tsx            # Registration (student-only)
│   ├── Dashboard.tsx           # Role-based redirect
│   ├── Profile.tsx             # User profile
│   └── Settings.tsx            # User settings
├── App.tsx                     # HashRouter + all routes
├── index.css                   # Tailwind + custom theme system
├── index.tsx                   # React entry point
└── .env                        # Environment variables (gitignored)
```

## 2. Data Flow Architecture

### Authentication Flow
```
User → Login Form → supabase.auth.signInWithPassword()
  → JWT issued → getProfile() fetches from profiles table
  → AuthProvider stores user in context
  → ProtectedRoute checks user.role against allowed roles
  → Redirect to /student | /mentor | /admin
```

### Registration Flow (Secured)
```
User → Register Form → api.register({ name, email })
  → supabase.auth.signUp() (NO role sent from client)
  → DB trigger: handle_new_user() fires
    → INSERT INTO profiles (role='student') — ALWAYS
  → Admin creates user: createUser({name, email, role})
    → signUp() with metadata: { admin_assigned_role: role }
    → DB trigger reads metadata, sets role accordingly
  → User auto-logged in → redirect to dashboard
```

### Quiz Generation Flow (Secured)
```
Mentor → Generate Quiz Form → api.generateQuizQuestions()
  → supabase.functions.invoke('generate-quiz', { JWT auth })
  → Edge Function:
    1. Validate JWT (supabaseClient.auth.getUser())
    2. Check profile.role === 'mentor' | 'admin'
    3. Read GEMINI_API_KEY from Deno.env (secure)
    4. Call Gemini API with system prompt
    5. Parse + validate response
    6. Return { data: questions[] }
  → Frontend saves to quizzes table via createQuiz()
```

### User Deletion Flow (Secured)
```
Admin → Delete User → api.deleteUser(userId)
  → supabase.functions.invoke('delete-user', { JWT auth })
  → Edge Function:
    1. Validate JWT
    2. Check caller is admin
    3. Create supabaseAdmin (service_role key)
    4. supabaseAdmin.auth.admin.deleteUser(targetUserId)
    5. ON DELETE CASCADE removes profile + all related data
    6. Log to activity_logs
  → Return { success: true }
```

### Real-time Messaging Flow
```
User A → ChatModal opens → getMessages() fetches history
  → subscribeToDirectMessages() creates Supabase Realtime channel
  → Channel listens: postgres_changes INSERT on direct_messages
  → Filter: (sender_id=me, receiver_id=them) OR (sender_id=them, receiver_id=me)

User A sends message:
  1. Optimistic: push to local state immediately
  2. INSERT into direct_messages (RLS: sender_id must = auth.uid())
  3. Realtime pushes to User B's ChatModal

User B receives:
  → Realtime payload → append to messages state → scroll to bottom
```

## 3. Security Fixes Applied

### 3.1 RLS Policies (Before → After)

| Table | Before | After |
|-------|--------|-------|
| profiles | `USING (true)` SELECT | `auth.uid() IS NOT NULL` (authenticated users only) |
| tutoring_sessions | `USING (true)` UPDATE | `auth.uid() = "mentorId"` (owner only) |
| courses | `USING (true)` SELECT | `auth.uid() IS NOT NULL` |
| quiz_assignments | Missing student policy | `studentId = auth.uid()` |
| direct_messages | Partial | Full: sender/receiver matching |
| forum_categories | `USING (true)` | `auth.uid() IS NOT NULL` |
| activity_logs | `USING (true)` INSERT | `auth.uid() IS NOT NULL` |

### 3.2 Role Escalation Prevention

**Before:** Register page had a role `<select>` dropdown. API passed `{name, email, role}` to signUp.

**After:**
- Register page shows "All new accounts are created as Students" (no role selector)
- `api.register()` sends only `{name, email}` — no role field
- DB trigger `handle_new_user()` hardcodes `role='student'`
- Admin user creation uses `api.createUser()` which passes `admin_assigned_role` in auth metadata
- DB trigger reads metadata: if `admin_assigned_role` is set AND valid, uses it; otherwise 'student'

### 3.3 API Key Protection

**Before:** `VITE_GEMINI_API_KEY` exposed in frontend bundle via `import.meta.env`

**After:**
- Gemini API key stored in Supabase Edge Function secrets (`GEMINI_API_KEY`)
- `Deno.env.get("GEMINI_API_KEY")` only accessible server-side
- Frontend calls `supabase.functions.invoke('generate-quiz')` — never touches the key
- ChatBot returns static "AI Chat disabled" message to prevent key exposure

### 3.4 Column Name Consistency

**Before:** `createQuizAssignments()` used snake_case (`quiz_id`, `student_id`, `assigned_by`) but DB columns are camelCase (`quizId`, `studentId`, `assignedBy`).

**After:** All API functions use camelCase matching DB column names.

### 3.5 Tutoring Session Join

**Before:** `joinTutoringSession()` did a direct UPDATE which violated RLS (students couldn't update sessions).

**After:** Created `join_tutoring_session()` PostgreSQL function with `SECURITY DEFINER` that:
- Verifies the calling user matches the student being added
- Checks session is in 'scheduled' status
- Checks capacity limits
- Adds student to studentIds array

## 4. Interview Preparation

### Q1: "How does RBAC work in your application?"

**Answer:** "RBAC operates at three layers:

1. **Frontend Layer:** `ProtectedRoute` component checks `user.role` against an allowed roles array before rendering a route. Unauthorized users are redirected to their own dashboard.

2. **Database Layer:** Row Level Security (RLS) policies on every table enforce data isolation. For example, the `quizzes` SELECT policy uses a subquery: students can only see quizzes where their `studentId` exists in `quiz_assignments`. The `is_admin()` function is used as a gatekeeper for admin-only operations.

3. **Edge Function Layer:** Serverless functions validate the JWT, query the user's role from the profiles table, and explicitly deny requests lacking privileges. This prevents even API-level bypasses."

### Q2: "How did you prevent role escalation?"

**Answer:** "The vulnerability was that the registration form included a role dropdown and the API passed the role directly to signUp. An attacker could intercept the request and set `role: 'admin'`.

I fixed this by:
1. Removing the role selector from the registration UI
2. Stripping the role from the signUp call — only `{name, email}` is sent
3. Implementing a PostgreSQL trigger `handle_new_user()` that fires on every `auth.users` INSERT and hardcodes `role='student'`
4. For admin user creation, passing `admin_assigned_role` in the auth metadata, which the trigger reads and validates"

### Q3: "How are API keys protected?"

**Answer:** "The Gemini API key was initially in the frontend bundle via Vite's `import.meta.env`. Anyone could extract it from the built JS files.

I moved all AI logic to a Supabase Edge Function that reads the key from Deno's secure environment (Supabase Secrets). The frontend only sends the quiz prompt and receives the result — it never touches the key. Edge Functions run on Deno Deploy, isolated from the client entirely."

### Q4: "How did you fix the 'Failed to load dashboard data' error?"

**Answer:** "This was caused by RLS policies returning permission denied errors when students tried to access data they shouldn't. Specifically, `quiz_assignments` lacked a proper SELECT policy for students.

I fixed it by:
1. Adding `studentId = auth.uid()` RLS policy for quiz_assignments
2. Adding a `Promise.race([fetch, timeout])` pattern with an 8-second timeout
3. Mapping specific error messages (permission denied, timeout, network) to user-friendly messages
4. Adding a retry button on error states"

### Q5: "Explain the real-time messaging architecture."

**Answer:** "The chat uses Supabase Realtime subscriptions on the `direct_messages` table. When the ChatModal opens, it:
1. Fetches message history via `getMessages()` with an OR filter for both sender/receiver combinations
2. Subscribes to `postgres_changes` INSERT events on the channel `dm_{sorted_user_ids}`
3. Filters incoming payloads to only show messages belonging to the current conversation

Messages use optimistic updates — the UI shows the message instantly, then replaces it with the server-confirmed version. If the insert fails, the optimistic message is rolled back."

### Q6: "What's your approach to database performance?"

**Answer:** "I implemented:
1. **Strategic indexes** on all foreign keys and frequently queried columns (e.g., `idx_quiz_assignments_student_quiz` as a compound index)
2. **Pagination** using Supabase's `.range(from, to)` instead of `select('*')`
3. **Server-side filtering** — e.g., `getSessionsForUser()` uses PostgreSQL's `@>` array containment operator instead of client-side filtering
4. **SECURITY DEFINER functions** for operations that need to bypass RLS (like session joining), avoiding complex policy chains"

## 5. Environment Setup

### Required Supabase Secrets (Edge Functions)
```
GEMINI_API_KEY          # Google Gemini API key (server-side only)
SUPABASE_SERVICE_ROLE_KEY  # Auto-provided by Supabase
```

### Required .env Variables (Frontend)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deployment Steps
```bash
# 1. Run schema.sql in Supabase SQL Editor
# 2. Set Edge Function secrets:
supabase secrets set GEMINI_API_KEY=your-key
# 3. Deploy Edge Functions:
supabase functions deploy generate-quiz
supabase functions deploy delete-user
supabase functions deploy disable-user
# 4. Build and deploy frontend:
npm run build
```

## 6. Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Auth    │  │Protected │  │ Pages (Student/       │   │
│  │Provider │──│Route     │──│ Mentor/Admin)         │   │
│  └────┬────┘  └──────────┘  └──────────┬────────────┘   │
│       │                                │                 │
│       │  lib/api.ts                     │                 │
│       │  ┌─────────────────────────────┘                 │
│       │  │                                              │
│  ┌────▼──▼──────────────────────────────────────────┐   │
│  │            Supabase JS Client (anon key)          │   │
│  └───────────────────┬──────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          │            │                │
┌─────────▼──┐  ┌──────▼─────┐  ┌──────▼──────┐
│ Auth API   │  │ Database   │  │ Edge Funcs  │
│ (login,    │  │ (RLS       │  │ (service_   │
│  signup)   │  │  enforced) │  │  role key)  │
└────────────┘  └────────────┘  └──────┬──────┘
                                       │
                                ┌──────▼──────┐
                                │  External   │
                                │  APIs       │
                                │ (Gemini AI) │
                                └─────────────┘
```
