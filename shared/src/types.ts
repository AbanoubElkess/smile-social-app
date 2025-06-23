// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  accountType: 'user' | 'ai_agent' | 'business';
  privacySettings: PrivacySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  allowDirectMessages: boolean;
  allowTagging: boolean;
  showOnlineStatus: boolean;
}

// AI Agent Types
export interface AIAgent {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  description: string;
  creatorId: string;
  creator: User;
  personality: AIPersonality;
  capabilities: AICapabilities;
  pricing: AgentPricing;
  metrics: AgentMetrics;
  status: 'draft' | 'published' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPersonality {
  tone: 'professional' | 'casual' | 'humorous' | 'friendly' | 'formal';
  expertise: string[];
  responseStyle: 'detailed' | 'concise' | 'conversational';
  languageStyle: 'formal' | 'informal' | 'technical' | 'simple';
  templateId?: string;
}

export interface AICapabilities {
  conversation: boolean;
  contentCreation: boolean;
  recommendations: boolean;
  customerService: boolean;
  dataAnalysis: boolean;
  customCapabilities: string[];
}

export interface AgentPricing {
  model: 'free' | 'subscription' | 'pay_per_use' | 'custom';
  price: number;
  currency: string;
  billingPeriod?: 'monthly' | 'yearly' | 'lifetime';
  freeTrialDays?: number;
}

export interface AgentMetrics {
  totalInteractions: number;
  averageRating: number;
  totalRatings: number;
  responseTime: number;
  satisfactionScore: number;
  revenueGenerated: number;
}

// Social Media Types
export interface Post {
  id: string;
  authorId: string;
  author: User | AIAgent;
  content: string;
  mediaUrls: string[];
  type: 'text' | 'image' | 'video' | 'poll';
  visibility: 'public' | 'private' | 'friends';
  metrics: PostMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User | AIAgent;
  content: string;
  parentCommentId?: string;
  replies?: Comment[];
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: Date;
}

// Conversation Types
export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  type: 'direct' | 'group' | 'ai_chat';
  title?: string;
  lastMessage?: Message;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  user: User | AIAgent;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User | AIAgent;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyTo?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

// Marketplace Types
export interface MarketplaceTransaction {
  id: string;
  buyerId: string;
  buyer: User;
  agentId: string;
  agent: AIAgent;
  type: 'purchase' | 'subscription' | 'renewal';
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  user: User;
  agentId: string;
  agent: AIAgent;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'ai_response'
  | 'payment'
  | 'system'
  | 'agent_approved'
  | 'agent_purchased';

// Analytics Types
export interface UserAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    postsCreated: number;
    likesReceived: number;
    commentsReceived: number;
    followersGained: number;
    profileViews: number;
    engagementRate: number;
  };
  date: Date;
}

export interface AgentAnalytics {
  agentId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    interactions: number;
    newUsers: number;
    averageSessionDuration: number;
    satisfactionScore: number;
    revenue: number;
    topTopics: string[];
  };
  date: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface OAuthRequest {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Real-time Event Types
export interface SocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  userId?: string;
}

export type SocketEventType =
  | 'message'
  | 'notification'
  | 'ai_response'
  | 'user_online'
  | 'user_offline'
  | 'typing'
  | 'post_liked'
  | 'post_commented';

// File Upload Types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

// Search Types
export interface SearchQuery {
  query: string;
  type?: 'users' | 'posts' | 'agents' | 'all';
  filters?: SearchFilters;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  authors?: string[];
  tags?: string[];
  verified?: boolean;
  agentType?: string[];
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  facets?: Record<string, any>;
  suggestions?: string[];
}

// Configuration Types
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    aiAgents: boolean;
    marketplace: boolean;
    liveStreaming: boolean;
    analytics: boolean;
  };
  limits: {
    maxFileSize: number;
    maxPostLength: number;
    maxBioLength: number;
    dailyPostLimit: number;
  };
}
