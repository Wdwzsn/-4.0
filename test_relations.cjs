const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function runTest() {
    // Test Posts with author_id instead of user_id
    console.log("Testing POSTS...");
    const { data: p, error: ep } = await db.from('posts').select(`*, author:users(name, avatar), post_likes(id, user_id), comments(id, content, author_id, created_at, users(name))`).limit(1);
    console.log("POST error:", ep ? ep.message : "None");
    if (p) console.log("POST data ok");
    else {
        // Fallback test
        const { error: ep2 } = await db.from('posts').select(`*, post_likes(*), comments(*)`).limit(1);
        console.log("POST raw error:", ep2 ? ep2.message : "None");
    }

    // Test friends exactly as in apiService
    console.log("Testing FRIENDS 1...");
    const { data: f1, error: ef1 } = await db.from('friends').select('friend_id, friend:users!friends_friend_id_fkey(*)').eq('user_id', '1').limit(1);
    console.log("FRIENDS 1 error:", ef1 ? ef1.message : "None");

    console.log("Testing FRIENDS 2...");
    const { data: f2, error: ef2 } = await db.from('friends').select('user_id, friend:users!friends_user_id_fkey(*)').eq('friend_id', '1').limit(1);
    console.log("FRIENDS 2 error:", ef2 ? ef2.message : "None");
}
runTest();
