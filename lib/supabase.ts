import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Diagnostic Logs (safe to keep in dev) ---
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Anon Key exists:', !!supabaseAnonKey);
console.log('[Supabase] Anon Key prefix:', supabaseAnonKey?.substring(0, 20));

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
    );
}

// Warn if the anon key doesn't look like a valid JWT (should start with 'eyJ')
if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error(
        '[Supabase] ⚠️  INVALID ANON KEY FORMAT!\n' +
        'The VITE_SUPABASE_ANON_KEY does not look like a valid Supabase JWT.\n' +
        'Valid keys start with "eyJ". Current key starts with: "' + supabaseAnonKey.substring(0, 20) + '"\n' +
        'Please copy the correct anon/public key from your Supabase project dashboard:\n' +
        'https://supabase.com/dashboard → Project Settings → API → Project API keys'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
