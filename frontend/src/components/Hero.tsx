import React from 'react';
import { Itinerary } from '../types';

interface HeroProps {
  // Props kept for compatibility if needed, though they aren't used for rendering anymore
  savedTrips?: Itinerary[]; 
  onLoadTrip?: (trip: Itinerary) => void;
}

const Hero: React.FC<HeroProps> = () => {
  return (
    <div className="mb-20 animate-fadeInUp">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12">
        <div className="max-w-2xl">
          <p className="text-sm font-black text-brand-primary uppercase tracking-[0.4em] mb-4 transition-colors duration-500">AI-Powered Trip Planner</p>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-text-main tracking-tighter leading-[0.85] mb-6 transition-colors duration-500">
            ARCHITECT YOUR <span className="text-gradient">ADVENTURE.</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted font-medium leading-relaxed transition-colors duration-500">
            Welcome back! Plan a new adventure with our AI-powered travel planner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;