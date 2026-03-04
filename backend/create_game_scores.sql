-- 为了支持贪吃蛇和钢琴块的游戏分数排行榜，请在 Supabase SQL Editor 中运行此脚本：

CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- 'snake' 或 'piano_tiles'
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为游戏类型和分数添加索引以提供排行榜查询速度
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type_score ON public.game_scores (game_type, score DESC);

-- 允许匿名访问或特定访问 (为了简化，启用所有的读写操作，因为由后端接口校验身份)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.game_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.game_scores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.game_scores FOR DELETE USING (true);
