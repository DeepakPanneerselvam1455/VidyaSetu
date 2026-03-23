# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

VidyaSetu is an AI-powered Learning Management System connecting students with mentors. Key features include AI-generated quizzes (Google Gemini), mentorship automation, course management, community forums, and Jitsi-based tutoring sessions.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start Jitsi token server (port 3002) - required for tutoring room functionality
npm run api
```

No test framework is currently configured.

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Google Gemini AI API key

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini via `@google/genai` SDK
- **Video**: Jitsi JaaS for tutoring rooms

### User Roles
Three roles with distinct dashboards and permissions:
- `student` - Take courses/quizzes, request mentorship, join tutoring
- `mentor` - Create courses/quizzes, manage mentorship, host tutoring
- `admin` - User management, analytics, moderation, settings

### Directory Structure
- `App.tsx` - Root component with HashRouter and all route definitions
- `lib/` - Core utilities and services
  - `api.ts` - All Supabase API calls and Gemini AI functions
  - `auth.tsx` - AuthContext provider with login/logout/session management
  - `supabase.ts` - Supabase client initialization
  - `theme.tsx` - Theme context (light/dark mode)
- `pages/` - Route components organized by role (`student/`, `mentor/`, `admin/`, `common/`)
- `components/` - Shared React components
  - `ui/` - Reusable UI primitives (Button, Card, Input, Dialog, etc.)
  - `Layout.tsx` - Main layout wrapper with role-based sidebar navigation
  - `ProtectedRoute.tsx` - Route guard with role-based access control
- `types/index.ts` - All TypeScript interfaces
- `server/` - Node.js utilities
  - `schema.sql` - Complete Supabase database schema
  - `token-server.js` - Jitsi JWT token generation server

### Key Patterns

**Authentication Flow**: 
- Supabase Auth handles login/signup
- `AuthProvider` wraps app and exposes `useAuth()` hook
- `ProtectedRoute` component guards routes and enforces role permissions
- User profile stored in `profiles` table linked to `auth.users`

**Database Conventions**:
- All columns use camelCase to match TypeScript types directly
- RLS is enabled but currently uses open policies for development
- JSONB columns store complex nested data (materials, questions, answers)

**Routing**:
- Uses `HashRouter` (not BrowserRouter) for compatibility
- Routes prefixed by role: `/student/*`, `/mentor/*`, `/admin/*`
- Common routes: `/forums`, `/profile`, `/settings`, `/room/:sessionId`

**AI Integration** (`lib/api.ts`):
- `generateQuizQuestions()` - Create quizzes from topics or uploaded content
- `getQuestionAISuggestion()` - Get improvements for quiz questions
- `regenerateQuestionWithAI()` - Regenerate individual questions
- All AI calls use `generateContentWithRetry()` with exponential backoff

**Styling**:
- Tailwind CSS with CSS custom properties for theming
- Role-based theme colors via `data-role` attribute on document root
- UI components in `components/ui/` use `class-variance-authority` for variants

### Database Schema (key tables)
- `profiles` - User data linked to Supabase Auth
- `courses` - Course metadata with JSONB `materials` array
- `quizzes` - Quiz metadata with JSONB `questions` array
- `quiz_attempts` - Student submissions with JSONB `answers`
- `tutoring_sessions` - Video session scheduling
- `mentorship_requests` - Student-mentor connection requests
- `forum_threads`, `forum_posts`, `forum_categories` - Community forums
