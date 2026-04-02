/**
 * Service to handle Travel Discovery using the free Wikipedia REST API.
 * This service requires NO API keys and provides rich descriptions and images
 * for predefined famous destinations.
 */

export class DestinationService {
  private static WIKIPEDIA_API_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

  // A massive, expanded predefined list of 150+ world-famous travel destinations.
  private static FAMOUS_DESTINATIONS = [
    'Paris', 'Bali', 'New_York_City', 'Dubai', 'Rome', 'Tokyo', 'London', 'Singapore', 'Istanbul', 'Sydney',
    'Kyoto', 'Venice', 'Cairo', 'Cape_Town', 'Amsterdam', 'Barcelona', 'Prague', 'Vienna', 'Milan', 'Bangkok',
    'Delhi', 'Rio_de_Janeiro', 'Los_Angeles', 'Las_Vegas', 'San_Francisco', 'Miami', 'Chicago', 'Havana',
    'Buenos_Aires', 'Cusco', 'Lima', 'Bogotá', 'Cartagena', 'Santiago', 'Rio', 'Cancun', 'Mexico_City',
    'Vancouver', 'Toronto', 'Montreal', 'Reykjavik', 'Oslo', 'Stockholm', 'Copenhagen', 'Helsinki', 'Dublin',
    'Edinburgh', 'Belfast', 'Manchester', 'Lisbon', 'Porto', 'Madrid', 'Seville', 'Valencia', 'Granada',
    'Florence', 'Naples', 'Amalfi', 'Athens', 'Santorini', 'Mykonos', 'Monaco', 'Nice', 'Cannes', 'Marseille',
    'Bordeaux', 'Lyon', 'Geneva', 'Zurich', 'Lucerne', 'Munich', 'Berlin', 'Frankfurt', 'Hamburg', 'Salzburg',
    'Budapest', 'Warsaw', 'Krakow', 'Bucharest', 'Sofia', 'Dubrovnik', 'Split', 'Belgrade', 'Sarajevo',
    'Jerusalem', 'Tel_Aviv', 'Petra', 'Amman', 'Beirut', 'Doha', 'Abu_Dhabi', 'Muscat', 'Riyadh', 'Tehran',
    'Isfahan', 'Marrakech', 'Casablanca', 'Fes', 'Nairobi', 'Zanzibar', 'Dar_es_Salaam', 'Kigali', 'Addis_Ababa',
    'Accra', 'Dakar', 'Lagos', 'Johannesburg', 'Pretoria', 'Durban', 'Victoria_Falls', 'Colombo',
    'Mumbai', 'Jaipur', 'Agra', 'Udaipur', 'Varanasi', 'Kashmir', 'Goa', 'Kathmandu', 'Pokhara', 'Thimphu',
    'Yangon', 'Bagan', 'Chiang_Mai', 'Phuket', 'Kuala_Lumpur', 'Penang', 'Jakarta', 'Yogyakarta', 'Ho_Chi_Minh_City',
    'Hanoi', 'Hoi_An', 'Phnom_Penh', 'Siem_Reap', 'Luang_Prabang', 'Manila', 'Cebu', 'Boracay', 'Taipei',
    'Seoul', 'Jeju', 'Busan', 'Beijing', 'Shanghai', 'Hong_Kong', 'Macau', 'Guangzhou', 'Shenzhen', 'Chengdu',
    'Osaka', 'Nara', 'Hiroshima', 'Fukuoka', 'Sapporo', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold_Coast',
    'Auckland', 'Wellington', 'Queenstown', 'Fiji', 'Tahiti', 'Bora_Bora', 'Honolulu', 'Maui', 'Kauai'
  ];

  /**
   * Fetches data for a single destination from Wikipedia.
   * @param place The name of the destination (e.g., 'Paris')
   * @returns Formatted destination object or null if failed.
   */
  private static async fetchWikipediaData(place: string): Promise<any> {
    try {
      // The Wikipedia REST API endpoint for page summaries
      const response = await fetch(`${this.WIKIPEDIA_API_URL}${place}`);

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();

      // We only want to return valid places that have at least a title and extract
      if (!data.title || !data.extract) {
        return null;
      }

      return {
        name: data.title,
        description: data.extract,
        // If Wikipedia has a thumbnail, use it. Otherwise, provide a default high-quality placeholder.
        image: data.thumbnail?.source || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
      };
    } catch (error: any) {
      console.error(`Error fetching data for ${place}:`, error.message);
      return null;
    }
  }

  /**
   * Fetches a list of famous destinations.
   * Uses Promise.all to fetch data concurrently for maximum efficiency!
   * 
   * @param query Optional search term to filter the predefined list.
   * @returns Array of formatted destinations (Max 12).
   */
  static async fetchDestinations(query?: string): Promise<any[]> {
    // 1. Determine which destinations to look up.
    let placesToFetch = this.FAMOUS_DESTINATIONS;

    if (query && query.trim() !== '') {
      const lowerQuery = query.toLowerCase().trim();
      placesToFetch = placesToFetch.filter(place =>
        // Example: 'New_York_City' -> 'new york city'
        place.replace(/_/g, ' ').toLowerCase().includes(lowerQuery)
      );
    } else {
      // If no search query, randomize the full list so we get fresh cities every time
      placesToFetch = [...placesToFetch].sort(() => 0.5 - Math.random());
    }

    // Always slice to a maximum of 12 places so we don't spam Wikipedia or overload the UI
    // (This ensures exactly 12 cards -> 3 cards per row, 4 rows total when no search query)
    placesToFetch = placesToFetch.slice(0, 12);

    // 2. Fetch data from Wikipedia concurrently.
    const fetchPromises = placesToFetch.map(place => this.fetchWikipediaData(place));
    const results = await Promise.all(fetchPromises);

    // 3. Filter out any null results (destinations that failed to load)
    const validDestinations = results.filter(dest => dest !== null);

    return validDestinations;
  }
}

