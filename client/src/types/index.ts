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
  token: string;
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

// Template types
export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
export type TemplateStatus = 'DRAFT' | 'IN_REVIEW' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'DISABLED' | 'APPEAL_REQUESTED';
export type QualityRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'QUALITY_PENDING';
export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
export type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP' | 'CATALOG' | 'ORDER_DETAILS';

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
}

export interface TemplateExample {
  header_text?: string[];
  body_text?: string[][];
  header_handle?: string[];
}

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
  otp_type?: 'COPY_CODE' | 'ONE_TAP';
}

export interface TemplateComponent {
  type: ComponentType;
  format?: HeaderFormat;
  text?: string;
  parameters?: TemplateParameter[];
  example?: TemplateExample;
  buttons?: TemplateButton[];
  add_security_recommendation?: boolean;
  code_expiration_minutes?: number;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  components: TemplateComponent[];
  templateId?: string;
  messageSendTtlSeconds?: number;
  allowCategoryChange?: boolean;
  qualityRating?: QualityRating;
  whatsappResponse?: any;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  category: TemplateCategory;
  language?: string;
  components: TemplateComponent[];
  message_send_ttl_seconds?: number;
  allow_category_change?: boolean;
  submit_to_whatsapp?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  category?: TemplateCategory;
  language?: string;
  components?: TemplateComponent[];
  message_send_ttl_seconds?: number;
  allow_category_change?: boolean;
}

export interface TemplateVariable {
  name: string;
  example: string;
  description?: string;
}

export interface TemplatesResponse {
  data: Template[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTemplates: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MediaUploadResponse {
  message: string;
  headerHandle: string;
  fileName: string;
  mimeType: string;
  size: number;
}