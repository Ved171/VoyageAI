import express from 'express';
import User from '../models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/users/search?q=query
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    const currentUserId = req.user!.userId;
    const searchRegex = new RegExp(query, 'i');

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id name email').limit(10); // Limit results for performance

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

export default router;
