import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest, CreateAnnouncementRequest, ApiResponse } from '../types/index.js';

/**
 * 获取所有公告
 */
export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // 如果表不存在，返回空列表而不是 500
            if (error.code === '42P01') {
                return res.json({
                    success: true,
                    data: []
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('获取公告失败:', error);
        res.status(500).json({
            success: false,
            error: '获取公告失败'
        });
    }
};

/**
 * 发布新公告 (仅管理员)
 */
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { title, content }: CreateAnnouncementRequest = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: '标题和内容为必填项'
            });
        }

        const newAnnouncement = {
            title,
            content,
            author_id: req.user?.id
        };

        const { data, error } = await supabase
            .from('announcements')
            .insert(newAnnouncement)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: '公告发布成功'
        });
    } catch (error: any) {
        console.error('发布公告失败:', error);
        res.status(500).json({
            success: false,
            error: '发布公告失败，请检查数据库 announcements 表是否存在'
        });
    }
};

/**
 * 删除公告 (仅管理员)
 */
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: '公告删除成功'
        });
    } catch (error: any) {
        console.error('删除公告失败:', error);
        res.status(500).json({
            success: false,
            error: '删除公告失败'
        });
    }
};
