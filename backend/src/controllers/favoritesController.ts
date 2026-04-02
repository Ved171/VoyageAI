import { Request, Response } from 'express';
import User from '../models/User.js';

export class FavoritesController {
  /**
   * GET /api/favorites
   * Retrieve the authenticated user's favorite destinations.
   */
  static async getFavorites(req: any, res: Response) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(200).json(user.favorites || []);
    } catch (error: any) {
      console.error('Get Favorites Error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  }

  /**
   * POST /api/favorites
   * Add a destination to the user's favorites.
   */
  static async addFavorite(req: any, res: Response) {
    try {
      const { name, description, image } = req.body;
      
      if (!name || !description || !image) {
        return res.status(400).json({ error: 'Missing destination details' });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already favorited
      const exists = user.favorites.some(f => f.name === name);
      if (exists) {
        return res.status(400).json({ error: 'Destination already in favorites' });
      }

      user.favorites.push({ name, description, image });
      await user.save();

      return res.status(201).json(user.favorites);
    } catch (error: any) {
      console.error('Add Favorite Error:', error.message);
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
  }

  /**
   * DELETE /api/favorites/:name
   * Remove a destination from favorites.
   */
  static async removeFavorite(req: any, res: Response) {
    try {
      const { name } = req.params;
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.favorites = user.favorites.filter(f => f.name !== name);
      await user.save();

      return res.status(200).json(user.favorites);
    } catch (error: any) {
      console.error('Remove Favorite Error:', error.message);
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }
  }
}
