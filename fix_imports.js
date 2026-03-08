const fs = require('fs');
let code = fs.readFileSync('services/apiService.ts', 'utf8');
code = code.replace(/const\s+\{\s*directAuthAPI\s*\}\s*=\s*await\s+import\('\.\/directAuth'\);/g, '');
code = code.replace(/const\s+\{\s*getAdminSupabase\s*\}\s*=\s*await\s+import\('\.\/directAuth'\);/g, '');
code = `import { directAuthAPI, getAdminSupabase } from './directAuth';\n` + code;
fs.writeFileSync('services/apiService.ts', code);
console.log('Imports fixed.');
