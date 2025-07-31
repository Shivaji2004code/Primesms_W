export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  creditBalance: number;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
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
  createdAt: string;
  updatedAt: string;
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