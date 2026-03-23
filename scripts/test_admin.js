import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function testAdmin() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@skillforge.com',
        password: 'admin123'
    });

    if (authError) return console.error("Login failed:", authError.message);
    const adminUser = authData.user;

    const { data: users, error: getError } = await supabase.from('profiles').select('*');
    if (getError) return console.error("Get users failed:", getError);
    
    const student = users.find(u => u.role === 'student');
    if (!student) return console.error("No student found.");

    // Simulate api.updateUser exact behavior
    const updatedStudentData = { ...student, name: student.name + ' (Full Object Update)' };
    
    const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(updatedStudentData)
        .eq('id', updatedStudentData.id)
        .select();

    if (updateError) {
        console.error("FAILED to update full user object:", updateError.message, updateError.details, updateError.hint);
    } else {
        console.log("SUCCESS! Full user object updated:", updateData[0].name);
    }
}

testAdmin().catch(console.error);
