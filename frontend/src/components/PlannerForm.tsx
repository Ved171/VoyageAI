import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { UserPreferences } from '../types';
import { INTEREST_TAGS } from '../constants';
import {
  Rocket,
  MapPin,
  Calendar,
  Plus,
  Minus,
  Sparkles,
  Globe,
  Compass,
  ArrowRight,
  Wallet,
  DollarSign,
  Gem,
  Plane,
  TrainFront,
  Bus,
  Car
} from 'lucide-react';

interface PlannerFormProps {
  onPlanTrip: (preferences: UserPreferences) => void;
  error: string | null;
  isLoading: boolean;
  externalInterests: string[];
  onInterestToggle: (interest: string) => void;
}

const PlannerForm: React.FC<PlannerFormProps> = ({
  onPlanTrip,
  error,
  isLoading,
  externalInterests,
  onInterestToggle
}) => {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [duration, setDuration] = useState<number | ''>(5);

  const [budget, setBudget] = useState<'budget' | 'moderate' | 'luxury'>('moderate');
  const [preferredTransport, setPreferredTransport] = useState<string>('');

  const location = useLocation();
  const originInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state?.prefillDestination) {
      setDestination(location.state.prefillDestination);
      // Ensure the UI has rendered, then focus the Departure Point (origin) input
      setTimeout(() => {
        originInputRef.current?.focus();
      }, 50);
    }
  }, [location.state]);

  const handleDuration = (change: number) => {
    setDuration(prev => {
      const current = typeof prev === 'number' ? prev : 1;
      const newValue = current + change;
      if (newValue >= 1) return newValue;
      return current;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const finalDuration = Number(duration);
    if (!destination.trim() || !origin.trim() || finalDuration < 1 || externalInterests.length === 0) {
      return;
    }
    onPlanTrip({
      origin,
      destination,
      duration: finalDuration,
      interests: externalInterests,
      budget,
      preferredTransport: preferredTransport || undefined
    });
  };

  const budgetOptions = [
    { id: 'budget', label: 'Budget', icon: <Wallet className="h-5 w-5" />, desc: 'Economical travel' },
    { id: 'moderate', label: 'Moderate', icon: <DollarSign className="h-5 w-5" />, desc: 'Balanced comfort' },
    { id: 'luxury', label: 'Luxury', icon: <Gem className="h-5 w-5" />, desc: 'Premium experience' },
  ];

  const transportOptions = [
    { id: 'flight', label: 'Flight', icon: <Plane className="h-4 w-4" /> },
    { id: 'train', label: 'Train', icon: <TrainFront className="h-4 w-4" /> },
    { id: 'bus', label: 'Bus', icon: <Bus className="h-4 w-4" /> },
    { id: 'car', label: 'Car', icon: <Car className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full animate-fadeInUp">
      <form onSubmit={handleSubmit} className="space-y-10">

        {/* Destination & Origin Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Origin */}
          <div className="glass-card p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Departure Point</p>
            </div>
            <input
              ref={originInputRef}
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="w-full bg-transparent border border-surface-border rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-3xl font-black text-text-main placeholder:text-text-muted/40 transition-all duration-500"
              placeholder="e.g. London, UK"
            />
          </div>

          {/* Destination */}
          <div className="glass-card p-6 group border-brand-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-brand-primary" />
              </div>
              <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Destination</p>
            </div>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full bg-transparent border border-surface-border rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-3xl font-black text-text-main placeholder:text-text-muted/40 transition-all duration-500"
              placeholder="e.g. Tokyo, Japan"
            />
          </div>
        </div>

        {/* Preferences & Style Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Detailed Preferences (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Travel Budget */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Travel Budget</p>
                  <p className="text-xs font-medium text-text-muted opacity-80 transition-all duration-500">Choose your spending level</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBudget(opt.id as any)}
                    className={`relative p-5 rounded-2xl border text-left transition-all duration-300 group ${
                      budget === opt.id 
                        ? 'bg-brand-primary/10 border-brand-primary shadow-lg shadow-brand-primary/10' 
                        : 'glass-panel border-surface-border hover:border-brand-primary/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      budget === opt.id ? 'bg-brand-primary text-void' : 'bg-surface-border text-text-muted'
                    }`}>
                      {opt.icon}
                    </div>
                    <p className={`font-black text-base ${budget === opt.id ? 'text-brand-primary' : 'text-text-main'}`}>{opt.label}</p>
                    <p className="text-[10px] text-text-muted mt-1 leading-tight">{opt.desc}</p>
                    {budget === opt.id && (
                      <div className="absolute top-4 right-4 animate-pulse">
                        <Sparkles className="h-4 w-4 text-brand-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests Cloud */}
            <div className="glass-card p-8 flex-grow">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Compass className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Interests</p>
                    <p className="text-xs font-medium text-text-muted opacity-80 transition-all duration-500">Customize your itinerary</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  {externalInterests.length} Selected
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {INTEREST_TAGS.map(tag => {
                  const isActive = externalInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onInterestToggle(tag)}
                      className={`group relative flex items-center gap-3 px-7 py-4 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-brand-primary text-[#020617] font-black scale-105 shadow-xl shadow-brand-primary/20' 
                          : 'glass-panel text-text-main hover:border-brand-primary/30 hover:scale-105'
                      }`}
                    >
                      {isActive && <Sparkles className="h-4 w-4 animate-pulse" />}
                      <span className="text-sm font-bold tracking-tight">{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats (1/3 width) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Duration Card */}
            <div className="glass-card p-8 flex flex-col justify-between h-fit">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Trip Duration</p>
                </div>
                
                <div className="flex items-center justify-center gap-8 py-4">
                  <button 
                    type="button" 
                    onClick={() => handleDuration(-1)}
                    className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-text-main border-surface-border hover:bg-brand-primary/10 transition-all active:scale-90"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <div className="text-center">
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1) {
                          setDuration(val);
                        } else if (e.target.value === '') {
                          setDuration('');
                        }
                      }}
                      onBlur={() => {
                        if (duration === '' || Number(duration) < 1) setDuration(1);
                      }}
                      className="w-32 bg-transparent text-6xl font-black text-text-main text-center outline-none transition-colors duration-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest transition-colors duration-500 -mt-1">Days</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleDuration(1)}
                    className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-text-main border-surface-border hover:bg-brand-primary/10 transition-all active:scale-90"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                {[3, 5, 7, 14].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${
                      duration === d 
                        ? 'bg-brand-primary border-brand-primary text-void shadow-lg shadow-brand-primary/30 scale-105' 
                        : 'glass-panel border-surface-border text-text-muted hover:border-brand-primary/30 hover:bg-brand-primary/5'
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

            {/* Transport Picker */}
            <div className="glass-card p-6 flex-grow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Transport</p>
                  <p className="text-xs font-medium text-text-muted opacity-80 transition-all duration-500">Mode Preference</p>
                </div>
              </div>

              <div className="space-y-2 flex-grow">
                {transportOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredTransport(preferredTransport === opt.id ? '' : opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      preferredTransport === opt.id 
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                        : 'glass-panel border-surface-border hover:border-blue-500/30 text-text-main'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {opt.icon}
                      <span className="text-sm font-bold uppercase tracking-widest">{opt.label}</span>
                    </div>
                    {preferredTransport === opt.id && <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />}
                  </button>
                ))}
              </div>
              
              <div className="mt-auto pt-6 border-t border-surface-border/30">
                <p className="text-[10px] text-text-muted italic leading-relaxed text-center px-4">
                  * If unselected, AI optimizes based on distance.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Submit Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
          <div className="hidden md:flex items-center gap-4 text-text-muted font-medium text-sm transition-colors duration-500">
            <div className="w-12 h-12 rounded-full border border-surface-border flex items-center justify-center italic text-xs">AI</div>
            <p className="max-w-xs transition-colors duration-500">Our AI engine will create a personalized day-by-day travel plan for you.</p>
          </div>

          <button
            type="submit"
            disabled={isLoading || externalInterests.length === 0 || !origin.trim() || !destination.trim()}
            className="btn-primary flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                <span>Planning...</span>
              </div>
            ) : (
              <>
                <span className="text-xl">Plan My Trip</span>
                <Rocket className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(PlannerForm);