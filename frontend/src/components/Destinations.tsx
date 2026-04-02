import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, MapPin, Search, ArrowRight, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

/**
 * Destinations Component
 * This component fetches data from our own backend (which uses the Wikipedia API behind the scenes)
 * to display famous travel destinations.
 */

// Define the shape of the data we expect from the backend
interface Destination {
  name: string;
  description: string;
  image: string;
}

const Destinations: React.FC = () => {
  // State variables hold information that can change and cause the UI to update when modified.
  // 1. Array holding the destination objects
  const [destinations, setDestinations] = useState<Destination[]>([]);
  // 2. Boolean holding whether data is currently being fetched
  const [isLoading, setIsLoading] = useState(true);
  // 3. String holding any error messages to show the user
  const [error, setError] = useState<string | null>(null);
  // 4. String holding the user's search input filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // 5. Favorites state
  const [favorites, setFavorites] = useState<Destination[]>([]);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 1. Load favorites from DB on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncFavorites = async () => {
      try {
        const dbFavorites = await apiService.getFavorites();
        
        // Migration logic: if we have local favorites, add them to DB
        const localSaved = localStorage.getItem('voyage_ai_favorites');
        if (localSaved) {
          const localFavs: Destination[] = JSON.parse(localSaved);
          for (const fav of localFavs) {
            // Only add if not already in DB
            if (!dbFavorites.some(f => f.name === fav.name)) {
              await apiService.addFavorite(fav);
            }
          }
          // Clear local storage after migration
          localStorage.removeItem('voyage_ai_favorites');
          const updatedDB = await apiService.getFavorites();
          setFavorites(updatedDB);
        } else {
          setFavorites(dbFavorites);
        }
      } catch (e) {
        console.error("Failed to sync favorites with DB", e);
      }
    };

    syncFavorites();
  }, [isAuthenticated]);

  const toggleFavorite = async (dest: Destination) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save favorites');
      navigate('/login');
      return;
    }

    const isFavorited = favorites.some(f => f.name === dest.name);
    
    try {
      if (isFavorited) {
        await apiService.removeFavorite(dest.name);
        setFavorites(prev => prev.filter(f => f.name !== dest.name));
        toast.success(`${dest.name.replace(/_/g, ' ')} removed from favorites`);
      } else {
        await apiService.addFavorite(dest);
        setFavorites(prev => [...prev, dest]);
        toast.success(`${dest.name.replace(/_/g, ' ')} added to favorites!`, {
          icon: '❤️',
        });
      }
    } catch (err) {
      toast.error('Failed to update favorites. Please try again.');
    }
  };

  /**
   * Function to handle fetching data from our backend API.
   * `useCallback` ensures this function isn't unnecessarily re-created on every render.
   */
  const fetchDestinationsData = useCallback(async (query: string = '') => {
    setIsLoading(true); // Turn on the loading spinner
    setError(null);     // Clear any previous errors
    
    try {
      // Create the endpoint URL. If there is a search query, attach it as '?search=value'
      const endpoint = query ? `/api/destinations?search=${encodeURIComponent(query)}` : '/api/destinations';
      
      const response = await fetch(endpoint);
      
      // If the backend returns an error status code (e.g. 404, 500), throw an error
      if (!response.ok) {
        throw new Error('Failed to fetch destinations from server');
      }
      
      // Parse the JSON response
      const data: Destination[] = await response.json();
      
      // Update our React state with the fetched data
      setDestinations(data);
    } catch (err: any) {
      console.error('Fetch Error:', err);
      // Give the user a friendly error message
      setError('Unable to load destinations. Please try again later.');
    } finally {
      // Finally block always runs, successfully fetched or not, turning off the loading spinner
      setIsLoading(false);
    }
  }, []);

  /**
   * The `useEffect` hook runs side-effects. 
   * With an empty dependency array `[]`, it runs exactly once when the component first mounts.
   */
  useEffect(() => {
    // Initial data fetch as soon as the page loads
    fetchDestinationsData();
  }, [fetchDestinationsData]);

  // If the user clears the input completely, automatically fetch the default random list.
  useEffect(() => {
    if (searchQuery === '' && !isLoading && destinations.length === 0) {
      fetchDestinationsData();
    }
  }, [searchQuery, fetchDestinationsData]);

  /**
   * Function triggered when a user submits the search form.
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from instantly refreshing the page on submit
    
    // Call the fetch function with the current text typed into the search bar
    fetchDestinationsData(searchQuery.trim());
  };

  /**
   * Helper function to cut long descriptions down to a clean size.
   */
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 1. Header & Search Section */}
      <div className="mb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-text-main tracking-tighter mb-6">
          World <span className="text-gradient">Wonders</span>
        </h1>
        <p className="text-lg text-text-muted font-medium max-w-2xl mx-auto mb-10">
          Explore curated famous destinations from across the globe based on crowdsourced encyclopedia knowledge.
        </p>

        {/* Form used for handling search submissions */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group flex gap-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-text-muted" />
            </div>
            {/* Controlled input connecting its value to state: searchQuery */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Auto-refresh when backspaced to empty
                if (e.target.value === '') fetchDestinationsData('');
              }}
              placeholder="Search famous places (e.g. Paris, Tokyo)..."
              className="w-full bg-card-bg/40 border border-surface-border rounded-3xl py-5 pl-14 pr-8 text-text-main font-bold placeholder:text-text-muted/50 focus:outline-none focus:border-brand-primary/50 transition-all backdrop-blur-xl"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="px-8 bg-brand-primary text-void rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap border-none"
          >
            Search
          </button>
        </form>
      </div>

      {/* 2. State Handling: Loading (Show spinner if we are fetching data) */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin mb-4" />
          <p className="text-text-muted font-medium animate-pulse">Consulting the archives...</p>
        </div>
      )}

      {/* 3. State Handling: Error (Show friendly message if backend failed) */}
      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-xl mx-auto">
          <h3 className="text-xl font-bold text-red-400 mb-2">Oops!</h3>
          <p className="text-red-300/80">{error}</p>
          <button 
            onClick={() => fetchDestinationsData()}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg font-bold text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 4. State Handling: No Results */}
      {!isLoading && !error && destinations.length === 0 && (
         <div className="text-center py-20">
            <p className="text-xl font-bold text-text-muted">
              {searchQuery ? `No famous places found matching "${searchQuery}"` : "No places found"}
            </p>
         </div>
      )}

      {/* 5. Main Component: Mapping the Destinations Array to UI Elements */}
      {!isLoading && !error && destinations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest, idx) => (
            // Every mapped element needs a unique React `key` prop!
            <div 
              key={`${dest.name}-${idx}`} 
              onClick={() => navigate('/', { state: { prefillDestination: dest.name.replace(/_/g, ' ') } })}
              className="group bg-card-bg rounded-[32px] overflow-hidden border border-surface-border hover:border-brand-primary/30 shadow-sm transition-all duration-300 hover:-translate-y-2 flex flex-col cursor-pointer"
            >
              {/* Card Image section */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={dest.image}
                  alt={`Wikipedia thumbnail of ${dest.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(dest);
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-void/40 backdrop-blur-md border border-surface-border/30 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/heart"
                >
                  <Heart 
                    className={`h-5 w-5 transition-colors ${
                      favorites.some(f => f.name === dest.name) 
                        ? 'fill-brand-secondary text-brand-secondary' 
                        : 'text-white/70 group-hover/heart:text-brand-secondary'
                    }`} 
                  />
                </button>
              </div>

              {/* Card Content section */}
              <div className="p-8 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-black text-text-main leading-tight">
                    {/* Convert underscores back to spaces for frontend display */}
                    {dest.name.replace(/_/g, ' ')}
                  </h3>
                </div>
                <p className="text-text-muted font-medium text-sm leading-relaxed mb-6 flex-grow">
                  {truncateText(dest.description, 130)}
                </p>

                {/* Call To Action section */}
                <div className="mt-auto pt-4 border-t border-surface-border/50 flex items-center justify-between">
                  <span className="text-sm font-bold text-text-muted group-hover:text-brand-primary transition-colors duration-300">
                    Plan this trip
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surface-border/30 flex items-center justify-center group-hover:bg-brand-primary transition-colors duration-300">
                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-[#020617] group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Destinations;
