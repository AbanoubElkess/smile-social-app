// App Constants
export const APP_NAME = 'SMILE';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Social Media Intelligence & Live Experience';

// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    OAUTH: '/auth/oauth',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    FOLLOWERS: '/users/followers',
    FOLLOWING: '/users/following',
    SEARCH: '/users/search'
  },
  POSTS: {
    CREATE: '/posts',
    GET_FEED: '/posts/feed',
    GET_BY_ID: '/posts/:id',
    UPDATE: '/posts/:id',
    DELETE: '/posts/:id',
    LIKE: '/posts/:id/like',
    UNLIKE: '/posts/:id/unlike',
    COMMENT: '/posts/:id/comments',
    SHARE: '/posts/:id/share'
  },
  AI_AGENTS: {
    CREATE: '/ai-agents',
    GET_ALL: '/ai-agents',
    GET_BY_ID: '/ai-agents/:id',
    UPDATE: '/ai-agents/:id',
    DELETE: '/ai-agents/:id',
    CHAT: '/ai-agents/:id/chat',
    TRAIN: '/ai-agents/:id/train',
    PUBLISH: '/ai-agents/:id/publish'
  },
  MARKETPLACE: {
    BROWSE: '/marketplace',
    PURCHASE: '/marketplace/purchase',
    SUBSCRIPTIONS: '/marketplace/subscriptions',
    TRANSACTIONS: '/marketplace/transactions',
    REVIEWS: '/marketplace/reviews'
  },
  CONVERSATIONS: {
    GET_ALL: '/conversations',
    GET_BY_ID: '/conversations/:id',
    CREATE: '/conversations',
    SEND_MESSAGE: '/conversations/:id/messages',
    MARK_READ: '/conversations/:id/read'
  },
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    GET_UNREAD_COUNT: '/notifications/unread-count'
  },
  MEDIA: {
    UPLOAD: '/media/upload',
    DELETE: '/media/:id'
  },
  PAYMENTS: {
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM: '/payments/confirm',
    WEBHOOKS: '/payments/webhooks'
  }
} as const;

// Validation Constants
export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 254,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    REGEX: /^[a-zA-Z0-9_]+$/,
    RESERVED_NAMES: ['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'smile']
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  BIO: {
    MAX_LENGTH: 500
  },
  POST_CONTENT: {
    MAX_LENGTH: 2000
  },
  COMMENT_CONTENT: {
    MAX_LENGTH: 500
  },
  AI_AGENT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50
  },
  AI_AGENT_DESCRIPTION: {
    MAX_LENGTH: 1000
  }
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg']
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  FEED_LIMIT: 20,
  SEARCH_LIMIT: 50,
  NOTIFICATIONS_LIMIT: 30
} as const;

// Social Media Constants
export const SOCIAL_LIMITS = {
  MAX_FOLLOWERS_PER_REQUEST: 50,
  MAX_FOLLOWING_PER_REQUEST: 50,
  MAX_POSTS_PER_DAY: 100,
  MAX_COMMENTS_PER_HOUR: 50,
  MAX_LIKES_PER_HOUR: 200,
  MAX_DIRECT_MESSAGES_PER_HOUR: 100
} as const;

// AI Agent Constants
export const AI_AGENT = {
  PERSONALITY_TEMPLATES: {
    INFLUENCER: 'influencer',
    EXPERT: 'expert',
    ENTERTAINER: 'entertainer',
    ASSISTANT: 'assistant',
    EDUCATOR: 'educator',
    THERAPIST: 'therapist',
    COACH: 'coach',
    CUSTOM: 'custom'
  },
  PRICING_MODELS: {
    FREE: 'free',
    SUBSCRIPTION: 'subscription',
    PAY_PER_USE: 'pay_per_use',
    CUSTOM: 'custom'
  },
  CAPABILITIES: {
    CONVERSATION: 'conversation',
    CONTENT_CREATION: 'content_creation',
    RECOMMENDATIONS: 'recommendations',
    CUSTOMER_SERVICE: 'customer_service',
    DATA_ANALYSIS: 'data_analysis'
  },
  RESPONSE_TIME_LIMIT: 10000, // 10 seconds
  MAX_CONTEXT_LENGTH: 4000,
  MAX_RESPONSE_LENGTH: 1000,
  TRAINING_DATA_LIMIT: 1000000 // 1MB
} as const;

// Payment Constants
export const PAYMENT = {
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  MINIMUM_AMOUNT: 0.50, // $0.50
  MAXIMUM_AMOUNT: 10000, // $10,000
  PLATFORM_FEE_PERCENTAGE: 0.30, // 30%
  CREATOR_SHARE_PERCENTAGE: 0.70, // 70%
  SUBSCRIPTION_PLANS: {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    LIFETIME: 'lifetime'
  }
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MESSAGE: 'message',
  AI_RESPONSE: 'ai_response',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  AGENT_APPROVED: 'agent_approved',
  AGENT_PURCHASED: 'agent_purchased',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled'
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  MESSAGE: 'message',
  NOTIFICATION: 'notification',
  AI_RESPONSE: 'ai_response',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
  NEW_FOLLOWER: 'new_follower'
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_USERNAME: 'INVALID_USERNAME',
  
  // Permission Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // AI Agent Errors
  AI_AGENT_NOT_FOUND: 'AI_AGENT_NOT_FOUND',
  AI_AGENT_TRAINING_FAILED: 'AI_AGENT_TRAINING_FAILED',
  AI_RESPONSE_TIMEOUT: 'AI_RESPONSE_TIMEOUT',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  
  // Payment Errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  
  // File Upload Errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Account created successfully! Please check your email to verify your account.',
  LOGIN_SUCCESS: 'Logged in successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  PASSWORD_RESET_SENT: 'Password reset email sent successfully!',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  AI_AGENT_CREATED: 'AI agent created successfully!',
  AI_AGENT_PUBLISHED: 'AI agent published to marketplace!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  SUBSCRIPTION_CREATED: 'Subscription created successfully!',
  MESSAGE_SENT: 'Message sent successfully!'
} as const;

// Default Values
export const DEFAULTS = {
  AVATAR_COLOR: '#4ECDC4',
  THEME: 'light',
  LANGUAGE: 'en',
  TIMEZONE: 'UTC',
  CURRENCY: 'USD',
  PAGINATION_LIMIT: 20,
  AI_AGENT_PERSONALITY: 'assistant',
  PRIVACY_SETTINGS: {
    profileVisibility: 'public',
    allowDirectMessages: true,
    allowTagging: true,
    showOnlineStatus: true
  }
} as const;

// Feature Flags
export const FEATURES = {
  AI_AGENTS: true,
  MARKETPLACE: true,
  LIVE_STREAMING: false,
  VOICE_MESSAGES: false,
  VIDEO_CALLS: false,
  GROUPS: false,
  STORIES: false,
  ADVANCED_ANALYTICS: false,
  ENTERPRISE_FEATURES: false
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  USER_FEED: 'user:feed:',
  POST_DETAILS: 'post:details:',
  AI_AGENT_DETAILS: 'ai_agent:details:',
  CONVERSATION_MESSAGES: 'conversation:messages:',
  NOTIFICATIONS: 'notifications:',
  SEARCH_RESULTS: 'search:results:',
  TRENDING_TOPICS: 'trending:topics',
  MARKETPLACE_AGENTS: 'marketplace:agents'
} as const;

// Time Constants
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const;

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]+$/,
  HASHTAG: /#[\w]+/g,
  MENTION: /@[\w]+/g,
  URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/
} as const;
