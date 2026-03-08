import fs from 'fs';
const baseReplace = (file) => {
    let code = fs.readFileSync(file, 'utf8');
    // 把指向 directAuth 的改为指向 supabaseClient
    code = code.replace(/import\s*\{\s*directAuthAPI\s*,\s*getAdminSupabase\s*\}\s*from\s*'(\.\/)?directAuth';/g,
        "import { directAuthAPI } from '$1directAuth';\nimport { getAdminSupabase } from './supabaseClient';");
    code = code.replace(/import\s*\{\s*getAdminSupabase\s*\}\s*from\s*'(\.\/)?directAuth';/g,
        "import { getAdminSupabase } from '$1supabaseClient';");

    // 特殊情况处理（如果 ./services/directAuth 等）
    code = code.replace(/from\s*'\.\/services\/supabaseClient'/g, "from './supabaseClient'");
    fs.writeFileSync(file, code);
};

// 1. 服务层
baseReplace('services/apiService.ts');
baseReplace('services/directAuth.ts');

// directAuth 中原本定义了 adminSupabase，现在需要把它删掉，改从 supabaseClient 拿
let authCode = fs.readFileSync('services/directAuth.ts', 'utf8');
authCode = authCode.replace(/import\s*\{\s*createClient\s*\}\s*from\s*'@supabase\/supabase-js';\n/g, '');
authCode = authCode.replace(/const\s+SUPABASE_URL\s+=[\s\S]*?=\s*\(\)\s*=>\s*adminSupabase;/m, "import { adminSupabase } from './supabaseClient';");
fs.writeFileSync('services/directAuth.ts', authCode);

// 2. 组件及入口可能有使用 directAuth 的，全部指向新的 client
try {
    let appCode = fs.readFileSync('App.tsx', 'utf8');
    appCode = appCode.replace(/import\s*\{\s*getAdminSupabase\s*\}\s*from\s*'\.\/services\/directAuth';/g, "import { getAdminSupabase } from './services/supabaseClient';");
    fs.writeFileSync('App.tsx', appCode);
} catch (e) { }

console.log('Fixed circular dependencies and extracted getAdminSupabase.')
