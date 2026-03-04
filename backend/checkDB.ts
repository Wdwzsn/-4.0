import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDb() {
    console.log('Checking users table...');
    const { error: usersError } = await supabase.from('users').select('id').limit(1);
    if (usersError) console.error('Users error:', usersError);
    else console.log('Users table OK');

    console.log('Checking exercises table...');
    const { error: exError } = await supabase.from('exercises').select('*').limit(1);
    if (exError) console.error('Exercises error:', exError);
    else console.log('Exercises table OK');
}

checkDb();
