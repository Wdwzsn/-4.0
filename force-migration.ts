import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
    console.log('Attempting to add is_banned column to users table...');
    // Note: Using RPC if available, or just letting it fail gracefully if already exists
    const { error } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;'
    });

    if (error) {
        console.error('Migration via RPC failed:', error.message);
        console.log('Checking if column exists anyway...');
        const { error: err2 } = await supabase.from('users').select('is_banned').limit(1);
        if (!err2) {
            console.log('Column is_banned already exists. All good!');
        } else {
            console.error('Column is still missing. Please run this SQL in Supabase dashboard:');
            console.log('ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;');
        }
    } else {
        console.log('Successfully added is_banned column!');
    }
}

fix();
