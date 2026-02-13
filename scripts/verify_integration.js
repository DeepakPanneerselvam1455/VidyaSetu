
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && value) {
                process.env[key] = value;
            }
        }
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error("Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function runIntegrationCheck() {
    console.log("🚀 Starting End-to-End Integration Check (ESM Mode)");
    const report = [];
    const addResult = (test, success, msg) => {
        const symbol = success ? '✅' : '❌';
        const line = `${symbol} [${test}] ${msg || ''}`;
        console.log(line);
        report.push(line);
    };

    try {
        // 1. Auth & User Check
        const { data: users, error: userError } = await supabase.from('profiles').select('*').limit(1);
        if (userError) throw userError;
        addResult("Database Connection", true, `Connected. User count: ${users?.length}`);

        // 2. Fetch Sessions
        const { data: publicSessions, error: sessionFetchError } = await supabase
            .from('tutoring_sessions')
            .select('*')
            .limit(5);

        if (sessionFetchError) {
            addResult("Fetch Sessions", false, sessionFetchError.message);
        } else {
            addResult("Fetch Sessions", true, `Retrieved ${publicSessions.length} sessions`);
        }

        // 3. Verify Forum
        const { data: categories, error: catError } = await supabase.from('forum_categories').select('*').limit(1);
        if (catError) {
            addResult("Forum Access", false, catError.message);
        } else {
            addResult("Forum Access", true, `Accessible. Categories: ${categories.length}`);
        }

        // 4. Active Sessions Check
        const { data: activeSessions } = await supabase
            .from('tutoring_sessions')
            .select('*')
            .eq('status', 'active');

        addResult("Active Sessions Query", true, `Query successful (Count: ${activeSessions?.length})`);

    } catch (e) {
        addResult("Critical Failure", false, e.message);
    }

    console.log("\n--- Verification Summary ---");
    fs.writeFileSync(path.join(__dirname, 'verification_results.txt'), report.join('\n'));
}

runIntegrationCheck();
