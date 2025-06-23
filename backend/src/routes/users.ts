import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserService } from '../services/userService';
import { authenticate, checkUserOwnership } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { catchAsync } from '../middleware/errorHandler';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const userService = new UserService();

// Apply rate limiting to all user routes
router.use(apiRateLimiter);

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
];

const updateUserValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

// Routes

// Get current user profile
router.get('/me', authenticate, catchAsync(async (req: any, res: any) => {
  const user = await userService.getUserById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: { user }
  });
}));

// Update current user profile
router.put('/me/profile', authenticate, validate(updateProfileValidation), catchAsync(async (req: any, res: any) => {
  const updatedProfile = await userService.updateProfile(req.user.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile: updatedProfile }
  });
}));

// Update current user data
router.put('/me', authenticate, validate(updateUserValidation), catchAsync(async (req: any, res: any) => {
  const updatedUser = await userService.updateUser(req.user.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
}));

// Delete current user account
router.delete('/me', authenticate, catchAsync(async (req: any, res: any) => {
  const result = await userService.deleteUser(req.user.id);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

// Search users
router.get('/search', validate(searchValidation), catchAsync(async (req: any, res: any) => {
  const { q: query, page = 1, limit = 20 } = req.query;
  const result = await userService.searchUsers(query, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
}));

// Get user by username
router.get('/:username', catchAsync(async (req: any, res: any) => {
  const user = await userService.getUserByUsername(req.params.username);
  
  res.status(200).json({
    success: true,
    data: { user }
  });
}));

// Get user followers
router.get('/:userId/followers', validate(paginationValidation), catchAsync(async (req: any, res: any) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await userService.getUserFollowers(req.params.userId, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
}));

// Get user following
router.get('/:userId/following', validate(paginationValidation), catchAsync(async (req: any, res: any) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await userService.getUserFollowing(req.params.userId, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
}));

// Follow a user
router.post('/:userId/follow', authenticate, catchAsync(async (req: any, res: any) => {
  const result = await userService.followUser(req.user.id, req.params.userId);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

// Unfollow a user
router.delete('/:userId/follow', authenticate, catchAsync(async (req: any, res: any) => {
  const result = await userService.unfollowUser(req.user.id, req.params.userId);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

// Get recommended users
router.get('/recommendations/users', authenticate, catchAsync(async (req: any, res: any) => {
  const { limit = 10 } = req.query;
  const users = await userService.getRecommendedUsers(req.user.id, parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: { users }
  });
}));

export default router;
