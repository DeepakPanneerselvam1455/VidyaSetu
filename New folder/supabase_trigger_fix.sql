-- Drop existing trigger to avoid conflicts during replacement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, "createdAt", "accountStatus")
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    -- Prioritize role from metadata, default to 'student' if missing or null
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    NOW(),
    'ENABLED'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role, -- Ensure role is updated if profile exists but role was wrong
    email = EXCLUDED.email,
    name = EXCLUDED.name;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Optional: Run a backfill for any existing profiles with NULL role
UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL;

-- CRITICAL: Repair existing demo accounts
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@vidyasetu.com';
UPDATE public.profiles SET role = 'mentor' WHERE email = 'instructor@vidyasetu.com';
UPDATE public.profiles SET role = 'student' WHERE email = 'student@vidyasetu.com';
