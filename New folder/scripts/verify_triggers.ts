
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTriggers() {
    console.log('--- Verifying Triggers ---');

    // 1. Verify User Creation Trigger
    console.log('\n1. Testing User Creation Trigger (handle_new_user)...');
    const testEmail = `trigger_test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Trigger Test User';

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                name: testName,
                role: 'student'
            }
        }
    });

    if (authError) {
        console.error('❌ Auth SignUp failed:', authError.message);
    } else if (authData.user) {
        console.log(`✅ Auth user created: ${authData.user.id}`);

        // Wait a moment for trigger to fire
        await new Promise(r => setTimeout(r, 2000));

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile lookup failed:', profileError.message);
            console.error('   This implies the trigger did NOT fire or failed.');
        } else if (profile) {
            console.log('✅ Profile found in public.profiles!');
            console.log('   Trigger `on_auth_user_created` is WORKING.');
            console.log('   Profile Name:', profile.name);
        } else {
            console.error('❌ Profile not found (no error, just null).');
        }
    }

    // 2. Verify UpdatedAt Trigger
    console.log('\n2. Testing Timestamp Trigger (handle_updated_at)...');
    // We'll use forum_categories as it's simple
    const testCategoryName = `Test Category ${Date.now()}`;

    // Insert
    const { data: catData, error: catError } = await supabase
        .from('forum_categories')
        .insert([{ name: testCategoryName, icon: 'test', description: 'test' }])
        .select()
        .single();

    if (catError) {
        console.error('❌ Insert failed:', catError.message);
        // Fallback to checking a course if categories are restricted (though RLS was open)
    } else if (catData) {
        console.log(`✅ Created test category: ${catData.id}`);
        console.log(`   Initial updatedAt: ${catData.updatedAt}`);

        // Wait to ensure timestamp difference
        await new Promise(r => setTimeout(r, 1500));

        // Update
        const { data: updatedCat, error: updateError } = await supabase
            .from('forum_categories')
            .update({ description: 'Updated description' })
            .eq('id', catData.id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Update failed:', updateError.message);
        } else if (updatedCat) {
            console.log(`   New updatedAt:     ${updatedCat.updatedAt}`);

            if (updatedCat.updatedAt > catData.updatedAt) {
                console.log('✅ updatedAt updated successfully!');
                console.log('   Trigger `handle_updated_at` is WORKING.');
            } else {
                console.error('❌ updatedAt did NOT change.');
            }

            // Cleanup
            await supabase.from('forum_categories').delete().eq('id', catData.id);
            console.log('   (Cleaned up test category)');
        }
    }

    console.log('\n--- Verification Complete ---');
}

verifyTriggers();
