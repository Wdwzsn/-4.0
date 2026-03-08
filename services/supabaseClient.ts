import { createClient } from '@supabase/supabase-js';

// 使用 Service Role Key 直接访问数据库
const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';

export const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

export const getAdminSupabase = () => adminSupabase;
