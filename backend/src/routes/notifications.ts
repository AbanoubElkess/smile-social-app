import { Router } from 'express';

const router = Router();

// TODO: Implement notification routes
// GET /notifications - Get user notifications
// PUT /notifications/:id/read - Mark notification as read
// PUT /notifications/read-all - Mark all as read
// DELETE /notifications/:id - Delete notification

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Notifications routes - Coming soon' });
});

export default router;
