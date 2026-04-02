import { Request, Response } from 'express';
import { DestinationService } from '../services/destinationService.js';

export class DestinationController {
  
  /**
   * GET /api/destinations
   * Handles requests for fetching famous destination summaries using Wikipedia.
   */
  static async getDestinations(req: Request, res: Response) {
    try {
      // 1. Get the optional search parameter (e.g. ?search=Paris)
      const searchQuery = req.query.search as string;

      // 2. Call our DestinationService to fetch the Wikipedia data
      // Passing the searchQuery to optionally filter the results.
      const destinations = await DestinationService.fetchDestinations(searchQuery);

      // 3. Return the successfully fetched data as a JSON response
      // Status 200 means OK.
      return res.status(200).json(destinations);
      
    } catch (error: any) {
      console.error('Destination Controller Error:', error.message);
      // Status 500 means Internal Server Error
      return res.status(500).json({ error: 'Failed to fetch destination data' });
    }
  }
}
