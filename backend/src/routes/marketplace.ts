import { Router } from 'express';

const router = Router();

// TODO: Implement marketplace routes
// GET /marketplace - Browse marketplace
// GET /marketplace/agents - Get available agents
// POST /marketplace/purchase - Purchase agent
// GET /marketplace/my-purchases - Get user purchases
// GET /marketplace/my-sales - Get user sales
// POST /marketplace/agents/:id/review - Add review

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Marketplace routes - Coming soon' });
});

export default router;
