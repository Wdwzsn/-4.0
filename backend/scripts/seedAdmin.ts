
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const resetAdmin = async () => {
    try {
        console.log('Resetting admin password...');
        const passwordHash = await bcrypt.hash('123456', 10);

        const { error } = await supabase
            .from('admin_accounts')
            .upsert({
                username: 'admini',
                password_hash: passwordHash,
                role: 'super_admin'
            }, { onConflict: 'username' });

        if (error) throw error;
        console.log('Admin password reset successfully to: 123456');
    } catch (error) {
        console.error('Failed to reset admin:', error);
    }
};

resetAdmin();
