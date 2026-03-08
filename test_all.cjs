const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://oairdwbupxhjdypbcdzl.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXJkd2J1cHhoamR5cGJjZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1Nzg2MiwiZXhwIjoyMDg2NjMzODYyfQ.8eNd-4WgdZADaiT8BdBeg1isBtsdHvL26o8aQqZmE9g';
const db = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

async function test() {
    console.log('=== 1. 检查 posts 表 ===');
    const { data: posts, error: pe } = await db.from('posts')
        .select('*, author:users!posts_author_id_fkey(name, avatar), post_likes(id, user_id), comments(id, content, author_id, created_at)')
        .limit(2);
    if (pe) console.log('❌ getPosts ERROR:', pe.message);
    else console.log('✅ getPosts OK. Count:', posts.length, 'First post:', posts[0]?.content?.substring(0, 30));

    console.log('\n=== 2. 检查 messages 表发送 ===');
    const firstUser = posts?.[0]?.author_id;
    if (firstUser) {
        const { data: msg, error: me } = await db.from('messages').insert({
            from_user_id: firstUser,
            to_user_id: firstUser,
            content: 'Test message from Node',
            role: 'user',
            is_read: false
        }).select().single();
        if (me) console.log('❌ sendMessage ERROR:', me.message);
        else { console.log('✅ sendMessage OK'); await db.from('messages').delete().eq('id', msg.id); }
    }

    console.log('\n=== 3. 检查 comments 插入 ===');
    if (posts?.length > 0) {
        const { data: cmt, error: ce } = await db.from('comments').insert({
            post_id: posts[0].id,
            author_id: posts[0].author_id,
            content: 'Test comment',
            parent_comment_id: null
        }).select().single();
        if (ce) console.log('❌ addComment ERROR:', ce.message);
        else { console.log('✅ addComment OK'); await db.from('comments').delete().eq('id', cmt.id); }
    }

    console.log('\n=== 4. 检查 post_likes 点赞 ===');
    if (posts?.length > 0) {
        const { error: le } = await db.from('post_likes').insert({
            post_id: posts[0].id,
            user_id: posts[0].author_id
        });
        if (le) console.log('❌ likePost ERROR:', le.message, '(可能已点过赞是重复，属正常)');
        else { console.log('✅ likePost insert OK'); await db.from('post_likes').delete().match({ post_id: posts[0].id, user_id: posts[0].author_id }); }
    }

    console.log('\n=== 5. 检查 friend_requests 插入 ===');
    const { data: users } = await db.from('users').select('id, phone').limit(2);
    if (users?.length >= 2) {
        const { data: freq, error: fre } = await db.from('friend_requests').insert({
            from_user_id: users[0].id,
            to_phone: users[1].phone,
            status: 'pending'
        }).select().single();
        if (fre) console.log('❌ sendFriendRequest ERROR:', fre.message);
        else { console.log('✅ sendFriendRequest OK'); await db.from('friend_requests').delete().eq('id', freq.id); }
    }

    console.log('\n=== 6. 检查 exercises 表 ===');
    const { data: exs, error: exe } = await db.from('exercises').select('*').limit(2);
    if (exe) console.log('❌ exercises ERROR:', exe.message);
    else {
        console.log('✅ exercises OK. Count:', exs.length);
        if (exs[0]) console.log('   Fields:', Object.keys(exs[0]));
        if (exs[0]?.thumbnail) console.log('   thumbnail:', exs[0].thumbnail.substring(0, 60));
        if (exs[0]?.video_url) console.log('   video_url:', exs[0].video_url.substring(0, 80));
    }

    console.log('\n=== 7. 检查 exercises 新增 ===');
    const { data: newEx, error: nee } = await db.from('exercises').insert({
        title: '测试功法',
        description: '测试用',
        category: '健身',
        video_url: 'https://test.com/test.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&q=80'
    }).select().single();
    if (nee) console.log('❌ createExercise ERROR:', nee.message);
    else { console.log('✅ createExercise OK'); await db.from('exercises').delete().eq('id', newEx.id); }

    console.log('\n=== 8. 检查图片存储 Bucket ===');
    const { data: buckets } = await db.storage.listBuckets();
    console.log('Buckets:', buckets?.map(b => b.name));

    const { data: videoFiles } = await db.storage.from('videos').list();
    console.log('Videos bucket files:', videoFiles?.length, 'files');
    if (videoFiles?.[0]) {
        const { data: urlData } = db.storage.from('videos').getPublicUrl(videoFiles[0].name);
        console.log('Sample video URL:', urlData?.publicUrl?.substring(0, 80));
    }

    console.log('\n=== 9. 检查 users.phone 是否存在 (friend requests 需要) ===');
    const { data: userWithPhone } = await db.from('users').select('id, phone, name, avatar').limit(1);
    console.log('User with phone:', userWithPhone?.[0]);

    console.log('\n=== 测试完成 ===');
}

test().catch(console.error);
