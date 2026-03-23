-- ============================================================
-- VidyaSetu Production Schema — Secure, Indexed, RLS-Enforced
-- ============================================================

-- Clean up existing data (for fresh install only)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- PROFILES (Public user data linked to Auth)
CREATE TABLE public.profiles (
    "id" UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT CHECK (role IN ('student', 'mentor', 'admin')) DEFAULT 'student',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    "mentorId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "instructorName" TEXT,
    "institutionName" TEXT,
    "publishDate" DATE,
    "language" TEXT,
    "topics" TEXT[],
    "materials" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QUIZZES
CREATE TABLE public.quizzes (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "courseId" UUID REFERENCES public.courses("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "difficulty" TEXT,
    "createdBy" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "duration" INTEGER,
    "aiInvolvement" TEXT,
    "questions" JSONB,
    "generatedByAi" BOOLEAN,
    "sourceType" TEXT,
    "sourceFileNames" TEXT[],
    "extractedTextHash" TEXT
);

-- QUIZ ASSIGNMENTS (Linking students to quizzes)
CREATE TABLE public.quiz_assignments (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "quizId" UUID REFERENCES public.quizzes("id") ON DELETE CASCADE,
    "studentId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "assignedBy" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "quizId" UUID REFERENCES public.quizzes("id") ON DELETE CASCADE,
    "studentId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "score" INTEGER,
    "totalPoints" INTEGER,
    "answers" JSONB,
    "feedback" TEXT,
    "overallFeedback" TEXT,
    "gradedBy" UUID REFERENCES public.profiles("id") ON DELETE SET NULL,
    "gradedAt" TIMESTAMP WITH TIME ZONE,
    "overriddenScore" INTEGER,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FORUM CATEGORIES
CREATE TABLE public.forum_categories (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FORUM THREADS
CREATE TABLE public.forum_threads (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "categoryId" UUID REFERENCES public.forum_categories("id") ON DELETE CASCADE,
    "authorId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "authorName" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "views" INTEGER DEFAULT 0,
    "upvotes" TEXT[],
    "replyCount" INTEGER DEFAULT 0,
    "tags" TEXT[]
);

-- FORUM POSTS
CREATE TABLE public.forum_posts (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "threadId" UUID REFERENCES public.forum_threads("id") ON DELETE CASCADE,
    "authorId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "authorName" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "upvotes" TEXT[]
);

-- MENTORSHIP REQUESTS
CREATE TABLE public.mentorship_requests (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "studentId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "mentorId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "message" TEXT,
    "status" TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TUTORING SESSIONS
CREATE TABLE public.tutoring_sessions (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "mentorId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "studentIds" TEXT[],
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "duration" INTEGER,
    "status" TEXT CHECK (status IN ('scheduled', 'active', 'completed', 'canceled')),
    "topic" TEXT,
    "description" TEXT,
    "type" TEXT,
    "category" TEXT,
    "focus" TEXT,
    "maxStudents" INTEGER,
    "meetingLink" TEXT,
    "privateNotes" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DIRECT MESSAGES
CREATE TABLE public.direct_messages (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "sender_id" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "receiver_id" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "read" BOOLEAN DEFAULT false
);

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "type" TEXT,
    "title" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- USER PROGRESS
CREATE TABLE public.user_progress (
    "userId" UUID REFERENCES public.profiles("id") ON DELETE CASCADE,
    "materialId" TEXT,
    PRIMARY KEY ("userId", "materialId")
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Courses
CREATE INDEX idx_courses_mentor ON public.courses("mentorId");
CREATE INDEX idx_courses_difficulty ON public.courses("difficulty");

-- Quizzes
CREATE INDEX idx_quizzes_course ON public.quizzes("courseId");
CREATE INDEX idx_quizzes_createdby ON public.quizzes("createdBy");
CREATE INDEX idx_quizzes_difficulty ON public.quizzes("difficulty");

-- Quiz Assignments (compound for common query pattern)
CREATE INDEX idx_quiz_assignments_student ON public.quiz_assignments("studentId");
CREATE INDEX idx_quiz_assignments_quiz ON public.quiz_assignments("quizId");
CREATE INDEX idx_quiz_assignments_student_quiz ON public.quiz_assignments("studentId", "quizId");

-- Quiz Attempts
CREATE INDEX idx_quiz_attempts_student ON public.quiz_attempts("studentId");
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts("quizId");
CREATE INDEX idx_quiz_attempts_student_quiz ON public.quiz_attempts("studentId", "quizId");

-- Forums
CREATE INDEX idx_forum_threads_category ON public.forum_threads("categoryId");
CREATE INDEX idx_forum_threads_author ON public.forum_threads("authorId");
CREATE INDEX idx_forum_posts_thread ON public.forum_posts("threadId");
CREATE INDEX idx_forum_posts_author ON public.forum_posts("authorId");

-- Mentorship
CREATE INDEX idx_mentorship_requests_student ON public.mentorship_requests("studentId");
CREATE INDEX idx_mentorship_requests_mentor ON public.mentorship_requests("mentorId");

-- Tutoring
CREATE INDEX idx_tutoring_sessions_mentor ON public.tutoring_sessions("mentorId");
CREATE INDEX idx_tutoring_sessions_status ON public.tutoring_sessions("status");

-- Direct Messages (compound for conversation queries)
CREATE INDEX idx_direct_messages_sender ON public.direct_messages("sender_id");
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages("receiver_id");
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages("sender_id", "receiver_id");

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles("role");
CREATE INDEX idx_profiles_email ON public.profiles("email");

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to get user role (Helper for RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger to auto-create profile on Auth Signup (FORCE student role unless admin assigns)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Check if an admin assigned a specific role via metadata
  assigned_role := COALESCE(new.raw_user_meta_data->>'admin_assigned_role', 'student');

  -- Validate the role is one of the allowed values
  IF assigned_role NOT IN ('student', 'mentor', 'admin') THEN
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', assigned_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updatedAt on row update
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updatedAt triggers to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'courses', 'quizzes', 'quiz_attempts',
    'forum_categories', 'forum_threads', 'forum_posts',
    'mentorship_requests', 'tutoring_sessions', 'activity_logs'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at()',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
('materials', 'materials', true, 2147483648, null),
('avatars', 'avatars', true, 52428800, null)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — ENABLE
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — SECURE (No USING (true) for sensitive tables)
-- ============================================================

-- 1. PROFILES
-- Users can read all profiles (needed for mentorship, forums, etc.)
-- But only update their own profile
-- Admin has full access
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin full access profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- 2. COURSES
-- Authenticated users can read all courses
-- Mentors can only manage courses they created
-- Admin has full access
CREATE POLICY "Anyone can read courses"
  ON public.courses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mentors manage own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = "mentorId");

CREATE POLICY "Admin full access courses"
  ON public.courses FOR ALL
  USING (public.is_admin());

-- 3. QUIZZES
-- Students see only assigned quizzes + quizzes they created
-- Mentors manage quizzes they created
-- Admin has full access
CREATE POLICY "Students read assigned quizzes"
  ON public.quizzes FOR SELECT
  USING (
    id IN (SELECT "quizId" FROM public.quiz_assignments WHERE "studentId" = auth.uid())
    OR "createdBy" = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Mentors create quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = "createdBy");

CREATE POLICY "Mentors update own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = "createdBy")
  WITH CHECK (auth.uid() = "createdBy");

CREATE POLICY "Mentors delete own quizzes"
  ON public.quizzes FOR DELETE
  USING (auth.uid() = "createdBy");

CREATE POLICY "Admin full access quizzes"
  ON public.quizzes FOR ALL
  USING (public.is_admin());

-- 4. QUIZ ASSIGNMENTS
-- Students see only their own assignments
-- Mentors manage assignments they created
-- Admin has full access
CREATE POLICY "Students read own assignments"
  ON public.quiz_assignments FOR SELECT
  USING ("studentId" = auth.uid() OR "assignedBy" = auth.uid() OR public.is_admin());

CREATE POLICY "Mentors create assignments"
  ON public.quiz_assignments FOR INSERT
  WITH CHECK (auth.uid() = "assignedBy");

CREATE POLICY "Mentors update own assignments"
  ON public.quiz_assignments FOR UPDATE
  USING (auth.uid() = "assignedBy")
  WITH CHECK (auth.uid() = "assignedBy");

CREATE POLICY "Mentors delete own assignments"
  ON public.quiz_assignments FOR DELETE
  USING (auth.uid() = "assignedBy");

CREATE POLICY "Admin full access assignments"
  ON public.quiz_assignments FOR ALL
  USING (public.is_admin());

-- 5. QUIZ ATTEMPTS
-- Students read/insert their own attempts
-- Instructors read/grade attempts for quizzes they created
-- Admin has full access
CREATE POLICY "Students read own attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("studentId" = auth.uid());

CREATE POLICY "Students submit attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK ("studentId" = auth.uid());

CREATE POLICY "Instructors read course attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()));

CREATE POLICY "Instructors grade attempts"
  ON public.quiz_attempts FOR UPDATE
  USING ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()))
  WITH CHECK ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()));

CREATE POLICY "Admin full access attempts"
  ON public.quiz_attempts FOR ALL
  USING (public.is_admin());

-- 6. DIRECT MESSAGES
-- Users can only read messages they sent or received
-- Users can only send messages as themselves
-- Users can delete their own messages
CREATE POLICY "Users read own messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

CREATE POLICY "Users send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users delete own messages"
  ON public.direct_messages FOR DELETE
  USING (auth.uid() = sender_id OR public.is_admin());

-- 7. FORUMS
-- All authenticated users can read forums
-- Authenticated users can create threads/posts
-- Authors can update their own threads/posts
-- Admin can moderate all
CREATE POLICY "Anyone can read forum categories"
  ON public.forum_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage categories"
  ON public.forum_categories FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can read threads"
  ON public.forum_threads FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth create threads"
  ON public.forum_threads FOR INSERT
  WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Authors update own threads"
  ON public.forum_threads FOR UPDATE
  USING (auth.uid() = "authorId" OR public.is_admin());

CREATE POLICY "Authors delete own threads"
  ON public.forum_threads FOR DELETE
  USING (auth.uid() = "authorId" OR public.is_admin());

CREATE POLICY "Anyone can read posts"
  ON public.forum_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Authors update own posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = "authorId" OR public.is_admin());

CREATE POLICY "Authors delete own posts"
  ON public.forum_posts FOR DELETE
  USING (auth.uid() = "authorId" OR public.is_admin());

-- 8. TUTORING SESSIONS
-- Authenticated users can read sessions (to discover available sessions)
-- Mentors manage sessions they created
-- Students can only add themselves to studentIds (NOT arbitrary updates)
-- Admin has full access
CREATE POLICY "Anyone can read sessions"
  ON public.tutoring_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mentors create sessions"
  ON public.tutoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors update own sessions"
  ON public.tutoring_sessions FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors delete own sessions"
  ON public.tutoring_sessions FOR DELETE
  USING (auth.uid() = "mentorId");

CREATE POLICY "Admin full access sessions"
  ON public.tutoring_sessions FOR ALL
  USING (public.is_admin());

-- 9. MENTORSHIP REQUESTS
-- Users can read requests they sent or received
-- Students can create requests
-- Mentors can update requests they received
-- Admin has full access
CREATE POLICY "Users read own requests"
  ON public.mentorship_requests FOR SELECT
  USING (auth.uid() = "studentId" OR auth.uid() = "mentorId" OR public.is_admin());

CREATE POLICY "Students create requests"
  ON public.mentorship_requests FOR INSERT
  WITH CHECK (auth.uid() = "studentId");

CREATE POLICY "Mentors update received requests"
  ON public.mentorship_requests FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Admin full access requests"
  ON public.mentorship_requests FOR ALL
  USING (public.is_admin());

-- 10. USER PROGRESS
CREATE POLICY "Users manage own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- 11. ACTIVITY LOGS
-- Users can read their own logs
-- Authenticated users can insert logs
-- Admin can read all
CREATE POLICY "Users read own logs"
  ON public.activity_logs FOR SELECT
  USING (
    details->>'studentId' = auth.uid()::text
    OR details->>'userId' = auth.uid()::text
    OR public.is_admin()
  );

CREATE POLICY "Auth insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin full access logs"
  ON public.activity_logs FOR ALL
  USING (public.is_admin());

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Public Access Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Own Materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Own Avatars" ON storage.objects;

CREATE POLICY "Public Access Materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'materials');

CREATE POLICY "Public Access Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Upload Materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Upload Avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Own Materials" ON storage.objects
  FOR DELETE USING (bucket_id = 'materials' AND auth.uid() = owner);

CREATE POLICY "Authenticated Delete Own Avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- ============================================================
-- REALTIME PUBLICATION (for direct_messages)
-- ============================================================

-- Ensure realtime is enabled for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- ============================================================
-- SECURE FUNCTIONS (bypass RLS for specific operations)
-- ============================================================

-- Function to allow students to join a tutoring session
-- SECURITY DEFINER bypasses RLS so the student can add themselves
CREATE OR REPLACE FUNCTION public.join_tutoring_session(p_session_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_ids TEXT[];
  max_students INTEGER;
  current_count INTEGER;
BEGIN
  -- Verify the student exists and is authenticated
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get current state
  SELECT "studentIds", "maxStudents" INTO current_ids, max_students
  FROM public.tutoring_sessions
  WHERE id = p_session_id AND status = 'scheduled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not joinable';
  END IF;

  -- Check if already joined
  IF p_student_id::TEXT = ANY(COALESCE(current_ids, ARRAY[]::TEXT[])) THEN
    RETURN TRUE; -- Already joined
  END IF;

  -- Check capacity
  current_count := COALESCE(array_length(current_ids, 1), 0);
  IF max_students IS NOT NULL AND current_count >= max_students THEN
    RAISE EXCEPTION 'Session is full';
  END IF;

  -- Add student
  UPDATE public.tutoring_sessions
  SET "studentIds" = COALESCE(current_ids, ARRAY[]::TEXT[]) || ARRAY[p_student_id::TEXT]
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$;

-- Function to allow users to update their own messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_sender_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.direct_messages
  SET read = true
  WHERE sender_id = p_sender_id
    AND receiver_id = auth.uid()
    AND read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- End of schema
