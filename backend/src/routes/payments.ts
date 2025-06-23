import { Router } from 'express';

const router = Router();

// TODO: Implement payment routes
// POST /payments/intent - Create payment intent
// POST /payments/confirm - Confirm payment
// GET /payments/history - Get payment history
// POST /payments/refund - Process refund

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Payments routes - Coming soon' });
});

export default router;
