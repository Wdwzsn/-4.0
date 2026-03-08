// 使用 Node 修复 imports
const fs = require('fs');
try {
    let code = fs.readFileSync('services/apiService.ts', 'utf8');
    code = code.replace(/const\s+\{\s*directAuthAPI\s*\}\s*=\s*await\s+import\('\.\/directAuth'\);/g, '');
    code = code.replace(/const\s+\{\s*getAdminSupabase\s*\}\s*=\s*await\s+import\('\.\/directAuth'\);/g, '');
    if (!code.includes('import { directAuthAPI, getAdminSupabase }')) {
        code = `import { directAuthAPI, getAdminSupabase } from './directAuth';\n` + code;
    }
    fs.writeFileSync('services/apiService.ts', code);
    console.log('API Service imports fixed successfully.');
} catch (e) { console.error('Error:', e); }
