import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import http from 'http';

// Load env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TOKEN_SERVER_URL = 'http://localhost:3002/api/jitsi-token';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Env Vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAuth() {
    console.log("\n--- Checking Auth ---");
    const email = 'student@vidyasetu.com';
    const password = 'student123';
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error("❌ Auth Failed:", error.message);
        return false;
    }
    console.log("✅ Auth Success for:", email);
    return true;
}

async function checkTokenServer() {
    console.log("\n--- Checking Jitsi Token Server ---");
    return new Promise((resolve) => {
        const params = new URLSearchParams({
            room: 'vidyasetu-test-room',
            name: 'Integration Test',
            email: 'test@vidyasetu.com',
            id: 'test-user-id',
            role: 'student'
        });

        http.get(`${TOKEN_SERVER_URL}?${params.toString()}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.token && json.room === 'vidyasetu-test-room') {
                            console.log("✅ Token Server responded with valid token");
                            console.log("   Room:", json.room);
                            console.log("   Tenant:", json.tenant);
                            resolve(true);
                        } else {
                            console.error("❌ Token Server response invalid:", json);
                            resolve(false);
                        }
                    } catch (e) {
                        console.error("❌ Token Server response parse error:", e);
                        resolve(false);
                    }
                } else {
                    console.error(`❌ Token Server failed with status: ${res.statusCode}`);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error("❌ Token Server unreachable:", err.message);
            console.log("   (Make sure 'node server/token-server.js' is running)");
            resolve(false);
        });
    });
}

async function run() {
    console.log("🚀 Starting Integration Verification...");

    const authOk = await checkAuth();
    const tokenOk = await checkTokenServer();

    console.log("\n--- Summary ---");
    console.log(`Auth: ${authOk ? 'PASS' : 'FAIL'}`);
    console.log(`Token Server: ${tokenOk ? 'PASS' : 'FAIL'}`);

    if (authOk && tokenOk) {
        console.log("\n✅ INTEGRATION VERIFIED");
        process.exit(0);
    } else {
        console.error("\n❌ INTEGRATION FAILED");
        process.exit(1);
    }
}

run();
