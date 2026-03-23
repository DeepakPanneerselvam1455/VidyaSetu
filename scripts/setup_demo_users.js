
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzaeicbdbscljwavnpew.supabase.co';
const supabaseKey = 'sb_publishable_2CVkR2xZtZRIx-aqGiyf9A_YvzQKMpq';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_CREDENTIALS = {
    student: { email: 'student@vidyasetu.com', password: 'student123', role: 'student', name: 'Demo Student' },
    instructor: { email: 'instructor@vidyasetu.com', password: 'instructor123', role: 'mentor', name: 'Demo Instructor' },
    admin: { email: 'admin@vidyasetu.com', password: 'admin123', role: 'admin', name: 'Demo Admin' },
};

async function setup() {
    console.log('Starting demo user setup...');

    for (const [key, creds] of Object.entries(DEMO_CREDENTIALS)) {
        console.log(`Checking ${key} user (${creds.email})...`);

        // 1. Try to Login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
        });

        if (!loginError && loginData.user) {
            console.log(`✅ ${key} user already exists and login successful.`);
            continue;
        }

        console.log(`Login failed for ${key}: ${loginError?.message || 'Unknown error'}. Attempting to register...`);

        // 2. Try to Register
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: creds.email,
            password: creds.password,
        });

        if (signUpError) {
            console.error(`❌ Failed to register ${key}:`, signUpError.message);
            continue;
        }

        if (!signUpData.user) {
            console.error(`❌ Registration for ${key} returned no user.`);
            continue;
        }

        console.log(`User created for ${key}. Creating profile...`);

        // 3. Create Profile
        // Note: If signUp returns an existing user but login failed (e.g. wrong password), we can't easily fix password here without admin.
        // However, if signUp succeeded (new user created), we need to create profile.

        // Check if profile exists first (to avoid duplicate key error if user existed in Auth but not Profile?)
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signUpData.user.id)
            .single();

        if (existingProfile) {
            console.log(`Profile already exists for ${key}.`);
        } else {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: signUpData.user.id,
                    email: creds.email,
                    name: creds.name,
                    role: creds.role,
                    createdAt: new Date().toISOString(),
                    accountStatus: 'ENABLED',
                    bio: `Hello! I am a demo ${creds.role}.` // Default bio
                }]);

            if (profileError) {
                console.error(`❌ Failed to create profile for ${key}:`, profileError.message);
            } else {
                console.log(`✅ Profile created for ${key}. Setup complete.`);
            }
        }
    }
}

setup();
