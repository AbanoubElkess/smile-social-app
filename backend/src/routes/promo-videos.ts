import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { catchAsync } from '../middleware/errorHandler';
import { promoVideoService } from '../services/promoVideoService';

const router = Router();

// Validation schemas
const createVideoValidation = [
  body('agentId').isUUID().withMessage('Valid agent ID is required'),
  body('productName').trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be 1-100 characters'),
  body('productDescription').trim().isLength({ min: 1, max: 1000 }).withMessage('Product description must be 1-1000 characters'),
  body('targetAudience').trim().isLength({ min: 1, max: 200 }).withMessage('Target audience must be 1-200 characters'),
  body('videoStyle').isIn(['professional', 'casual', 'animated', 'testimonial']).withMessage('Invalid video style'),
  body('duration').isIn([15, 30, 60]).withMessage('Duration must be 15, 30, or 60 seconds'),
  body('voiceType').isIn(['male', 'female', 'neutral']).withMessage('Invalid voice type'),
  body('musicStyle').optional().isIn(['upbeat', 'calm', 'corporate', 'none']).withMessage('Invalid music style'),
  body('brandColors').optional().isArray({ max: 5 }).withMessage('Maximum 5 brand colors allowed'),
  body('brandColors.*').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Brand colors must be valid hex colors'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be valid')
];

const getVideoValidation = [
  param('requestId').isUUID().withMessage('Valid request ID is required')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

/**
 * POST /api/promo-videos
 * Create a new promotional video generation request
 */
router.post('/', 
  authenticate, 
  validate(createVideoValidation), 
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    
    const videoRequest = await promoVideoService.createVideoRequest({
      userId,
      agentId: req.body.agentId,
      productName: req.body.productName,
      productDescription: req.body.productDescription,
      targetAudience: req.body.targetAudience,
      videoStyle: req.body.videoStyle,
      duration: req.body.duration,
      voiceType: req.body.voiceType,
      musicStyle: req.body.musicStyle,
      brandColors: req.body.brandColors,
      logoUrl: req.body.logoUrl
    });

    res.status(201).json({
      success: true,
      message: 'Video generation request created successfully',
      data: videoRequest
    });
  })
);

/**
 * GET /api/promo-videos
 * Get all video requests for the authenticated user
 */
router.get('/',
  authenticate,
  validate(paginationValidation),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await promoVideoService.getUserVideoRequests(userId, page, limit);

    res.json({
      success: true,
      data: result.requests,
      pagination: result.pagination
    });
  })
);

/**
 * GET /api/promo-videos/:requestId
 * Get a specific video request by ID
 */
router.get('/:requestId',
  authenticate,
  validate(getVideoValidation),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    const videoRequest = await promoVideoService.getVideoRequest(requestId, userId);

    res.json({
      success: true,
      data: videoRequest
    });
  })
);

/**
 * GET /api/promo-videos/:requestId/progress
 * Get video generation progress
 */
router.get('/:requestId/progress',
  authenticate,
  validate(getVideoValidation),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    // Verify user has access to this request
    await promoVideoService.getVideoRequest(requestId, userId);

    const progress = await promoVideoService.getVideoProgress(requestId);

    res.json({
      success: true,
      data: progress
    });
  })
);

/**
 * POST /api/promo-videos/:requestId/cancel
 * Cancel video generation
 */
router.post('/:requestId/cancel',
  authenticate,
  validate(getVideoValidation),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    const updatedRequest = await promoVideoService.cancelVideoRequest(requestId, userId);

    res.json({
      success: true,
      message: 'Video generation cancelled successfully',
      data: updatedRequest
    });
  })
);

/**
 * DELETE /api/promo-videos/:requestId
 * Delete video request and associated files
 */
router.delete('/:requestId',
  authenticate,
  validate(getVideoValidation),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    const result = await promoVideoService.deleteVideoRequest(requestId, userId);

    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * POST /api/promo-videos/webhook
 * Webhook for AI service to update video generation status
 * This should be called by the AI service when video generation is complete
 */
router.post('/webhook',
  // TODO: Add webhook authentication/verification
  catchAsync(async (req: Request, res: Response) => {
    const { requestId, status, videoUrl, thumbnailUrl, errorMessage } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and status are required'
      });
    }

    await promoVideoService.updateVideoRequestStatus(
      requestId,
      status,
      errorMessage,
      videoUrl,
      thumbnailUrl
    );

    res.json({
      success: true,
      message: 'Video status updated successfully'
    });
  })
);

/**
 * GET /api/promo-videos/templates
 * Get available video templates and styles
 */
router.get('/templates',
  catchAsync(async (req: Request, res: Response) => {
    const templates = {
      videoStyles: [
        {
          id: 'professional',
          name: 'Professional',
          description: 'Clean, corporate style with professional voiceover',
          preview: '/assets/previews/professional.mp4'
        },
        {
          id: 'casual',
          name: 'Casual',
          description: 'Friendly, conversational tone with relaxed pacing',
          preview: '/assets/previews/casual.mp4'
        },
        {
          id: 'animated',
          name: 'Animated',
          description: 'Engaging animations with dynamic visual effects',
          preview: '/assets/previews/animated.mp4'
        },
        {
          id: 'testimonial',
          name: 'Testimonial',
          description: 'Customer testimonial style with authentic feel',
          preview: '/assets/previews/testimonial.mp4'
        }
      ],
      durations: [
        { value: 15, label: '15 seconds', description: 'Quick highlights' },
        { value: 30, label: '30 seconds', description: 'Standard promotional video' },
        { value: 60, label: '60 seconds', description: 'Detailed product showcase' }
      ],
      voiceTypes: [
        { value: 'male', label: 'Male Voice', description: 'Professional male narrator' },
        { value: 'female', label: 'Female Voice', description: 'Professional female narrator' },
        { value: 'neutral', label: 'Neutral Voice', description: 'AI-generated neutral voice' }
      ],
      musicStyles: [
        { value: 'upbeat', label: 'Upbeat', description: 'Energetic background music' },
        { value: 'calm', label: 'Calm', description: 'Relaxed ambient music' },
        { value: 'corporate', label: 'Corporate', description: 'Professional background music' },
        { value: 'none', label: 'No Music', description: 'Voice only, no background music' }
      ]
    };

    res.json({
      success: true,
      data: templates
    });
  })
);

export default router;
