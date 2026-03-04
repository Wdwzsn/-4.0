import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Fetching one user to check columns...');
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
            console.log('Data:', data[0]);
        } else {
            console.log('No users found in the table.');
        }
    }

    const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error counting users:', countError);
    } else {
        console.log('Total user count:', count);
    }
}

check();
