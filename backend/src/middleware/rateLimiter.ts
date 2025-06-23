import rateLimit from 'express-rate-limit';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../server';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Basic rate limiter using express-rate-limit
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests for this endpoint, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});

// Redis-based rate limiter for more advanced scenarios
let rateLimiterRedis: RateLimiterRedis | null = null;

try {
  rateLimiterRedis = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'middleware',
    points: 100, // Number of requests
    duration: 900, // Per 15 minutes (900 seconds)
    blockDuration: 900, // Block for 15 minutes if limit exceeded
  });
} catch (error) {
  logger.warn('Redis rate limiter not available, falling back to memory-based limiter');
}

export const advancedRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!rateLimiterRedis) {
    return next();
  }

  try {
    await rateLimiterRedis.consume(req.ip);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: secs,
    });
  }
};

// Specific rate limiters for different endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'API rate limit exceeded',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes for auth endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts',
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: 'Upload rate limit exceeded',
  },
});
