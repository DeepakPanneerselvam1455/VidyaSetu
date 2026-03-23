import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    const value = values.join('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log("Attempting to login...");
    const start = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'student@skillforge.com',
        password: 'student123'
    });
    
    console.log(`Time taken: ${Date.now() - start}ms`);
    
    if (error) {
        console.error("Login Error:", error);
    } else if (data.user) {
        console.log("User authenticated, fetching profile...");
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profileError) {
            console.error("Profile Fetch Error:", profileError);
        } else {
            console.log("Fetched profile successfully:", profile);
        }
    }
}

testLogin();
