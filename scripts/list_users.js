
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqxwonqqwyxsfhqazeze.supabase.co';
const supabaseKey = 'sb_publishable_RoQBsUL9z_KXtbZkKnf_DQ_WjOBi2ko';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Existing profiles:', data);
    }
}

listUsers();
