const { createClient } = require('@supabase/supabase-js');
const db = createClient('https://oairdwbupxhjdypbcdzl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g', { auth: { persistSession: false } });

async function check() {
    const r1 = await db.from('friend_requests').select('*').limit(1);
    console.log('friend_requests:', r1.data ? Object.keys(r1.data[0] || {}) : r1.error?.message);

    const r2 = await db.from('admin_messages').select('*').limit(1);
    console.log('admin_messages:', r2.data ? Object.keys(r2.data[0] || {}) : r2.error?.message);

    // Try to get all table info via postgres
    const r3 = await db.from('users').select('id, avatar, name').limit(2);
    console.log('sample user avatars:', r3.data?.map(u => ({ id: u.id, name: u.name, avatar: u.avatar?.substring(0, 50) })));
}
check();
