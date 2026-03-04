import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this';
const JWT_EXPIRES_IN = '7d'; // Token 7天过期

interface TokenPayload {
    id: string;
    phone: string;
    isAdmin?: boolean;
}

/**
 * 生成 JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证 JWT token
 */
export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};
