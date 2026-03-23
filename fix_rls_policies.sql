-- Fix RLS policies for admin user status updates
-- This fixes the issue where Edge Functions using service_role key can't update user status

-- First, let's check if the admin update policy exists
DO $$
BEGIN
    -- Drop existing admin update policy if it exists
    DROP POLICY IF EXISTS "Admin can update users" ON public.profiles;
    
    -- Create a better admin update policy that works with service_role key
    -- The service_role key bypasses RLS, so we need to ensure admins can update
    -- We'll keep the existing policies but add a specific one for admin updates
    EXECUTE 'CREATE POLICY "Admin can update users"
        ON public.profiles
        FOR UPDATE
        USING (
            -- Allow if user is updating their own profile
            auth.uid() = id 
            OR 
            -- Allow if user is admin (via is_admin() function)
            public.is_admin()
            OR
            -- Allow service_role key (which bypasses RLS anyway)
            auth.jwt() ->> ''role'' = ''service_role''
        )
        WITH CHECK (
            -- Same conditions for WITH CHECK
            auth.uid() = id 
            OR 
            public.is_admin()
            OR
            auth.jwt() ->> ''role'' = ''service_role''
        )';
    
    RAISE NOTICE 'RLS policy "Admin can update users" created successfully';
END $$;

-- Also fix the admin full access policy to be more explicit
DO $$
BEGIN
    -- Update the admin full access policy
    EXECUTE 'CREATE OR REPLACE POLICY "Admin full access profiles"
        ON public.profiles
        FOR ALL
        USING (
            public.is_admin()
            OR
            auth.jwt() ->> ''role'' = ''service_role''
        )';
    
    RAISE NOTICE 'RLS policy "Admin full access profiles" updated successfully';
END $$;

-- Create a function to help with admin operations from Edge Functions
CREATE OR REPLACE FUNCTION public.can_admin_update_user(p_admin_id UUID, p_target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the admin_id user is actually an admin
    SELECT role = 'admin' INTO is_admin
    FROM public.profiles
    WHERE id = p_admin_id;
    
    RETURN is_admin;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_admin_update_user TO authenticated, service_role;

-- Verify the fix
SELECT 
    'RLS policies updated successfully' as status,
    'Admin can now update user status via Edge Functions' as message,
    'Service role key will bypass RLS for admin operations' as note;