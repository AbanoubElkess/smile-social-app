import { PrismaClient } from '@prisma/client';
import { ValidationError, ConflictError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateToken, generateRefreshToken, hashPassword, comparePassword, sanitizeEmail } from '../utils/auth';

const prisma = new PrismaClient();

export interface SignupData {
  email: string;
  password: string;
  username?: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async signup(signupData: SignupData) {
    const { email, password, username, firstName, lastName } = signupData;
    
    // Basic validation
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      throw new ValidationError('Please provide a valid email address');
    }
    
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { username: username || '' }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === sanitizedEmail) {
        throw new ConflictError('Email is already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username is already taken');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: sanitizedEmail,
          password: hashedPassword,
          username: username || `user_${Date.now()}`,
          displayName: `${firstName} ${lastName}`
        }
      });

      // Generate tokens
      const token = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`New user signed up: ${user.email}`);

      return {
        user: userWithoutPassword,
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Signup error:', error);
      throw new Error('Failed to create user account');
    }
  }

  async login(loginData: LoginData) {
    const { email, password } = loginData;
    
    // Validate input
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail || !password) {
      throw new ValidationError('Please provide email and password');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user || !(await comparePassword(password, user.password || ''))) {
      throw new ValidationError('Incorrect email or password');
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${user.email}`);

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  async verifyEmail(code: string) {
    // Simplified implementation
    return { message: 'Email verification not implemented yet' };
  }

  async resendVerification(email: string) {
    // Simplified implementation
    return { message: 'Verification email not implemented yet' };
  }

  async forgotPassword(email: string) {
    // Simplified implementation
    return { message: 'Password reset not implemented yet' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Simplified implementation
    return { message: 'Password reset not implemented yet' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !(await comparePassword(currentPassword, user.password || ''))) {
      throw new ValidationError('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    });

    return { message: 'Logged out successfully' };
  }
}

export const authService = new AuthService();
