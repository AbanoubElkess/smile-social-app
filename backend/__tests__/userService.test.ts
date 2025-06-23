import { UserService } from '../src/services/userService';
import { AuthService } from '../src/services/authService';
import { PrismaClient } from '@prisma/client';
import { CustomError } from '../src/middleware/errorHandler';

const prisma = new PrismaClient();
const userService = new UserService();
const authService = new AuthService();

describe('UserService', () => {
  describe('getUserById', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should return user by ID', async () => {
      const user = await userService.getUserById(testUser.id);

      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
      expect(user.username).toBe(testUser.username);
      expect(user.password).toBeUndefined();
      expect(user.profile).toBeDefined();
      expect(user._count).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(userService.getUserById(nonExistentId)).rejects.toThrow(CustomError);
      await expect(userService.getUserById(nonExistentId)).rejects.toThrow('User not found');
    });
  });

  describe('getUserByUsername', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should return user by username', async () => {
      const user = await userService.getUserByUsername('johndoe');

      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
      expect(user.username).toBe('johndoe');
      expect(user.password).toBeUndefined();
      expect(user.profile).toBeDefined();
    });

    it('should throw error for non-existent username', async () => {
      await expect(userService.getUserByUsername('nonexistent')).rejects.toThrow(CustomError);
      await expect(userService.getUserByUsername('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should update profile with valid data', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Updated bio',
        location: 'New York',
        website: 'https://example.com'
      };

      const updatedProfile = await userService.updateProfile(testUser.id, updateData);

      expect(updatedProfile.firstName).toBe(updateData.firstName);
      expect(updatedProfile.lastName).toBe(updateData.lastName);
      expect(updatedProfile.bio).toBe(updateData.bio);
      expect(updatedProfile.location).toBe(updateData.location);
      expect(updatedProfile.website).toBe(updateData.website);
      expect(updatedProfile.displayName).toBe('Jane Smith');
    });

    it('should throw error for invalid website URL', async () => {
      const updateData = {
        website: 'not-a-valid-url'
      };

      await expect(userService.updateProfile(testUser.id, updateData)).rejects.toThrow(CustomError);
      await expect(userService.updateProfile(testUser.id, updateData)).rejects.toThrow('valid website URL');
    });

    it('should throw error for bio too long', async () => {
      const updateData = {
        bio: 'a'.repeat(501) // 501 characters
      };

      await expect(userService.updateProfile(testUser.id, updateData)).rejects.toThrow(CustomError);
      await expect(userService.updateProfile(testUser.id, updateData)).rejects.toThrow('less than 500 characters');
    });

    it('should throw error for invalid first name', async () => {
      const updateData = {
        firstName: '' // Empty string
      };

      await expect(userService.updateProfile(testUser.id, updateData)).rejects.toThrow(CustomError);
      await expect(userService.updateProfile(testUser.id, updateData)).rejects.toThrow('between 1 and 50 characters');
    });
  });

  describe('updateUser', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should update username with valid data', async () => {
      const updateData = {
        username: 'newusername'
      };

      const updatedUser = await userService.updateUser(testUser.id, updateData);

      expect(updatedUser.username).toBe('newusername');
    });

    it('should update email with valid data', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const updatedUser = await userService.updateUser(testUser.id, updateData);

      expect(updatedUser.email).toBe('newemail@example.com');
      expect(updatedUser.emailVerified).toBe(false); // Should require re-verification
    });

    it('should throw error for duplicate username', async () => {
      // Create another user
      await authService.signup({
        email: 'test2@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'existinguser'
      });

      const updateData = {
        username: 'existinguser'
      };

      await expect(userService.updateUser(testUser.id, updateData)).rejects.toThrow(CustomError);
      await expect(userService.updateUser(testUser.id, updateData)).rejects.toThrow('already taken');
    });

    it('should throw error for duplicate email', async () => {
      // Create another user
      await authService.signup({
        email: 'existing@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith'
      });

      const updateData = {
        email: 'existing@example.com'
      };

      await expect(userService.updateUser(testUser.id, updateData)).rejects.toThrow(CustomError);
      await expect(userService.updateUser(testUser.id, updateData)).rejects.toThrow('already taken');
    });

    it('should throw error for invalid username', async () => {
      const updateData = {
        username: 'ab' // Too short
      };

      await expect(userService.updateUser(testUser.id, updateData)).rejects.toThrow(CustomError);
      await expect(userService.updateUser(testUser.id, updateData)).rejects.toThrow('3-20 characters');
    });
  });

  describe('followUser', () => {
    let user1: any, user2: any;

    beforeEach(async () => {
      const userData1 = {
        email: 'user1@example.com',
        password: 'Password123',
        firstName: 'User',
        lastName: 'One',
        username: 'user1'
      };

      const userData2 = {
        email: 'user2@example.com',
        password: 'Password123',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2'
      };

      const result1 = await authService.signup(userData1);
      const result2 = await authService.signup(userData2);
      user1 = result1.user;
      user2 = result2.user;
    });

    it('should follow user successfully', async () => {
      const result = await userService.followUser(user1.id, user2.id);

      expect(result.message).toContain('Successfully followed');
      expect(result.follow).toBeDefined();
      expect(result.follow.followerId).toBe(user1.id);
      expect(result.follow.followingId).toBe(user2.id);
    });

    it('should throw error when trying to follow self', async () => {
      await expect(userService.followUser(user1.id, user1.id)).rejects.toThrow(CustomError);
      await expect(userService.followUser(user1.id, user1.id)).rejects.toThrow('cannot follow yourself');
    });

    it('should throw error when already following', async () => {
      await userService.followUser(user1.id, user2.id);

      await expect(userService.followUser(user1.id, user2.id)).rejects.toThrow(CustomError);
      await expect(userService.followUser(user1.id, user2.id)).rejects.toThrow('already following');
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(userService.followUser(user1.id, nonExistentId)).rejects.toThrow(CustomError);
      await expect(userService.followUser(user1.id, nonExistentId)).rejects.toThrow('not found');
    });
  });

  describe('unfollowUser', () => {
    let user1: any, user2: any;

    beforeEach(async () => {
      const userData1 = {
        email: 'user1@example.com',
        password: 'Password123',
        firstName: 'User',
        lastName: 'One',
        username: 'user1'
      };

      const userData2 = {
        email: 'user2@example.com',
        password: 'Password123',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2'
      };

      const result1 = await authService.signup(userData1);
      const result2 = await authService.signup(userData2);
      user1 = result1.user;
      user2 = result2.user;

      // Make user1 follow user2
      await userService.followUser(user1.id, user2.id);
    });

    it('should unfollow user successfully', async () => {
      const result = await userService.unfollowUser(user1.id, user2.id);

      expect(result.message).toContain('Successfully unfollowed');

      // Verify follow relationship is gone
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user1.id,
            followingId: user2.id
          }
        }
      });
      expect(follow).toBeNull();
    });

    it('should throw error when not following', async () => {
      // First unfollow
      await userService.unfollowUser(user1.id, user2.id);

      // Try to unfollow again
      await expect(userService.unfollowUser(user1.id, user2.id)).rejects.toThrow(CustomError);
      await expect(userService.unfollowUser(user1.id, user2.id)).rejects.toThrow('not following');
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      // Create multiple test users
      const users = [
        {
          email: 'john.doe@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe'
        },
        {
          email: 'jane.smith@example.com',
          password: 'Password123',
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith'
        },
        {
          email: 'bob.johnson@example.com',
          password: 'Password123',
          firstName: 'Bob',
          lastName: 'Johnson',
          username: 'bobjohnson'
        }
      ];

      for (const userData of users) {
        await authService.signup(userData);
      }
    });

    it('should search users by first name', async () => {
      const result = await userService.searchUsers('John');

      expect(result.users.length).toBeGreaterThan(0);
      expect(result.users[0].profile.firstName).toContain('John');
      expect(result.pagination).toBeDefined();
    });

    it('should search users by username', async () => {
      const result = await userService.searchUsers('jane');

      expect(result.users.length).toBeGreaterThan(0);
      expect(result.users[0].username).toContain('jane');
    });

    it('should return empty results for non-matching query', async () => {
      const result = await userService.searchUsers('nonexistentuser');

      expect(result.users.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should respect pagination parameters', async () => {
      const result = await userService.searchUsers('', 1, 2);

      expect(result.users.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });
  });

  describe('deleteUser', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should soft delete user', async () => {
      const result = await userService.deleteUser(testUser.id);

      expect(result.message).toContain('deactivated');

      // Verify user is marked as inactive
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(deletedUser?.isActive).toBe(false);
      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(userService.deleteUser(nonExistentId)).rejects.toThrow(CustomError);
      await expect(userService.deleteUser(nonExistentId)).rejects.toThrow('User not found');
    });
  });
});
