import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EMAILS = ['student@vidyasetu.com', 'instructor@vidyasetu.com', 'admin@vidyasetu.com'];

async function checkRoles() {
    console.log("--- Checking User Roles in DB ---");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role')
        .in('email', EMAILS);

    if (error) {
        console.error("Error fetching profiles:", error.message);
        return;
    }

    profiles.forEach(p => {
        console.log(`User: ${p.email} | Role: ${p.role}`);
    });
}

checkRoles();
