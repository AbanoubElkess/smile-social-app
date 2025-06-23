import { Router } from 'express';

const router = Router();

// TODO: Implement conversation routes
// GET /conversations - Get user conversations
// POST /conversations - Create new conversation
// GET /conversations/:id - Get conversation details
// POST /conversations/:id/messages - Send message
// PUT /conversations/:id/read - Mark as read

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Conversations routes - Coming soon' });
});

export default router;
