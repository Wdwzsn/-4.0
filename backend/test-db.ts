import { supabase } from './src/config/supabase.js';

async function run() {
    console.log("Adding TestUser...");
    const newUser = {
        phone: '13999999998',
        password_hash: '12345',
        name: 'DirectInsert',
        avatar: `https://picsum.photos/seed/Test/400/400`,
        motto: '健康生活，长青不老',
        bio: '暂无介绍',
        age: '未知',
        gender: '未设置',
        province: '未设置',
        birthday: '未设置',
        routine: '每日功法练习',
        joined_date: new Date().getFullYear().toString(),
        streak: 1,
        last_checkin_date: null,
        last_active: new Date().toISOString(),
        is_real_user: true
    };
    const { data: user, error } = await supabase.from('users').insert(newUser).select().single();
    if (error) {
        console.error("DB INSERT ERR:", error);
    } else {
        console.log("DB INSET SUCCESS");
        const aiPhones = ['13800000001', '13800000002'];
        const { data: aiUsers } = await supabase.from('users').select('id').in('phone', aiPhones);
        console.log("AI Users:", aiUsers);
        if (aiUsers && aiUsers.length > 0) {
            const friendRecords = aiUsers.flatMap(aiUser => [
                { user_id: user.id, friend_id: aiUser.id, is_pinned: true },
                { user_id: aiUser.id, friend_id: user.id, is_pinned: false }
            ]);
            const res = await supabase.from('friends').insert(friendRecords);
            console.log("Friends Insert:", res);
        }
    }
}
run();
