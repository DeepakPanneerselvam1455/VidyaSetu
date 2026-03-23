-- Fix: Enable RLS on quiz_assignments (if not already enabled)
ALTER TABLE public.quiz_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view assigned quizzes" ON public.quiz_assignments;
DROP POLICY IF EXISTS "Instructors manage assignments" ON public.quiz_assignments;
DROP POLICY IF EXISTS "Admin full access" ON public.quiz_assignments;

-- 1. Students can ONLY see assigned quizzes:
CREATE POLICY "Students can view assigned quizzes"
ON public.quiz_assignments
FOR SELECT
USING ("studentId" = auth.uid());

-- 2. Instructors can manage assignments:
CREATE POLICY "Instructors manage assignments"
ON public.quiz_assignments
FOR ALL
USING ("assignedBy" = auth.uid());

-- 3. Admin full access:
CREATE POLICY "Admin full access"
ON public.quiz_assignments
FOR ALL
USING (auth.jwt() ->> 'role' = 'admin' OR public.get_user_role() = 'admin');


-- Fix: Admin can update users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: the 'accountStatus' column is used for 'enabled/disabled' status.
-- Ensure we provide Admin Update access.
DROP POLICY IF EXISTS "Admin can update users" ON public.profiles;

CREATE POLICY "Admin can update users"
ON public.profiles
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin' OR public.get_user_role() = 'admin');
