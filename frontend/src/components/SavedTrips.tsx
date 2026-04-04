import React, { useState, useEffect } from 'react';
import { Itinerary } from '../types';
import { Map as MapIcon, ChevronRight, Bookmark, ArrowLeft, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavedTripsProps {
  savedTrips: Itinerary[];
  onLoadTrip: (trip: Itinerary) => void;
  onDeleteTrip: (tripId: string) => void;
  isLoading?: boolean;
}

const TripCard: React.FC<{ 
  trip: Itinerary, 
  onClick: () => void, 
  onDelete: (e: React.MouseEvent) => void 
}> = ({ trip, onClick, onDelete }) => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Extract city name (e.g. "Paris, France" -> "Paris") and format for Wikipedia
        const place = trip.destination.split(',')[0].trim().replace(/\s+/g, '_');
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${place}`);
        const data = await res.json();
        
        if (data.thumbnail?.source) {
          setImage(data.thumbnail.source);
        } else {
          // Fallback placeholder image
          setImage('https://images.unsplash.com/photo-1488646953014-ce89ceb18db8?auto=format&fit=crop&q=80&w=800');
        }
      } catch (e) {
        setImage('https://images.unsplash.com/photo-1488646953014-ce89ceb18db8?auto=format&fit=crop&q=80&w=800');
      }
    };
    fetchImage();
  }, [trip.destination]);

  return (
    <div 
      onClick={onClick}
      className="glass-card cursor-pointer group border-surface-border hover:border-brand-primary/30 transition-all duration-500 flex flex-col h-full overflow-hidden"
    >
      {/* Dynamic Header Image */}
      <div className="relative h-48 w-full overflow-hidden shrink-0 border-b border-surface-border">
        {image ? (
          <img src={image} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full animate-pulse bg-brand-primary/5" />
        )}
        
        {trip.memberRole === 'member' && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-brand-secondary/30 text-xs font-bold text-brand-secondary">
            <Users className="w-3.5 h-3.5" />
            <span>Shared</span>
          </div>
        )}

        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:bg-brand-primary/90 transition-all duration-500">
          <ChevronRight className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        <h4 className="text-2xl font-black text-text-main truncate mb-2 transition-colors duration-500">
          {trip.destination}
        </h4>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest transition-colors duration-500">
            {trip.duration} Day Expedition
          </p>
          
          {trip.memberRole === 'owner' && (
            <button
              onClick={onDelete}
              className="p-2 -mr-2 text-text-muted hover:text-red-500 transition-colors"
              title="Delete Expedition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mb-8" />
        
        <div className="mt-auto pt-6 border-t border-surface-border/50 flex flex-wrap gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
          {(trip.packingList || []).slice(0, 3).map((item, i) => (
            <span 
              key={i} 
              className="px-2.5 py-1.5 rounded-lg bg-surface-border/30 text-[10px] font-black uppercase text-text-muted transition-colors"
            >
              {item}
            </span>
          ))}
          {(trip.packingList?.length || 0) > 3 && (
            <span className="text-[10px] font-black text-text-muted opacity-40 self-center pl-1">+{(trip.packingList?.length || 0) - 3} Items</span>
          )}
        </div>
      </div>
    </div>
  );
};

const SavedTrips: React.FC<SavedTripsProps> = ({ savedTrips, onLoadTrip, onDeleteTrip, isLoading }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared'>('all');

  const filteredTrips = savedTrips.filter(trip => {
    if (filter === 'owned') return trip.memberRole === 'owner';
    if (filter === 'shared') return trip.memberRole === 'member';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6 animate-fadeInUp">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-text-muted hover:text-brand-primary transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-text-main tracking-tight uppercase transition-colors duration-500">My Trip <span className="text-gradient">Library</span></h2>
          <p className="text-[10px] md:text-xs lg:text-sm font-bold text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Your collection of planned adventures</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card bg-brand-primary/5 animate-fadeIn">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
            <MapIcon className="h-10 w-10 text-brand-primary animate-pulse" />
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] animate-pulse">Syncing Mission History...</p>
        </div>
      ) : (
        <>
          {savedTrips.length > 0 && (
            <div className="flex flex-wrap gap-3 md:gap-4 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-brand-primary text-black' : 'bg-surface-panel text-text-muted hover:text-text-main'}`}
              >
                All Trips
              </button>
              <button
                onClick={() => setFilter('owned')}
                className={`px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${filter === 'owned' ? 'bg-brand-primary text-black' : 'bg-surface-panel text-text-muted hover:text-text-main'}`}
              >
                Created By Me
              </button>
              <button
                onClick={() => setFilter('shared')}
                className={`px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${filter === 'shared' ? 'bg-brand-primary text-black' : 'bg-surface-panel text-text-muted hover:text-text-main'}`}
              >
                Shared With Me
              </button>
            </div>
          )}

          {filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 grow">
              {filteredTrips.map((trip, idx) => (
                <TripCard 
                  key={trip._id || idx} 
                  trip={trip} 
                  onClick={() => onLoadTrip(trip)} 
                  onDelete={(e) => {
                    e.stopPropagation();
                    if (trip._id) onDeleteTrip(trip._id);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 md:py-40 glass-card">
              <Bookmark className="h-16 w-16 text-text-muted opacity-20 mb-6" />
              <p className="text-xl font-bold text-text-muted transition-colors duration-500">No saved trips found.</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-8 text-xs font-black text-brand-primary uppercase tracking-[0.4em] hover:opacity-70 transition-opacity"
              >
                Plan Your First Trip
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SavedTrips;
