import { Router } from 'express';
import { aiAgentService } from '../services/aiAgentService';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { catchAsync } from '../utils/catchAsync';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation schemas
const createAgentValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('personality').isObject().withMessage('Personality must be an object'),
  body('capabilities').isArray().withMessage('Capabilities must be an array'),
  body('pricing').isObject().withMessage('Pricing must be an object'),
  body('pricing.model').isIn(['FREE', 'PAID']).withMessage('Pricing model must be FREE or PAID'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
];

const updateAgentValidation = [
  param('id').isUUID().withMessage('Agent ID must be a valid UUID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('personality').optional().isObject().withMessage('Personality must be an object'),
  body('capabilities').optional().isArray().withMessage('Capabilities must be an array'),
  body('pricing').optional().isObject().withMessage('Pricing must be an object'),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'SUSPENDED']).withMessage('Status must be DRAFT, PUBLISHED, or SUSPENDED')
];

const videoGenerationValidation = [
  param('id').isUUID().withMessage('Agent ID must be a valid UUID'),
  body('dimensions').isObject().withMessage('Dimensions must be an object'),
  body('dimensions.width').isInt({ min: 100, max: 4000 }).withMessage('Width must be between 100 and 4000 pixels'),
  body('dimensions.height').isInt({ min: 100, max: 4000 }).withMessage('Height must be between 100 and 4000 pixels'),
  body('duration').optional().isInt({ min: 5, max: 300 }).withMessage('Duration must be between 5 and 300 seconds'),
  body('productName').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Product name must be between 1 and 200 characters'),
  body('productDescription').optional().trim().isLength({ max: 1000 }).withMessage('Product description must be less than 1000 characters'),
  body('shopifyStoreUrl').optional().isURL().withMessage('Shopify store URL must be valid'),
  body('style').optional().isIn(['modern', 'classic', 'minimalist', 'bold', 'elegant']).withMessage('Style must be one of: modern, classic, minimalist, bold, elegant')
];

// Create a new AI agent
router.post('/', authenticate, validate(createAgentValidation), catchAsync(async (req: any, res: any) => {
  const agent = await aiAgentService.createAgent(req.user.id, req.body);
  
  res.status(201).json({
    success: true,
    data: {
      agent
    },
    message: 'AI agent created successfully'
  });
}));

// Get all AI agents with filtering and pagination
router.get('/', optionalAuth, catchAsync(async (req: any, res: any) => {
  const {
    searchQuery,
    status,
    page = 1,
    limit = 20
  } = req.query;

  const result = await aiAgentService.listAgents({
    searchQuery,
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: result,
    message: 'AI agents retrieved successfully'
  });
}));

// Get a specific AI agent by ID
router.get('/:id', optionalAuth, catchAsync(async (req: any, res: any) => {
  const agent = await aiAgentService.getAgentById(req.params.id);
  
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'AI agent not found'
    });
  }

  res.json({
    success: true,
    data: {
      agent
    },
    message: 'AI agent retrieved successfully'
  });
}));

// Update an AI agent
router.put('/:id', authenticate, validate(updateAgentValidation), catchAsync(async (req: any, res: any) => {
  const agent = await aiAgentService.updateAgent(req.params.id, req.user.id, req.body);
  
  res.json({
    success: true,
    data: {
      agent
    },
    message: 'AI agent updated successfully'
  });
}));

// Delete an AI agent
router.delete('/:id', authenticate, catchAsync(async (req: any, res: any) => {
  const result = await aiAgentService.deleteAgent(req.params.id, req.user.id);
  
  res.json({
    success: true,
    data: result,
    message: 'AI agent deleted successfully'
  });
}));

// Generate product video using AI agent
router.post('/:id/generate-video', authenticate, validate(videoGenerationValidation), catchAsync(async (req: any, res: any) => {
  const video = await aiAgentService.generateProductVideo(req.params.id, req.user.id, req.body);
  
  res.status(201).json({
    success: true,
    data: {
      video
    },
    message: 'Product video generated successfully'
  });
}));

// Get video generation history for an agent
router.get('/:id/videos', authenticate, catchAsync(async (req: any, res: any) => {
  const {
    page = 1,
    limit = 10
  } = req.query;

  const result = await aiAgentService.getAgentVideoHistory(
    req.params.id,
    req.user.id,
    parseInt(page),
    parseInt(limit)
  );

  res.json({
    success: true,
    data: result,
    message: 'Video history retrieved successfully'
  });
}));

export default router;
