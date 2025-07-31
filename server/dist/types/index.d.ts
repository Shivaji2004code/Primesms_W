export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    password: string;
    phone_number?: string;
    role: 'user' | 'admin';
    credit_balance: number;
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserRequest {
    name: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    phoneNumber?: string;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface SessionUser {
    id: string;
    name: string;
    email: string;
    username: string;
    role: 'user' | 'admin';
}
export interface UserBusinessInfo {
    id: string;
    userId: string;
    businessName?: string;
    whatsappNumber?: string;
    whatsappNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    webhookUrl?: string;
    webhookVerifyToken?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserWithBusinessInfo extends User {
    businessInfo?: UserBusinessInfo;
}
export interface CreateBusinessInfoRequest {
    businessName?: string;
    whatsappNumber?: string;
    whatsappNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    webhookUrl?: string;
    webhookVerifyToken?: string;
    isActive?: boolean;
}
declare module 'express-session' {
    interface SessionData {
        user?: SessionUser;
    }
}
//# sourceMappingURL=index.d.ts.map