import { AuthService } from '../src/services/authService';
import { PrismaClient } from '@prisma/client';
import { CustomError } from '../src/middleware/errorHandler';

const prisma = new PrismaClient();
const authService = new AuthService();

describe('AuthService', () => {
  describe('signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const result = await authService.signup(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.password).toBeUndefined();
      expect(result.user.profile.firstName).toBe(userData.firstName);
      expect(result.user.profile.lastName).toBe(userData.lastName);
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(authService.signup(userData)).rejects.toThrow(CustomError);
      await expect(authService.signup(userData)).rejects.toThrow('valid email');
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(authService.signup(userData)).rejects.toThrow(CustomError);
      await expect(authService.signup(userData)).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await authService.signup(userData);

      await expect(authService.signup({
        ...userData,
        firstName: 'Jane',
        lastName: 'Smith'
      })).rejects.toThrow(CustomError);
      await expect(authService.signup({
        ...userData,
        firstName: 'Jane',
        lastName: 'Smith'
      })).rejects.toThrow('already exists');
    });

    it('should throw error for duplicate username', async () => {
      const userData1 = {
        email: 'test1@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };

      const userData2 = {
        email: 'test2@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'johndoe'
      };

      await authService.signup(userData1);

      await expect(authService.signup(userData2)).rejects.toThrow(CustomError);
      await expect(authService.signup(userData2)).rejects.toThrow('Username is already taken');
    });
  });

  describe('login', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123'
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeUndefined();
    });

    it('should throw error for invalid email', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'Password123'
      })).rejects.toThrow(CustomError);
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'Password123'
      })).rejects.toThrow('Incorrect email or password');
    });

    it('should throw error for invalid password', async () => {
      await expect(authService.login({
        email: 'test@example.com',
        password: 'WrongPassword'
      })).rejects.toThrow(CustomError);
      await expect(authService.login({
        email: 'test@example.com',
        password: 'WrongPassword'
      })).rejects.toThrow('Incorrect email or password');
    });

    it('should throw error for inactive user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false }
      });

      await expect(authService.login({
        email: 'test@example.com',
        password: 'Password123'
      })).rejects.toThrow(CustomError);
      await expect(authService.login({
        email: 'test@example.com',
        password: 'Password123'
      })).rejects.toThrow('deactivated');
    });

    it('should update last login time', async () => {
      const beforeLogin = new Date();
      
      await authService.login({
        email: 'test@example.com',
        password: 'Password123'
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date);
      expect(updatedUser?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('verifyEmail', () => {
    let testUser: any;
    let verificationCode: string;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;

      // Get verification code from database
      const user = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      verificationCode = user?.emailVerificationCode || '';
    });

    it('should verify email with valid code', async () => {
      const result = await authService.verifyEmail(verificationCode);

      expect(result.message).toContain('verified successfully');

      // Check that user is now verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser?.emailVerified).toBe(true);
      expect(updatedUser?.emailVerificationCode).toBeNull();
      expect(updatedUser?.emailVerificationExpires).toBeNull();
    });

    it('should throw error for invalid code', async () => {
      await expect(authService.verifyEmail('invalid-code')).rejects.toThrow(CustomError);
      await expect(authService.verifyEmail('invalid-code')).rejects.toThrow('Invalid or expired');
    });

    it('should throw error for expired code', async () => {
      // Set expiration to past
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          emailVerificationExpires: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      });

      await expect(authService.verifyEmail(verificationCode)).rejects.toThrow(CustomError);
      await expect(authService.verifyEmail(verificationCode)).rejects.toThrow('Invalid or expired');
    });
  });

  describe('changePassword', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should change password with valid current password', async () => {
      const result = await authService.changePassword(
        testUser.id,
        'Password123',
        'NewPassword456'
      );

      expect(result.message).toContain('changed successfully');

      // Verify old password no longer works
      await expect(authService.login({
        email: 'test@example.com',
        password: 'Password123'
      })).rejects.toThrow(CustomError);

      // Verify new password works
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'NewPassword456'
      });
      expect(loginResult.user.email).toBe('test@example.com');
    });

    it('should throw error for incorrect current password', async () => {
      await expect(authService.changePassword(
        testUser.id,
        'WrongPassword',
        'NewPassword456'
      )).rejects.toThrow(CustomError);
      await expect(authService.changePassword(
        testUser.id,
        'WrongPassword',
        'NewPassword456'
      )).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for weak new password', async () => {
      await expect(authService.changePassword(
        testUser.id,
        'Password123',
        'weak'
      )).rejects.toThrow(CustomError);
      await expect(authService.changePassword(
        testUser.id,
        'Password123',
        'weak'
      )).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should update passwordChangedAt timestamp', async () => {
      const beforeChange = new Date();
      
      await authService.changePassword(
        testUser.id,
        'Password123',
        'NewPassword456'
      );

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser?.passwordChangedAt).toBeDefined();
      expect(updatedUser?.passwordChangedAt).toBeInstanceOf(Date);
      expect(updatedUser?.passwordChangedAt!.getTime()).toBeGreaterThanOrEqual(beforeChange.getTime());
    });
  });

  describe('logout', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.signup(userData);
      testUser = result.user;
    });

    it('should logout user successfully', async () => {
      const result = await authService.logout(testUser.id);

      expect(result.message).toContain('Logged out successfully');

      // Check that lastLogoutAt is updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser?.lastLogoutAt).toBeDefined();
      expect(updatedUser?.lastLogoutAt).toBeInstanceOf(Date);
    });
  });
});
