import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzaeicbdbscljwavnpew.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWVpY2JkYnNjbGp3YXZucGV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0MjExMiwiZXhwIjoyMDg5ODE4MTEyfQ.vtPqCurTtWWLJXTF5Z-tsGdk366mUhvpchX_iWSBElM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createSkillforgeUsers() {
    const users = [
        { email: 'admin@skillforge.com', password: 'admin123', name: 'Admin', role: 'admin' },
        { email: 'instructor@skillforge.com', password: 'instructor123', name: 'Instructor', role: 'mentor' },
        { email: 'student@skillforge.com', password: 'student123', name: 'Student', role: 'student' }
    ];

    for (const u of users) {
        console.log(`Creating user ${u.email}...`);
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: {
                name: u.name,
                admin_assigned_role: u.role // This will be picked up by the handle_new_user trigger
            }
        });

        if (error) {
            console.error(`Failed to create ${u.email}:`, error);
        } else {
            console.log(`Created ${u.email} successfully.`);
        }
    }
}

createSkillforgeUsers();
