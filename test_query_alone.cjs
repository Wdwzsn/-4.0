const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function runTest() {
    console.log("---- Testing POSTS Query ----");
    const { data: posts, error: e1 } = await db.from('posts').select(`*, author:users(name, avatar), post_likes(id, user_id), comments(id, content, user_id, created_at, users(name))`).limit(1);
    console.log("Error:", e1);
    console.log("Posts Data:", posts);

    console.log("\n---- Testing EXERCISES Query ----");
    const { data: ex, error: e2 } = await db.from('exercises').select('*').limit(1);
    console.log("Error:", e2);
    console.log("Exercises Data:", ex);

    console.log("\n---- Testing FRIENDS Query ----");
    const { data: fr, error: e3 } = await db.from('friends').select('friend_id, friend:users!friends_friend_id_fkey(*)').limit(1);
    console.log("Error:", e3);
    console.log("Friends Data:", fr);
}
runTest();
