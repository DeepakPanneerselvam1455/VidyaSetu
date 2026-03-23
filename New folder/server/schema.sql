-- Clean up existing data (WIPE as requested)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TABLES ---

-- PROFILES (Public user data linked to Auth)
-- Using camelCase identifiers for columns to match frontend TS types
CREATE TABLE public.profiles (
    "id" UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT CHECK (role IN ('student', 'mentor', 'admin')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "accountStatus" TEXT DEFAULT 'ENABLED',
    "dob" DATE,
    "education" TEXT,
    "school" TEXT,
    "state" TEXT,
    "contact" TEXT,
    "bio" TEXT,
    "expertise" TEXT[], 
    "isOpenToMentorship" BOOLEAN,
    "availability" JSONB
);

-- COURSES
CREATE TABLE public.courses (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" TEXT,
    "mentorId" UUID REFERENCES public.profiles("id"),
    "instructorName" TEXT,
    "institutionName" TEXT,
    "publishDate" DATE,
    "language" TEXT,
    "topics" TEXT[],
    "materials" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QUIZZES
CREATE TABLE public.quizzes (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "courseId" UUID REFERENCES public.courses("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "difficulty" TEXT,
    "createdBy" UUID REFERENCES public.profiles("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "duration" INTEGER,
    "aiInvolvement" TEXT,
    "questions" JSONB,
    "generatedByAi" BOOLEAN,
    "sourceType" TEXT,
    "sourceFileNames" TEXT[],
    "extractedTextHash" TEXT
);

-- QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "quizId" UUID REFERENCES public.quizzes("id") ON DELETE CASCADE,
    "studentId" UUID REFERENCES public.profiles("id"),
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "score" INTEGER,
    "totalPoints" INTEGER,
    "answers" JSONB,
    "feedback" TEXT,
    "overallFeedback" TEXT,
    "gradedBy" UUID REFERENCES public.profiles("id"),
    "gradedAt" TIMESTAMP WITH TIME ZONE,
    "overriddenScore" INTEGER
);

-- FORUM CATEGORIES
CREATE TABLE public.forum_categories (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT
);

-- FORUM THREADS
CREATE TABLE public.forum_threads (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "categoryId" UUID REFERENCES public.forum_categories("id") ON DELETE CASCADE,
    -- authorId AND authorName usually stored for forum
    "authorId" UUID REFERENCES public.profiles("id"),
    -- Author name ideally joined but if frontend expects it flat:
    "authorName" TEXT, 
    "title" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "views" INTEGER DEFAULT 0,
    -- Using TEXT array instead of string[]
    "upvotes" TEXT[], 
    "replyCount" INTEGER DEFAULT 0,
    "tags" TEXT[]
);

-- FORUM POSTS
CREATE TABLE public.forum_posts (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "threadId" UUID REFERENCES public.forum_threads("id") ON DELETE CASCADE,
    "authorId" UUID REFERENCES public.profiles("id"),
    "authorName" TEXT, -- Optimization/Denormalization
    "content" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "upvotes" TEXT[]
);

-- MENTORSHIP REQUESTS
CREATE TABLE public.mentorship_requests (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "studentId" UUID REFERENCES public.profiles("id"),
    "mentorId" UUID REFERENCES public.profiles("id"),
    "message" TEXT,
    "status" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TUTORING SESSIONS
CREATE TABLE public.tutoring_sessions (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "mentorId" UUID REFERENCES public.profiles("id"),
    "studentIds" TEXT[], 
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE, -- calculated/stored?
    "duration" INTEGER, -- Needed by UI
    "status" TEXT,
    "topic" TEXT,
    "description" TEXT,
    "type" TEXT,
    "category" TEXT,
    "focus" TEXT,
    "maxStudents" INTEGER,
    "meetingLink" TEXT,
    "privateNotes" TEXT
);

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "type" TEXT,
    "title" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- USER PROGRESS (New table for tracking viewed materials)
CREATE TABLE public.user_progress (
    "userId" UUID REFERENCES public.profiles("id"),
    "materialId" TEXT,
    PRIMARY KEY ("userId", "materialId")
);

-- --- STORAGE ---
-- Create Buckets with high file size limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('materials', 'materials', true, 2147483648, null), -- 2GB limit
('avatars', 'avatars', true, 52428800, null)         -- 50MB limit
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = EXCLUDED.file_size_limit;

-- --- SECURITY (RLS) ---
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Open Policies (For Initial Dev/Simplification)
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public courses access" ON public.courses FOR ALL USING (true);
CREATE POLICY "Public quizzes access" ON public.quizzes FOR ALL USING (true);
CREATE POLICY "Public quiz_attempts access" ON public.quiz_attempts FOR ALL USING (true);
CREATE POLICY "Public forum_categories access" ON public.forum_categories FOR ALL USING (true);
CREATE POLICY "Public forum_threads access" ON public.forum_threads FOR ALL USING (true);
CREATE POLICY "Public forum_posts access" ON public.forum_posts FOR ALL USING (true);
CREATE POLICY "Public mentorship_requests access" ON public.mentorship_requests FOR ALL USING (true);
CREATE POLICY "Public tutoring_sessions access" ON public.tutoring_sessions FOR ALL USING (true);
CREATE POLICY "Public activity_logs access" ON public.activity_logs FOR ALL USING (true);
CREATE POLICY "Public user_progress access" ON public.user_progress FOR ALL USING (true);

-- Storage Policies
-- Drop existing policies if any (to avoid conflict on re-run)
DROP POLICY IF EXISTS "Public Access Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;

-- Allow public access to read
CREATE POLICY "Public Access Materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload (simplified to ALL for demo purposes if needed, but INSERT usually requires auth)
CREATE POLICY "Authenticated Upload Materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
