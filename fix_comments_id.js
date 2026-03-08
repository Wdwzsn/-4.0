import fs from 'fs';
let code = fs.readFileSync('services/apiService.ts', 'utf8');
code = code.replace('comments(id, content, user_id, created_at, users(name))', 'comments(id, content, author_id, created_at, users(name))');
// 替换 addComment 中的 user_id
code = code.replace('user_id: user.id,\n            content: data.content\n        });\n        return { success: true };\n    },', 'author_id: user.id,\n            content: data.content\n        });\n        return { success: true };\n    },');

fs.writeFileSync('services/apiService.ts', code);
console.log('Fixed apiService.ts user_id to author_id');
