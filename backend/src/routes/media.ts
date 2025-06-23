import { Router } from 'express';

const router = Router();

// TODO: Implement media routes
// POST /media/upload - Upload media file
// GET /media/:id - Get media file
// DELETE /media/:id - Delete media file
// POST /media/process - Process media

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Media routes - Coming soon' });
});

export default router;
