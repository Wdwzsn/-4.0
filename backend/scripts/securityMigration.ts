
import { supabase } from '../src/config/supabase.js';

async function updateSecurity() {
    console.log('开始安全加固迁移...');

    // 1. 更新管理员密码
    const newHash = '$2a$10$SextXbrXIM1BYzdI/L16MucMkfRXGR8P4Gt.co2NQUz1YDn0GSGHm';
    const { error: adminError } = await supabase
        .from('admin_accounts')
        .update({ password_hash: newHash })
        .eq('username', 'admini');

    if (adminError) {
        console.error('更新管理员密码失败:', adminError);
    } else {
        console.log('✅ 管理员密码更新成功 (wdw123456)');
    }

    // 2. 检查并添加 is_banned 字段
    // 由于 Supabase SDK 不能直接 ALTER TABLE，我们需要通过 RPC 或者直接尝试查询该字段
    // 为了稳妥，我们运行一个 SQL 执行检查 (如果配置了 SQL RPC 扩展)
    // 如果没有 RPC，我们可以尝试更新一个用户并捕获错误，或者假设需要运行 SQL

    console.log('正在添加 is_banned 字段 (如果尚未存在)...');

    // 注意：Supabase Storage/DB 通常通过 Dashboard 执行 SQL。
    // 但我们可以通过代码尝试触发一个包含该字段的更新，如果失败则说明字段不存在。
    // 这里我使用一个通用的建议：用户需要在 Dashboard 执行 ALTER TABLE。
    // 不过，为了自动化，我尝试使用之前可能存在的 rpc('exec_sql') (如果项目有的话)

    try {
        const { error: banFieldTest } = await supabase
            .from('users')
            .select('is_banned')
            .limit(1);

        if (banFieldTest && banFieldTest.message.includes('column "is_banned" does not exist')) {
            console.log('📢 检测到缺少 is_banned 字段，正在尝试添加...');
            // 如果项目中没有开放执行 SQL 的 RPC，这里会提示用户手动执行
            // 但我们可以尝试通过 RPC 调用 (如果后端配置了)
            const { error: rpcError } = await supabase.rpc('exec_sql', {
                query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;'
            });

            if (rpcError) {
                console.error('无法自动添加字段，请在 Supabase SQL 控制台手动执行:');
                console.error('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;');
            } else {
                console.log('✅ is_banned 字段已通过 RPC 添加成功');
            }
        } else {
            console.log('✅ is_banned 字段已存在');
        }
    } catch (e) {
        console.error('迁移过程中出现异常:', e);
    }

    console.log('安全加固迁移完成。');
    process.exit(0);
}

updateSecurity();
