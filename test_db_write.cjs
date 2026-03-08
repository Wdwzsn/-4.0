const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function runTest() {
    console.log("Testing POST comments insertion...");
    // Let's get a valid post_id and user_id first
    const { data: posts } = await db.from('posts').select('id, user_id').limit(1);
    if (!posts || posts.length === 0) { console.log("No posts found"); return; }

    const postId = posts[0].id;
    const authorId = posts[0].user_id; // we just use the post author as the commenter

    console.log("Using Post ID:", postId, "Author ID:", authorId);

    const { data: cData, error: cErr } = await db.from('comments').insert({
        post_id: postId,
        author_id: authorId,
        content: 'test comment'
    }).select();

    console.log("Insert comment result:", cData, cErr ? cErr.message : "No error");

    // Also testing exercises likes update
    console.log("Testing updating exercises likes...");
    const { data: ex } = await db.from('exercises').select('id').limit(1);
    if (ex && ex.length > 0) {
        const { error: eErr } = await db.from('exercises').update({ thumbnail: 'test' }).eq('id', ex[0].id);
        console.log("Update exercise result:", eErr ? eErr.message : "Success");
    }
}
runTest();
