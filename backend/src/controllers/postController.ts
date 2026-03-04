import { Response, Request } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest, CreatePostRequest, CreateCommentRequest } from '../types/index.js';

/**
 * 获取动态列表
 */
export const getPosts = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // 获取动态列表（按时间倒序）
        const { data: posts, error, count } = await supabase
            .from('posts')
            .select(`
        *,
        author:users!posts_author_id_fkey(id, name, avatar, phone)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);

        if (error) throw error;

        // 为每个动态获取点赞数和评论
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            // 获取点赞列表
            const { data: likes } = await supabase
                .from('post_likes')
                .select('user_id, users:user_id(avatar)')
                .eq('post_id', post.id);

            // 获取评论
            const { data: comments } = await supabase
                .from('comments')
                .select(`
          *,
          author:users!comments_author_id_fkey(id, name, avatar)
        `)
                .eq('post_id', post.id)
                .is('parent_comment_id', null)
                .order('created_at', { ascending: true });

            // 为每个评论获取回复
            const commentsWithReplies = await Promise.all((comments || []).map(async (comment) => {
                const { data: replies } = await supabase
                    .from('comments')
                    .select(`
            *,
            author:users!comments_author_id_fkey(id, name, avatar)
          `)
                    .eq('parent_comment_id', comment.id)
                    .order('created_at', { ascending: true });

                return {
                    id: comment.id,
                    author: comment.author.name,
                    content: comment.content,
                    time: formatTime(comment.created_at),
                    replies: (replies || []).map(r => ({
                        id: r.id,
                        author: r.author.name,
                        content: r.content,
                        time: formatTime(r.created_at)
                    }))
                };
            }));

            return {
                id: post.id,
                author: post.author.name,
                authorId: post.author.id,
                avatar: post.author.avatar,
                content: post.content,
                fullContent: post.full_content,
                image: post.image,
                likes: likes?.length || 0,
                targetLikes: post.target_likes,
                likedBy: likes?.map((l: any) => l.users?.avatar) || [],
                likedByIds: likes?.map((l: any) => l.user_id) || [],
                time: formatTime(post.created_at),
                comments: commentsWithReplies
            };

        }));

        res.json({
            success: true,
            data: {
                posts: postsWithDetails,
                total: count,
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('获取动态列表错误:', error);
        res.status(500).json({
            success: false,
            error: '获取动态列表失败'
        });
    }
};

/**
 * 创建动态
 */
export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { content, fullContent, image, targetLikes }: CreatePostRequest = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: '动态内容不能为空'
            });
        }

        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                author_id: userId,
                content,
                full_content: fullContent,
                image,
                target_likes: targetLikes,
                likes_count: 0
            })
            .select(`
        *,
        author:users!posts_author_id_fkey(id, name, avatar)
      `)
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: {
                id: post.id,
                author: post.author.name,
                authorId: post.author.id,
                avatar: post.author.avatar,
                content: post.content,
                fullContent: post.full_content,
                image: post.image,
                likes: 0,
                targetLikes: post.target_likes,
                likedBy: [],
                time: formatTime(post.created_at),
                comments: []
            },
            message: '发布成功'
        });
    } catch (error) {
        console.error('创建动态错误:', error);
        res.status(500).json({
            success: false,
            error: '发布失败'
        });
    }
};

/**
 * 点赞动态
 */
export const likePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        // 检查是否已点赞
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', id)
            .eq('user_id', userId)
            .single();

        if (existingLike) {
            return res.status(400).json({
                success: false,
                error: '已经点过赞了'
            });
        }

        // 添加点赞记录
        const { error } = await supabase
            .from('post_likes')
            .insert({ post_id: id, user_id: userId });

        if (error) throw error;

        // 更新点赞数
        await supabase.rpc('increment_post_likes', { post_id: id });

        res.json({
            success: true,
            message: '点赞成功'
        });
    } catch (error) {
        console.error('点赞错误:', error);
        res.status(500).json({
            success: false,
            error: '点赞失败'
        });
    }
};

/**
 * 取消点赞
 */
export const unlikePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        // 删除点赞记录
        const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // 更新点赞数
        await supabase.rpc('decrement_post_likes', { post_id: id });

        res.json({
            success: true,
            message: '取消点赞成功'
        });
    } catch (error) {
        console.error('取消点赞错误:', error);
        res.status(500).json({
            success: false,
            error: '取消点赞失败'
        });
    }
};

/**
 * 添加评论
 */
export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const { content, parentCommentId }: CreateCommentRequest = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: '评论内容不能为空'
            });
        }

        const { data: comment, error } = await supabase
            .from('comments')
            .insert({
                post_id: id,
                author_id: userId,
                content,
                parent_comment_id: parentCommentId
            })
            .select(`
        *,
        author:users!comments_author_id_fkey(id, name, avatar)
      `)
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: {
                id: comment.id,
                author: comment.author.name,
                content: comment.content,
                time: formatTime(comment.created_at)
            },
            message: '评论成功'
        });
    } catch (error) {
        console.error('评论错误:', error);
        res.status(500).json({
            success: false,
            error: '评论失败'
        });
    }
};

/**
 * 获取评论列表
 */
export const getComments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
        *,
        author:users!comments_author_id_fkey(id, name, avatar)
      `)
            .eq('post_id', id)
            .is('parent_comment_id', null)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // 为每个评论获取回复
        const commentsWithReplies = await Promise.all((comments || []).map(async (comment) => {
            const { data: replies } = await supabase
                .from('comments')
                .select(`
          *,
          author:users!comments_author_id_fkey(id, name, avatar)
        `)
                .eq('parent_comment_id', comment.id)
                .order('created_at', { ascending: true });

            return {
                id: comment.id,
                author: comment.author.name,
                content: comment.content,
                time: formatTime(comment.created_at),
                replies: (replies || []).map(r => ({
                    id: r.id,
                    author: r.author.name,
                    content: r.content,
                    time: formatTime(r.created_at)
                }))
            };
        }));

        res.json({
            success: true,
            data: commentsWithReplies
        });
    } catch (error) {
        console.error('获取评论错误:', error);
        res.status(500).json({
            success: false,
            error: '获取评论失败'
        });
    }
};

/**
 * 删除动态
 */
export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.isAdmin;
        const { id } = req.params;

        // 获取帖子信息
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('author_id')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return res.status(404).json({
                success: false,
                error: '未找到该动态'
            });
        }

        // 校验权限：是作者或者是管理员
        if (post.author_id !== userId && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: '没有权限删除此动态'
            });
        }

        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.json({
            success: true,
            message: '动态已成功删除'
        });
    } catch (error: any) {
        console.error('删除动态错误:', error);
        res.status(500).json({
            success: false,
            error: '删除失败'
        });
    }
};

// 辅助函数：格式化时间
function formatTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return `${days}天前`;
}
