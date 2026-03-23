
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqxwonqqwyxsfhqazeze.supabase.co';
const supabaseKey = 'sb_publishable_RoQBsUL9z_KXtbZkKnf_DQ_WjOBi2ko';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_CREDENTIALS = {
    student: { email: 'student@vidyasetu.com', password: 'student123' },
    instructor: { email: 'instructor@vidyasetu.com', password: 'instructor123' },
    admin: { email: 'admin@vidyasetu.com', password: 'admin123' },
};

async function verify() {
    let allSuccess = true;
    for (const [role, creds] of Object.entries(DEMO_CREDENTIALS)) {
        console.log(`--- ${role} ---`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
        });

        if (error) {
            console.log(`[FAIL] Login: ${error.message}`);
            allSuccess = false;
        } else {
            console.log(`[PASS] Login: ${data.user.id}`);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('name, role')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                console.log(`[FAIL] Profile: ${profileError?.message || 'Missing'}`);
                allSuccess = false;
            } else {
                console.log(`[PASS] Profile: ${profile.name} (${profile.role})`);
            }
        }
    }

    if (!allSuccess) process.exit(1);
}

verify();
