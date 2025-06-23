import { PrismaClient, User, UserProfile } from '@prisma/client';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { hashPassword, isValidEmail, isValidUsername } from '../utils/auth';

const prisma = new PrismaClient();

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  website?: string;
  location?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export class UserService {
  async getUserById(userId: string, includeProfile: boolean = true) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: includeProfile,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            aiAgents: true
          }
        }
      }
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Remove sensitive data
    const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async getUserByUsername(username: string, includeProfile: boolean = true) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: includeProfile,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            aiAgents: true
          }
        }
      }
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Remove sensitive data
    const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    // Validate data
    if (data.firstName && (data.firstName.length < 1 || data.firstName.length > 50)) {
      throw new CustomError('First name must be between 1 and 50 characters', 400);
    }

    if (data.lastName && (data.lastName.length < 1 || data.lastName.length > 50)) {
      throw new CustomError('Last name must be between 1 and 50 characters', 400);
    }

    if (data.bio && data.bio.length > 500) {
      throw new CustomError('Bio must be less than 500 characters', 400);
    }

    if (data.website && !this.isValidUrl(data.website)) {
      throw new CustomError('Please provide a valid website URL', 400);
    }

    try {
      const updatedProfile = await prisma.userProfile.update({
        where: { userId },
        data: {
          ...data,
          displayName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : undefined,
          updatedAt: new Date()
        }
      });

      return updatedProfile;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new CustomError('User profile not found', 404);
      }
      throw error;
    }
  }

  async updateUser(userId: string, data: UpdateUserData) {
    const updateData: any = {};

    // Validate and prepare username update
    if (data.username) {
      if (!isValidUsername(data.username)) {
        throw new CustomError('Username must be 3-20 characters and contain only letters, numbers, and underscores', 400);
      }

      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new CustomError('Username is already taken', 409);
      }

      updateData.username = data.username;
    }

    // Validate and prepare email update
    if (data.email) {
      if (!isValidEmail(data.email)) {
        throw new CustomError('Please provide a valid email address', 400);
      }

      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new CustomError('Email is already taken', 409);
      }

      updateData.email = data.email.toLowerCase();
      updateData.emailVerified = false; // Require re-verification for new email
    }

    // Handle password update
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new CustomError('Current password is required to set a new password', 400);
      }

      // This should be handled by the auth service instead
      throw new CustomError('Use the change password endpoint for password updates', 400);
    }

    if (Object.keys(updateData).length === 0) {
      throw new CustomError('No valid update data provided', 400);
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          profile: true
        }
      });

      // Remove sensitive data
      const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = updatedUser;
      return userWithoutSensitiveData;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new CustomError('User not found', 404);
      }
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      // Soft delete - mark as inactive instead of actually deleting
      const deletedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${userId}@deleted.com`, // Unique email to allow reuse of original
          username: `deleted_${Date.now()}_${userId}`,
          deletedAt: new Date()
        }
      });

      logger.info(`User ${userId} marked as deleted`);
      return { message: 'User account has been deactivated' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new CustomError('User not found', 404);
      }
      throw error;
    }
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { profile: { firstName: { contains: query, mode: 'insensitive' } } },
              { profile: { lastName: { contains: query, mode: 'insensitive' } } },
              { profile: { displayName: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: [
        { lastLoginAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData;
    });

    const total = await prisma.user.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { profile: { firstName: { contains: query, mode: 'insensitive' } } },
              { profile: { lastName: { contains: query, mode: 'insensitive' } } },
              { profile: { displayName: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      }
    });

    return {
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          include: {
            profile: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const followers = follows.map(follow => {
      const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = follow.follower;
      return userWithoutSensitiveData;
    });

    const total = await prisma.follow.count({
      where: { followingId: userId }
    });

    return {
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          include: {
            profile: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const following = follows.map(follow => {
      const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = follow.following;
      return userWithoutSensitiveData;
    });

    const total = await prisma.follow.count({
      where: { followerId: userId }
    });

    return {
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new CustomError('You cannot follow yourself', 400);
    }

    // Check if both users exist and are active
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId, isActive: true } }),
      prisma.user.findUnique({ where: { id: followingId, isActive: true } })
    ]);

    if (!follower || !following) {
      throw new CustomError('One or both users not found', 404);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      throw new CustomError('You are already following this user', 409);
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    });

    return { message: 'Successfully followed user', follow };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (!follow) {
      throw new CustomError('You are not following this user', 404);
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    return { message: 'Successfully unfollowed user' };
  }

  async getRecommendedUsers(userId: string, limit: number = 10) {
    // Get users that the current user is not following
    // and who have recent activity
    const recommendedUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { isActive: true },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId
                }
              }
            }
          }
        ]
      },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            posts: true
          }
        }
      },
      orderBy: [
        { lastLoginAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Remove sensitive data
    const sanitizedUsers = recommendedUsers.map(user => {
      const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData;
    });

    return sanitizedUsers;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
