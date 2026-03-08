const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function runTest() {
    const { data: c } = await db.from('comments').select('*').limit(1);
    console.log("Comments columns:", c && c.length > 0 ? Object.keys(c[0]) : "Empty table");

    const { data: f } = await db.from('friends').select('*').limit(1);
    console.log("Friends columns:", f && f.length > 0 ? Object.keys(f[0]) : "Empty table");
}
runTest();
