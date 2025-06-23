import { Router } from 'express';
import { body } from 'express-validator';
import { AuthService } from '../services/authService';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { catchAsync } from '../middleware/errorHandler';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authService = new AuthService();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

// Validation rules
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Routes
router.post('/signup', validate(signupValidation), catchAsync(async (req, res) => {
  const result = await authService.signup(req.body);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully. Please verify your email.',
    data: result
  });
}));

router.post('/login', validate(loginValidation), catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  
  // Set cookies
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  res.cookie('jwt', result.token, cookieOptions);
  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result
  });
}));

router.post('/verify-email', catchAsync(async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Verification code is required'
    });
  }

  const result = await authService.verifyEmail(code);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

router.post('/resend-verification', catchAsync(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const result = await authService.resendVerificationEmail(email);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

router.post('/forgot-password', validate(forgotPasswordValidation), catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

router.post('/reset-password', validate(resetPasswordValidation), catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

router.post('/change-password', authenticate, validate(changePasswordValidation), catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;
  
  const result = await authService.changePassword(userId, currentPassword, newPassword);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

router.post('/logout', authenticate, catchAsync(async (req, res) => {
  const userId = (req as any).user.id;
  const result = await authService.logout(userId);
  
  // Clear cookies
  res.clearCookie('jwt');
  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: result.message
  });
}));

router.get('/me', authenticate, catchAsync(async (req, res) => {
  const user = (req as any).user;
  
  // Remove sensitive data
  const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = user;
  
  res.status(200).json({
    success: true,
    data: {
      user: userWithoutSensitiveData
    }
  });
}));

router.get('/check-auth', optionalAuth, catchAsync(async (req, res) => {
  const user = (req as any).user;
  
  if (user) {
    const { password, emailVerificationCode, passwordResetToken, ...userWithoutSensitiveData } = user;
    
    res.status(200).json({
      success: true,
      authenticated: true,
      data: {
        user: userWithoutSensitiveData
      }
    });
  } else {
    res.status(200).json({
      success: true,
      authenticated: false,
      data: null
    });
  }
}));

export default router;
