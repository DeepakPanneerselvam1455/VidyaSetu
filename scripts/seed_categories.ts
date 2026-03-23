
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
    { name: 'General Discussion', description: 'Chat about anything related to VidyaSetu', icon: 'message-circle' },
    { name: 'Course Help', description: 'Get help with specific courses or assignments', icon: 'book' },
    { name: 'Career Advice', description: 'Discussions about career paths and interviews', icon: 'briefcase' },
    { name: 'Technical Support', description: 'Report bugs or ask about platform issues', icon: 'tool' },
    { name: 'Showcase', description: 'Show off your projects and achievements', icon: 'star' }
];

async function seed() {
    console.log("Checking existing categories...");
    const { data: existing } = await supabase.from('forum_categories').select('id');

    if (existing && existing.length > 0) {
        console.log("Categories already exist. Skipping seed.");
        return;
    }

    console.log("Seeding categories...");
    const { error } = await supabase.from('forum_categories').insert(categories);

    if (error) {
        console.error("Error seeding categories:", error);
    } else {
        console.log("Successfully seeded forum categories!");
    }
}

seed();
