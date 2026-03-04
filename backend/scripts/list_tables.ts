import { supabase } from '../src/config/supabase.ts';

async function listTables() {
    console.log('正在获取数据库表列表...');

    // 尝试通过查询内置的 pg_catalog 来获取表名
    const { data, error } = await supabase.rpc('get_tables');

    if (error) {
        console.log('无法使用 RPC 获取表列表，尝试基础查询...');
        // 尝试查询几个已知表来间接确认
        const tables = ['users', 'posts', 'announcements', 'game_scores', 'exercises'];
        for (const table of tables) {
            const { error: tableError } = await supabase.from(table).select('count').limit(1);
            if (!tableError) {
                console.log(`✅ 表存在: ${table}`);
            } else {
                console.log(`❌ 表不存在 或 权限错误: ${table} (${tableError.message})`);
            }
        }
    } else {
        console.log('数据库表:', data);
    }
}

listTables();
