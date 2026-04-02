import { Router } from 'express';
import { FavoritesController } from '../controllers/favoritesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * All favorites routes are protected by current user session.
 */
router.use(authenticateToken as any);

/**
 * GET /api/favorites
 * List favorites.
 */
router.get('/', FavoritesController.getFavorites);

/**
 * POST /api/favorites
 * Add to favorites.
 */
router.post('/', FavoritesController.addFavorite);

/**
 * DELETE /api/favorites/:name
 * Remove from favorites.
 */
router.delete('/:name', FavoritesController.removeFavorite);

export default router;
