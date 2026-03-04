import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('环境变量缺失', supabaseUrl, supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const generateDetailedSteps = (prefix: string, count: number): any[] => {
    return Array.from({ length: count }, (_, i) => ({
        title: `${prefix} - 第${i + 1}动`,
        stance: "双脚与肩同宽，重心微沉，膝盖不要超过脚尖。保持脊柱中正。",
        movement: "随着吸气，身体重心缓慢向左侧平移，腰部带动上身微微转动。",
        handGesture: "双手掌心相对如抱球状，指尖自然舒展，感受虎口撑开的劲力。",
        animationType: (['sway', 'bend', 'stretch', 'raise', 'rotate'] as any)[i % 5]
    }));
};

const VIDEO_DATA = [
    {
        title: '二十四式太极拳标准版',
        category: '太极拳',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
        views: 12400,
        description: '涵盖太极拳核心二十四式，分为三阶段大节，每节详细拆解。',
        article_body: null,
        chapters: [
            { id: 't1-c1', title: '第一大节：起势与基本功', steps: generateDetailedSteps('起势', 12) },
            { id: 't1-c2', title: '第二大节：野马分鬃与白鹤亮翅', steps: generateDetailedSteps('进阶', 15) },
            { id: 't1-c3', title: '第三大节：左右搂膝拗步', steps: generateDetailedSteps('核心', 10) }
        ]
    },
    {
        title: '武当太极入门十三式',
        category: '太极拳',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
        views: 9800,
        description: '武当内家拳入门基础，注重呼吸与意念的配合。',
        article_body: null,
        chapters: [
            { id: 't2-c1', title: '第一大节：道家桩功', steps: generateDetailedSteps('桩功', 11) },
            { id: 't2-c2', title: '第二大节：内家推手基础', steps: generateDetailedSteps('推手', 13) }
        ]
    },
    {
        title: '杨氏太极拳老架精选',
        category: '太极拳',
        thumbnail: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&q=80&w=800',
        views: 7300,
        description: '杨氏太极舒展大方，适合每日晨间练习。',
        article_body: null,
        chapters: [
            { id: 't3-c1', title: '第一大节：舒展热身', steps: generateDetailedSteps('热身', 10) },
            { id: 't3-c2', title: '第二大节：核心招式', steps: generateDetailedSteps('招式', 18) }
        ]
    },
    {
        title: '健身气功：八段锦全功',
        category: '八段锦',
        thumbnail: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800',
        views: 15600,
        description: '国家体育总局标准版，调理五脏六腑。',
        article_body: null,
        chapters: [
            { id: 'b1-c1', title: '第一大节：调理脾胃与肺腑', steps: generateDetailedSteps('调理', 12) },
            { id: 'b1-c2', title: '第二大节：固肾壮腰动作', steps: generateDetailedSteps('固肾', 14) }
        ]
    },
    {
        title: '华佗五禽戏：虎鹿全篇',
        category: '养生功',
        thumbnail: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800',
        views: 11200,
        description: '模仿动物神态，增强身体柔韧性与协调。',
        article_body: null,
        chapters: [
            { id: 'y1-c1', title: '第一大节：猛虎下山系列', steps: generateDetailedSteps('虎戏', 15) },
            { id: 'y1-c2', title: '第二大节：灵鹿回头系列', steps: generateDetailedSteps('鹿戏', 13) }
        ]
    }
];

async function main() {
    console.log('开始同步数据...');
    for (const item of VIDEO_DATA) {
        let retries = 3;
        while (retries > 0) {
            try {
                const { error } = await supabase.from('exercises').insert(item);
                if (error) {
                    console.error(`尝试插入 ${item.title} 失败 (${retries}):`, error);
                } else {
                    console.log(`成功插入 ${item.title}`);
                    break;
                }
            } catch (e) {
                console.error(`网络错误插入 ${item.title} (${retries}):`, e);
            }
            retries--;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    console.log('数据同步完成！');
    process.exit(0);
}

main();
