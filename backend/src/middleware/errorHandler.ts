import { Request, Response, NextFunction } from 'express';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('错误详情:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || '服务器内部错误';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};
