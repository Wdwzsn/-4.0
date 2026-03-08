import { getAdminSupabase } from './services/directAuth';

async function test() {
    console.log("Starting tests...");
    const db = getAdminSupabase();

    // Test 1: getPosts
    console.log("Testing getPosts...");
    const { data: posts, error: e1 } = await db.from('posts').select(`
        *,
        author:users(name, avatar),
        post_likes(id, user_id),
        comments(id, content, user_id, created_at, users(name))
    `).order('created_at', { ascending: false }).limit(2);

    if (e1) {
        console.error("❌ getPosts failed:", e1.message);
    } else {
        console.log("✅ getPosts ok, count:", posts?.length);
    }

    // Test 2: getExercises
    console.log("Testing getExercises...");
    const { data: exercises, error: e2 } = await db.from('exercises').select('*').order('created_at', { ascending: false }).limit(2);
    if (e2) {
        console.error("❌ getExercises failed:", e2.message);
    } else {
        console.log("✅ getExercises ok, count:", exercises?.length);
    }

    // Test 3: getFriends
    console.log("Testing getFriends...");
    // 假设查询 id 为 1
    const { data: friends1, error: e3 } = await db.from('friends').select('friend_id, friend:users!friends_friend_id_fkey(*)').limit(1);
    if (e3) {
        console.error("❌ getFriends failed:", e3.message);
    } else {
        console.log("✅ getFriends ok.");
    }

    // Test 4: Messages
    console.log("Testing Messages...");
    const { error: e4 } = await db.from('messages').select('*').limit(1);
    if (e4) {
        console.error("❌ getMessages failed:", e4.message);
    } else {
        console.log("✅ getMessages ok.");
    }
}
test();
