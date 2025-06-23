import { PrismaClient } from '@prisma/client';
import { CustomError } from '../middleware/errorHandler';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateRefreshToken,
  generateVerificationCode,
  sanitizeEmail,
  isValidEmail,
  isValidPassword
} from '../utils/auth';
import { EmailService } from './emailService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const emailService = new EmailService();

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async signup(data: SignupData) {
    const { email, password, firstName, lastName, username } = data;

    // Validate input
    const sanitizedEmail = sanitizeEmail(email);
    if (!isValidEmail(sanitizedEmail)) {
      throw new CustomError('Please provide a valid email address', 400);
    }

    if (!isValidPassword(password)) {
      throw new CustomError('Password must be at least 8 characters with uppercase, lowercase, and number', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      throw new CustomError('User with this email already exists', 409);
    }

    // Check if username is taken (if provided)
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        throw new CustomError('Username is already taken', 409);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        username: username || `user_${Date.now()}`,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
        profile: {
          create: {
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationCode, firstName);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't throw error here, user is created successfully
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove sensitive data
    const { password: _, emailVerificationCode: __, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      token,
      refreshToken
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Validate input
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail || !password) {
      throw new CustomError('Please provide email and password', 400);
    }

    // Check if user exists and get password
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        profile: true
      }
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new CustomError('Incorrect email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new CustomError('Your account has been deactivated. Please contact support.', 403);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove sensitive data
    const { password: _, emailVerificationCode: __, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      token,
      refreshToken
    };
  }

  async verifyEmail(code: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationCode: code,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new CustomError('Invalid or expired verification code', 400);
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null
      }
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const sanitizedEmail = sanitizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        profile: true
      }
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new CustomError('Email is already verified', 400);
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email, 
      verificationCode, 
      user.profile?.firstName || 'User'
    );

    return { message: 'Verification email sent successfully' };
  }

  async forgotPassword(email: string) {
    const sanitizedEmail = sanitizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        profile: true
      }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = generateVerificationCode();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email, 
        resetToken, 
        user.profile?.firstName || 'User'
      );
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new CustomError('Failed to send reset email. Please try again.', 500);
    }

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!isValidPassword(newPassword)) {
      throw new CustomError('Password must be at least 8 characters with uppercase, lowercase, and number', 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new CustomError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date()
      }
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!isValidPassword(newPassword)) {
      throw new CustomError('Password must be at least 8 characters with uppercase, lowercase, and number', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !(await comparePassword(currentPassword, user.password))) {
      throw new CustomError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just update the user's last logout time
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogoutAt: new Date() }
    });

    return { message: 'Logged out successfully' };
  }
}
