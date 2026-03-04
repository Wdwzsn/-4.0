
import { VideoContent, Post, Achievement, Friend } from './types';

const generateDetailedSteps = (prefix: string, count: number): any[] => {
  return Array.from({ length: count }, (_, i) => ({
    title: `${prefix} - 第${i + 1}动`,
    stance: "双脚与肩同宽，重心微沉，膝盖不要超过脚尖。保持脊柱中正。",
    movement: "随着吸气，身体重心缓慢向左侧平移，腰部带动上身微微转动。",
    handGesture: "双手掌心相对如抱球状，指尖自然舒展，感受虎口撑开的劲力。",
    animationType: (['sway', 'bend', 'stretch', 'raise', 'rotate'] as any)[i % 5]
  }));
};

export const VIDEO_DATA: VideoContent[] = [
  {
    id: 't1',
    title: '二十四式太极拳标准版',
    category: '太极拳',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
    views: 12400,
    description: '涵盖太极拳核心二十四式，分为三阶段大节，每节详细拆解。',
    chapters: [
      { id: 't1-c1', title: '第一大节：起势与基本功', steps: generateDetailedSteps('起势', 12) },
      { id: 't1-c2', title: '第二大节：野马分鬃与白鹤亮翅', steps: generateDetailedSteps('进阶', 15) },
      { id: 't1-c3', title: '第三大节：左右搂膝拗步', steps: generateDetailedSteps('核心', 10) }
    ]
  },
  {
    id: 't2',
    title: '武当太极入门十三式',
    category: '太极拳',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    views: 9800,
    description: '武当内家拳入门基础，注重呼吸与意念的配合。',
    chapters: [
      { id: 't2-c1', title: '第一大节：道家桩功', steps: generateDetailedSteps('桩功', 11) },
      { id: 't2-c2', title: '第二大节：内家推手基础', steps: generateDetailedSteps('推手', 13) }
    ]
  },
  {
    id: 't3',
    title: '杨氏太极拳老架精选',
    category: '太极拳',
    thumbnail: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&q=80&w=800',
    views: 7300,
    description: '杨氏太极舒展大方，适合每日晨间练习。',
    chapters: [
      { id: 't3-c1', title: '第一大节：舒展热身', steps: generateDetailedSteps('热身', 10) },
      { id: 't3-c2', title: '第二大节：核心招式', steps: generateDetailedSteps('招式', 18) }
    ]
  },
  {
    id: 'b1',
    title: '健身气功：八段锦全功',
    category: '八段锦',
    thumbnail: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800',
    views: 15600,
    description: '国家体育总局标准版，调理五脏六腑。',
    chapters: [
      { id: 'b1-c1', title: '第一大节：调理脾胃与肺腑', steps: generateDetailedSteps('调理', 12) },
      { id: 'b1-c2', title: '第二大节：固肾壮腰动作', steps: generateDetailedSteps('固肾', 14) }
    ]
  },
  {
    id: 'b2',
    title: '坐式八段锦（办公室内功）',
    category: '八段锦',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800',
    views: 6400,
    description: '适合久坐或腿脚不便者，坐姿完成全套导引。',
    chapters: [
      { id: 'b2-c1', title: '第一大节：坐姿起势', steps: generateDetailedSteps('坐起', 10) },
      { id: 'b2-c2', title: '第二大节：上肢导引', steps: generateDetailedSteps('导引', 12) }
    ]
  },
  {
    id: 'y1',
    title: '华佗五禽戏：虎鹿全篇',
    category: '养生功',
    thumbnail: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800',
    views: 11200,
    description: '模仿动物神态，增强身体柔韧性与协调。',
    chapters: [
      { id: 'y1-c1', title: '第一大节：猛虎下山系列', steps: generateDetailedSteps('虎戏', 15) },
      { id: 'y1-c2', title: '第二大节：灵鹿回头系列', steps: generateDetailedSteps('鹿戏', 13) }
    ]
  },
  {
    id: 'c4',
    title: '科学报告：传统体育对老年心血管健康的显著益处',
    category: '传统文化',
    thumbnail: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800',
    views: 2800,
    description: '最新医学研究表明，太极拳与八段锦能有效降低中老年人患高血压风险。',
    articleBody: `## 传统体育与心血管健康：一份深度的研究综述\n\n心血管疾病长期以来被认为是威胁中老年人生命健康的“头号杀手”。然而，随着现代预防医学的飞速发展，越来越多的专家开始重新审视中国古老的健身功法。近期，由国内三所顶尖医科大学联合发布的《传统导引术与心肺耐力关联研究报告》显示，太极拳和八段锦在调节血压、增强心肌功能方面具有不可替代的作用。\n\n### 1. 降低外周血管阻力的生理机制\n研究指出，太极拳强调“松静自然”和“深长呼吸”。在练习过程中，身体肌肉的交替放松和收缩就像一种天然的微型泵。受试者在进行三个月的每日太极训练后，其血管内皮功能得到了显著改善。内皮细胞释放的一氧化氮量增加，有效促使小动脉扩张，从而降低了外周阻力。数据显示，参与者的收缩压平均下降了12.5 mmHg，这对于轻度高血压患者来说，甚至达到了部分药物的控压效果。\n\n### 2. 八段锦与自主神经系统的平衡\n不同于高强度的无氧运动，八段锦是一种中低强度的有氧功法。其核心在于“调心、调息、调身”的三调合一。调查显示，练习八段锦的老年人，其交感神经的兴奋性显著降低，而副交感神经（迷走神经）的活性有所增强。这种平衡能极大缓解因长期焦虑或生活压力导致的心率过快。长期练习者在静息状态下的心率平均每分钟降低了5-8次，这意味着心脏可以在更低的工作负荷下完成同样的血液循环任务。\n\n### 3. 增强心输出量与肺活量\n传统的“两手托天理三焦”等动作涉及大量的胸廓扩展。实验数据表明，长期坚持这类动作的老年人，其肺活量比同龄不运动者高出20%以上。充足的氧气摄入直接提升了血液含氧量，改善了心肌的供血状态。对于预防冠心病、心绞痛等突发性心脏疾病，传统体育构成了一道坚实的基础防护网。\n\n### 4. 社会心理层面的间接益处\n报告最后提到，心血管健康与心理状态密切相关。传统体育往往带有社交属性，如在长青园广场上的群组练习，能显著降低老年人的孤独感。孤独感被医学界公认为心力衰竭的间接诱因。当老人们在练习中感受到文化的归属 and 伙伴的关怀时，皮质醇水平下降，这从生化层面直接保护了心脏不受慢性压力的侵蚀。\n\n综上所述，建议广大园友将太极和八段锦作为每日“必修课”。正如报告结论所言：这不仅是在锻炼身体，更是在进行一场深刻的生命维护工程。长青园将继续秉承科学精神，为您推荐更多经得起推敲的健康路径。`
  },
  {
    id: 'c5',
    title: '平衡力与长寿：关于太极拳预防老年跌倒的专项调查报告',
    category: '传统文化',
    thumbnail: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800',
    views: 3100,
    description: '跌倒是我国老年人意外死亡的第一大原因。本调查分析了锻炼对提升平衡力的作用。',
    articleBody: `## 稳健晚年：太极拳与平衡能力的深度关联调查报告\n\n在老龄化社会的背景下，“跌倒”已成为一个严峻的公共卫生课题。对于老年人来说，一次意外的摔倒往往意味着骨折、卧床甚至是生命质量的断崖式下跌。为了探讨如何通过科学手段提升老年人的稳定度，长青园课题组针对园内2000名活跃用户进行了一次为期六个月的跟踪调研。\n\n### 1. 核心力量是“定海神针”\n调查发现，经常练习太极拳的老年人，其躯干核心肌群的稳定性极高。太极拳要求“立身中正”，在动作衔接中，练习者需要不断调整重心，这对腹横肌、竖脊肌等深层肌肉起到了极佳的锻炼作用。在平衡力测试中，练习太极超过一年的老人，闭眼单脚站立时间平均达到了18秒，而未练习组仅为6秒。\n\n### 2. 足底压力感知的重塑\n太极拳讲究“虚实转换”。在步伐移动中，脚掌与地面的接触感（即本体感觉）被极大地强化了。大脑在长期的训练中，对身体空间位置的判断变得极其敏锐。当老人在不平整的路面上行走或突然受到外力碰撞时，练习者的神经反射速度比普通老人快约40%，这使他们能够迅速调整姿态，化险为夷。\n\n### 3. 关节灵活度与保护\n跌倒后的后果严重程度往往取决于关节的灵活性。调研报告指出，太极拳的圆活动作使髋、膝、踝三大关节的活动度保持在良好范围。灵活的关节就像弹簧，能吸收跌倒瞬间的部分冲击力。即使不慎摔倒，经常练习太极的老人发生粉碎性骨折的概率也比一般老人降低了22%。\n\n### 4. 骨密度与耐受力\n虽然太极是轻柔运动，但其中的单腿负重动作提供了必要的负重刺激。调研结果证实，规律练习太极拳的老人，其股骨颈的骨密度水平普遍较高。这种生物力学的长期刺激，从内部增强了“骨骼支架”的坚韧程度。\n\n### 5. 心理素质的稳定器\n最后，调研组发现，练功者的心理定力也更强。面对突发状况，他们更少出现惊慌失措。这种心理上的“稳”，也是物理意义上“不倒”的关键。正如园友李大伯所言：“练了太极，下楼梯脚下生根，心里踏实。”\n\n总结：预防跌倒不应依赖昂贵的补品或单纯的静态防护。长青园呼吁大家：迈开腿，练太极。这种古老而智慧的功法，正是给每一位长者配备的隐形“助力架”。让我们在稳健的步伐中，迎接更长寿、更有尊严的晚年生活。`
  },
  {
    id: 'c6',
    title: '民俗专题：新年将至，聊聊中国春节的优秀传统文化',
    category: '传统文化',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
    views: 5800,
    description: '春节的脚步近了，让我们重温那些流传千年的温情仪式感。',
    articleBody: `## 岁序常易，华章新启：重温中国春节的优秀传统文化\n\n当北方的寒梅吐蕊，当南方的花街焕彩，一个令亿万中华儿女魂牵梦绕的时刻便悄然而至。春节，这个跨越千年的节日，不仅仅是一个时间节点的更替，更是一场关于团圆、感恩、祝愿与传承的盛大仪式。对于长青园的每一位园友来说，春节更是我们心中最温暖的文化符号。\n\n### 1. 团圆的终极意义：年夜饭与守岁\n“团圆”是春节永恒的主题。无论游子身在何方，年夜饭（团年饭）的香气总能唤回归家的脚步。餐桌上的每一道菜都充满了文化寓意：鱼代表“年年有余”，年糕象征“步步高升”，饺子则寓意“更岁交子”。这种饮食文化背后，是家族血脉的凝聚。而除夕夜的“守岁”，更是一种精神的接力。老人们熬夜守岁是为辞旧迎新，期待子孙兴旺；年轻人守岁则是为长辈祈寿，体现了中华民族深厚的孝亲文化。\n\n### 2. 笔尖下的祈愿：春联与民俗艺术\n春节前夕，写春联、贴福字是不可或缺的仪式。红底黑字的联句，不仅对仗工整、平仄协调，更承载着对国泰民安、五谷丰登的最淳朴期盼。在长青园，我们有许多园友擅长书法，笔墨横姿间，传统的韵味便铺面而来。除此之外，剪窗花、挂年画等民间艺术，也是对美好生活的视觉赞颂。这种对色彩与图形的运用，折射出中国人乐观向上、追求和美的民族性格。\n\n### 3. 慎终追远的传承：祭祖与敬老\n春节期间，祭祀祖先是一项庄严的习俗。这不仅仅是迷信，更是一种“饮水思源”的情感表达。通过祭祖，晚辈感念先人的辛劳，传承优良的家风。而大年初一的“拜年”，长辈给晚辈压岁钱（利是），晚辈向长辈行礼，这种代际间的温情互动，让礼仪之邦的美德在欢声笑语中得以延续。压岁钱寓意“压住邪祟”，守护孩子新的一年平安顺遂。\n\n### 4. 喜庆的热力：舞龙舞狮与灯火\n随着春节假期的展开，各种民间游艺活动达到高潮。威武的狮子、灵动的金龙，在锣鼓喧天中腾挪跳转。这些表演象征着中华民族自强不息的精神力量。传统的庙会更是热闹非凡，非遗技艺的展示、民间小吃的香甜，构成了一幅生动的民俗长卷。这种群体性的欢愉，极大地丰富了人们的精神世界，让社区充满了生机与活力。\n\n### 结语：新时代的年味\n新年将至，长青园预祝每一位老邻居新春大吉。春节不只是吃喝玩乐，更是一次灵魂的寻根。让我们在享受现代生活便利的同时，守护好这些珍贵的传统，让“年味儿”在传承中愈发醇厚。愿新的一年，大家如长青之柏，岁岁常青，阖家幸福。`
  }
];

