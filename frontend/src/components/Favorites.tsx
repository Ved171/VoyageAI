import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, ArrowRight, Compass, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface Destination {
  name: string;
  description: string;
  image: string;
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const data = await apiService.getFavorites();
        setFavorites(data);
      } catch (e) {
        console.error("Failed to fetch favorites", e);
        toast.error("Failed to load favorites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, navigate]);

  const toggleFavorite = async (dest: Destination) => {
    try {
      await apiService.removeFavorite(dest.name);
      setFavorites(prev => prev.filter(f => f.name !== dest.name));
      toast.success(`${dest.name.replace(/_/g, ' ')} removed from favorites`);
    } catch (e) {
      toast.error("Failed to remove favorite");
    }
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-16 text-center animate-fadeInUp">
        <h1 className="text-5xl md:text-7xl font-black text-text-main tracking-tighter mb-6">
          Your <span className="text-gradient">Favorites</span>
        </h1>
        <p className="text-lg text-text-muted font-medium max-w-2xl mx-auto">
          Destinations that captured your heart. Quick access to plan your dream trips.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card bg-brand-primary/5 border-dashed border-2 animate-fadeInUp">
          <div className="w-20 h-20 bg-brand-secondary/10 rounded-full flex items-center justify-center mb-6">
            <Heart className="h-10 w-10 text-brand-secondary opacity-30" />
          </div>
          <h3 className="text-2xl font-black text-text-main mb-2">No Favorites Yet</h3>
          <p className="text-text-muted font-medium mb-8">Start exploring the world and save the places you love.</p>
          <button 
            onClick={() => navigate('/destinations')}
            className="btn-primary"
          >
            Explore Destinations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeInUp">
          {favorites.map((dest, idx) => (
            <div 
              key={`${dest.name}-${idx}`} 
              className="group bg-card-bg rounded-[32px] overflow-hidden border border-surface-border hover:border-brand-primary/30 shadow-sm transition-all duration-300 hover:-translate-y-2 flex flex-col relative animate-fadeInUp"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Favorited Heart Overlay */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(dest);
                }}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-2xl bg-void/60 backdrop-blur-md border border-brand-secondary/30 flex items-center justify-center text-brand-secondary group/heart hover:bg-brand-secondary/10 transition-all active:scale-90"
                title="Remove from favorites"
              >
                <Heart className="h-6 w-6 fill-current text-brand-secondary" />
              </button>

              <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => navigate('/', { state: { prefillDestination: dest.name.replace(/_/g, ' ') } })}>
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void/60 to-transparent group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-8 flex-grow flex flex-col cursor-pointer" onClick={() => navigate('/', { state: { prefillDestination: dest.name.replace(/_/g, ' ') } })}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-black text-text-main leading-tight">
                    {dest.name.replace(/_/g, ' ')}
                  </h3>
                </div>
                <p className="text-text-muted font-medium text-sm leading-relaxed mb-6 flex-grow">
                  {truncateText(dest.description, 130)}
                </p>

                <div className="mt-auto pt-4 border-t border-surface-border/50 flex items-center justify-between pointer-events-none">
                  <span className="text-sm font-bold text-text-muted group-hover:text-brand-primary transition-colors duration-300">
                    Plan this trip
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surface-border/30 flex items-center justify-center group-hover:bg-brand-primary transition-colors duration-300">
                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-void group-hover:translate-x-0.5 transition-all duration-300" />
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

export default Favorites;
