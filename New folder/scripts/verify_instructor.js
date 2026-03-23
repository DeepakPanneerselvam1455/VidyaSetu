
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqxwonqqwyxsfhqazeze.supabase.co';
const supabaseKey = 'sb_publishable_RoQBsUL9z_KXtbZkKnf_DQ_WjOBi2ko';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyInstructor() {
    try {
        console.log('--- Testing Instructor Login ---');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'instructor@vidyasetu.com',
            password: 'instructor123',
        });

        if (error) {
            console.error('LOGIN FAILED:', error.message);
            return;
        }

        console.log('LOGIN SUCCESS. User ID:', data.user.id);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('PROFILE FETCH FAILED:', profileError.message);
            return;
        }

        console.log('PROFILE FOUND:', profile.name);
        console.log('VERIFICATION COMPLETE');
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

verifyInstructor();
// Keep alive briefly to allow IO flush
setTimeout(() => { }, 2000);
