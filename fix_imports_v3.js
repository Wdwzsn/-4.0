import fs from 'fs';
try {
    let code = fs.readFileSync('services/apiService.ts', 'utf8');
    code = code.replace(/const\s+\{\s*directAuthAPI\s*\}\s*=\s*await\s+import\('\.\/directAuth'\);/g, '');
    code = code.replace(/const\s+\{\s*getAdminSupabase\s*\}\s*=\s*await\s+import\('\.\/directAuth'\);/g, '');
    if (!code.includes('import { directAuthAPI, getAdminSupabase }')) {
        code = code.replace(/import axios/, `import { directAuthAPI, getAdminSupabase } from './directAuth';\nimport axios`);
    }
    fs.writeFileSync('services/apiService.ts', code);
    console.log('API Service imports fixed successfully.');
} catch (e) { console.error('Error:', e); }
