
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

async function checkRoles() {
    console.log("Checking User Roles...");
    const { data: users, error } = await supabase.from('profiles').select('id, role, email, name');

    if (error) {
        console.error("Error fetching profiles:", error.message);
        return;
    }

    console.log(`Found ${users.length} profiles.`);
    const roles = users.map(u => u.role);
    const uniqueRoles = [...new Set(roles)];

    console.log("Distinct Roles Found:", uniqueRoles);

    const missingRole = users.filter(u => !u.role);
    if (missingRole.length > 0) {
        console.error(`Warning: ${missingRole.length} users have NO role! IDs: ${missingRole.map(u => u.id).join(', ')}`);
    } else {
        console.log("All users have a role assigned.");
    }

    users.forEach(u => {
        console.log(`- ${u.email} (${u.name}): [${u.role}]`);
    });
}

checkRoles();
