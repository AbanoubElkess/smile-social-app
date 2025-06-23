import { Router } from 'express';

const router = Router();

// TODO: Implement post routes
// GET /posts - Get all posts
// POST /posts - Create new post
// GET /posts/:id - Get specific post
// PUT /posts/:id - Update post
// DELETE /posts/:id - Delete post
// POST /posts/:id/like - Like/unlike post
// GET /posts/:id/comments - Get post comments
// POST /posts/:id/comments - Add comment to post

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Posts routes - Coming soon' });
});

export default router;
