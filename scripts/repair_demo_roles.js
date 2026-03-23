
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env');
let SUPABASE_URL = '';
let SUPABASE_ANON = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON = value.trim();
        }
    });
}

if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error("Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const DEMO_ACCOUNTS = [
    { email: 'student@vidyasetu.com', password: 'student123', role: 'student' },
    { email: 'instructor@vidyasetu.com', password: 'instructor123', role: 'mentor' },
    { email: 'admin@vidyasetu.com', password: 'admin123', role: 'admin' }
];

async function repairRoles() {
    console.log("🛠️ Starting Demo Account Role Repair...");

    for (const account of DEMO_ACCOUNTS) {
        console.log(`\nProcessing ${account.email}...`);

        // 1. Login to get the user's ID (and verify credentials)
        const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password
        });

        if (loginError) {
            console.error(`❌ Login failed for ${account.email}:`, loginError.message);
            continue;
        }

        const userId = authData.user.id;
        console.log(`✅ Logged in. ID: ${userId}`);

        // 2. Fetch current profile to check role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            // If profile missing, trigger might have failed entirely.
            console.warn(`⚠️ Profile not found for ${account.email}. Attempting to create/insert via upsert.`);
        } else {
            console.log(`ℹ️ Current Role: ${profile.role || 'NULL'}`);
        }

        // 3. Update the role explicitly
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: account.email,
                role: account.role,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (updateError) {
            console.error(`❌ Failed to update role for ${account.email}:`, updateError.message);
        } else {
            console.log(`✅ Successfully set role to '${account.role}' for ${account.email}`);
        }

        // Logout to be clean
        await supabase.auth.signOut();
    }

    console.log("\n✨ Repair Complete.");
}

repairRoles();
