import { Router } from 'express';
import { DestinationController } from '../controllers/destinationController.js';

const router = Router();

/**
 * GET /api/destinations
 * Discovery route to fetch tourist highlights with Pexels imagery.
 */
router.get('/', DestinationController.getDestinations);

export default router;