export const AI_PROFILES: Friend[] = [
  { id: 'ai1', phone: '13800000001', name: '静水流深', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200', bio: '热爱太极，享受生活。退休于苏州丝绸厂，目前专注太极传播。', motto: '知足常乐', age: '65', gender: '男', interests: ['太极', '二胡'], birthday: '1959-06-12', routine: '早起练功，午后品茗', province: '江苏', status: 'online', joinedDate: '2023', streak: 120, isRealUser: false },
  { id: 'ai2', phone: '13800000002', name: '平步青云', avatar: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=200', bio: '退休教师，书法爱好者。希望在晚年能结交更多笔友。', motto: '墨香人生', age: '68', gender: '男', interests: ['书法', '围棋'], birthday: '1956-03-20', routine: '午后挥毫，晚间弈棋', province: '北京', status: 'online', joinedDate: '2023', streak: 45, isRealUser: false },
  { id: 'ai3', phone: '13800000003', name: '梅兰竹菊', avatar: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=200', bio: '老伴相随，晚年无忧。喜欢钻研养生食谱。', motto: '和为贵', age: '62', gender: '女', interests: ['广场舞', '烹饪'], birthday: '1962-11-05', routine: '早市买菜，晚间跳舞', province: '广东', status: 'online', joinedDate: '2023', streak: 89, isRealUser: false },
  { id: 'ai5', phone: '13800000005', name: '夕阳红', avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=200', bio: '乐观豁达，热心肠。曾在居委会工作三十年。', motto: '助人为乐', age: '70', gender: '女', interests: ['京剧', '花卉'], birthday: '1954-04-22', routine: '阳台理花，收音机听戏', province: '四川', status: 'online', joinedDate: '2023', streak: 200, isRealUser: false },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1', authorId: 'ai1', author: '静水流深', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200',
    content: '今天早上的太极二十四式练得浑身通透，苏州的空气也格外清新。',
    likes: 15, time: '2小时前',
    comments: [
      { id: 'c1', author: '夕阳红', content: '还是老张练得地道，我也得勤快点。', time: '1小时前', replies: [{ id: 'r1', author: '静水流深', content: '哈哈，老邻居谬赞了，一起进步！', time: '50分钟前' }] }
    ]
  },
  { id: 'p2', authorId: 'ai2', author: '平步青云', avatar: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=200', content: '临摹了一篇兰亭集序，心境平和了不少。', likes: 22, time: '3小时前', comments: [] },
  { id: 'p3', authorId: 'ai3', author: '梅兰竹菊', avatar: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=200', content: '今天新学的山药炖排骨，营养又美味，老伴吃了两大碗。', likes: 30, time: '5小时前', comments: [] },
  { id: 'p4', authorId: 'ai5', author: '夕阳红', avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=200', content: '阳台上的君子兰开了，紫色真美。', likes: 18, time: '8小时前', comments: [] },
  { id: 'p5', authorId: 'ai1', author: '静水流深', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200', content: '太极不仅是运动，更是一种生活哲学。', likes: 45, time: '1天前', comments: [] },
  { id: 'p6', authorId: 'ai2', author: '平步青云', avatar: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=200', content: '今天的书法讲座受益匪浅，活到老学到老。', likes: 12, time: '1天前', comments: [] },
  { id: 'p7', authorId: 'ai3', author: '梅兰竹菊', avatar: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=200', content: '广场舞姐妹们，明早六点不见不散！', likes: 60, time: '2天前', comments: [] },
  { id: 'p8', authorId: 'ai5', author: '夕阳红', avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=200', content: '社区组织的体检大家都去了吗？健康第一。', likes: 25, time: '2天前', comments: [] },
  { id: 'p9', authorId: 'ai1', author: '静水流深', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200', content: '分享一首二胡名曲《二泉映月》，宁静致远。', likes: 33, time: '3天前', comments: [] },
  { id: 'p10', authorId: 'ai2', author: '平步青云', avatar: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=200', content: '新买的端砚真的很温润，写字更有手感了。', likes: 19, time: '4天前', comments: [] },
  { id: 'p11', authorId: 'ai3', author: '梅兰竹菊', avatar: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=200', content: '家里的腊肉熏好了，有过年的味道了。', likes: 88, time: '5天前', comments: [] },
  { id: 'p12', authorId: 'ai5', author: '夕阳红', avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=200', content: '今天帮助了邻居家修水管，心里美滋滋的。', likes: 52, time: '1周前', comments: [] },
];

export const ACHIEVEMENTS_DATA: Achievement[] = [
  { id: '1', title: '初试身手', icon: '🌱', description: '完成第一次功法练习', isUnlocked: false },
  { id: '2', title: '坚持不懈', icon: '🔥', description: '累计打卡 3 天', isUnlocked: false },
  { id: '3', title: '广结良缘', icon: '🤝', description: '添加首位老伙伴为好友', isUnlocked: false },
  { id: '4', title: '社交达人', icon: '📣', description: '在广场发布 1 条新鲜事', isUnlocked: false },
  { id: '5', title: '暖心陪伴', icon: '🧸', description: '与陪伴助手进行深度交流', isUnlocked: false },
  { id: '6', title: '博览群书', icon: '📖', description: '阅读完 5 篇文化研报文章', isUnlocked: false },
  { id: '7', title: '园地园丁', icon: '🌼', description: '完善个人所有资料信息', isUnlocked: false },
  { id: '8', title: '太极宗师', icon: '☯️', description: '完成太极拳全套章节训练', isUnlocked: false },
  { id: '9', title: '晨起健儿', icon: '☀️', description: '连续 7 天在清晨进行训练', isUnlocked: false },
];
