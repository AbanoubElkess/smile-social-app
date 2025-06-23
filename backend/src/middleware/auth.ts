import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CustomError } from './errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      // Check for token in cookies
      token = req.cookies.jwt;
    }

    if (!token) {
      throw new CustomError('You are not logged in! Please log in to get access.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!currentUser) {
      throw new CustomError('The user belonging to this token does no longer exist.', 401);
    }

    // Check if user is active
    if (!currentUser.isActive) {
      throw new CustomError('Your account has been deactivated. Please contact support.', 401);
    }

    // Check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        throw new CustomError('User recently changed password! Please log in again.', 401);
      }
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid token. Please log in again!', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('Your token has expired! Please log in again.', 401));
    } else {
      next(error);
    }
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('You are not logged in!', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new CustomError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    logger.warn('Optional auth failed:', error);
    next();
  }
};

export const requireEmailVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new CustomError('You are not logged in!', 401));
  }

  if (!req.user.emailVerified) {
    return next(new CustomError('Please verify your email address to continue.', 403));
  }

  next();
};

export const requireCompleteProfile = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new CustomError('You are not logged in!', 401));
  }

  if (!req.user.profile || !req.user.profile.firstName || !req.user.profile.lastName) {
    return next(new CustomError('Please complete your profile to continue.', 403));
  }

  next();
};

export const checkUserOwnership = (resourceField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('You are not logged in!', 401));
    }

    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
      return next(new CustomError('You can only access your own resources.', 403));
    }

    next();
  };
};
