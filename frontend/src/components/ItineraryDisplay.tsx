import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Itinerary } from '../types';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Map as MapIcon,
  Calendar,
  Wind,
  Navigation,
  Globe,
  Share2,
  Download,
  CheckCircle2,
  Plane,
  Camera,
  Utensils,
  Moon,
  Compass,
  Rocket,
  Maximize2,
  X,
  Wallet,
  Receipt,
  Layout,
  MessageSquare
} from 'lucide-react';
import MapView from './MapView';
import TravelCostCard from './TravelCostCard';
import { TripExpenses } from './expenses/TripExpenses';
import { TripChat } from './chat/TripChat';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

import { ShareModal } from './ShareModal';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

interface ItineraryDisplayProps {
  itinerary: Partial<Itinerary> | null;
  onCreateNewTrip: () => void;
  isLoading?: boolean;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary: initialItinerary, onCreateNewTrip, isLoading = false }) => {
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isMapFull, setIsMapFull] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ time: '10:00 AM', location: '', description: '' });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'chat'>('itinerary');
  const [members, setMembers] = useState<any[]>([]);
  const { user } = useAuth();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

  // Update local state if initial props change
  useEffect(() => {
    setItinerary(initialItinerary);
  }, [initialItinerary]);

  // Load members if we're on the expenses tab or if it's the owner
  useEffect(() => {
    if (itinerary?._id) {
      apiService.getTripMembers(itinerary._id).then(setMembers).catch(console.error);
    }
  }, [itinerary?._id]);

  // Handle ESC key to close map
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMapFull(false);
    };
    if (isMapFull) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMapFull]);
  const location = useLocation();
  const isFromLibrary = location.pathname === '/saved-trips';

  const handleLeaveTripRequest = () => {
    setIsLeaveConfirmOpen(true);
  };

  const handleConfirmLeave = async () => {
    if (!itinerary?._id) return;
    try {
      await apiService.leaveTrip(itinerary._id);
      toast.success('You have left the trip');
      onCreateNewTrip(); // Redirect to home/planner
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave trip');
    } finally {
      setIsLeaveConfirmOpen(false);
    }
  };

  const handleDeleteActivity = async (dayIdx: number, activityIdx: number) => {
    if (!itinerary?._id) return;

    // Optimistic Update
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
    newItinerary.dailyPlans[dayIdx].activities.splice(activityIdx, 1);

    setItinerary(newItinerary);

    try {
      await apiService.updateItinerary(itinerary._id, newItinerary);
      toast.success('Activity removed');
    } catch (e: any) {
      toast.error('Failed to sync changes');
      setItinerary(itinerary); // Rollback
    }
  };

  const handleAddActivity = async (dayIdx: number) => {
    if (!itinerary?._id) return;
    if (!newEvent.location || !newEvent.description) {
      toast.error('Location and description are required');
      return;
    }

    // Optimistic Update
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
    if (!newItinerary.dailyPlans[dayIdx].activities) {
      newItinerary.dailyPlans[dayIdx].activities = [];
    }
    newItinerary.dailyPlans[dayIdx].activities.push({ ...newEvent });

    setItinerary(newItinerary);
    setIsAddingEvent(false);
    setNewEvent({ time: '10:00 AM', location: '', description: '' });

    try {
      await apiService.updateItinerary(itinerary._id, newItinerary);
      toast.success('Activity added');
    } catch (e: any) {
      toast.error('Failed to sync changes');
      setItinerary(itinerary); // Rollback
    }
  };

  const handleDownloadPdf = () => {
    if (!itinerary) return;
    setIsGeneratingPdf(true);
    toast.loading('Compiling Trip Data...', { id: 'pdf' });

    // Slight timeout allows React to render the loading spinner before the main thread locks
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });

        let y = 20;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - margin * 2;

        const addText = (text: string, size: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
          doc.setFont("helvetica", isBold ? "bold" : "normal");
          doc.setFontSize(size);
          doc.setTextColor(color[0], color[1], color[2]);
          const lines = doc.splitTextToSize(text, maxWidth);
          lines.forEach((line: string) => {
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, margin, y);
            y += size * 0.4; // Dynamic line height
          });
          y += 2; // Extra padding
        };

        // Title Section
        addText(`VOYAGE AI: TRAVEL ITINERARY`, 10, true, [150, 150, 150]);
        y += 5;
        addText(`TRIP TO ${itinerary.destination?.toUpperCase()}`, 24, true, [20, 20, 20]);
        y += 2;
        addText(`Duration: ${itinerary.duration} Days`, 12, false, [100, 100, 100]);
        if (itinerary.travelCost?.estimatedCost) {
          addText(`Estimated Total Cost: ${itinerary.travelCost.estimatedCost}`, 12, true, [255, 111, 75]);
        }

        y += 10;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Transport Logistics
        if (itinerary.departureInfo && itinerary.returnInfo) {
          addText(`TRAVEL LOGISTICS`, 14, true, [40, 40, 40]);
          y += 2;
          addText(`Outbound: ${itinerary.departureInfo.mode} at ${itinerary.departureInfo.time}`, 11, true, [255, 111, 75]);
          addText(`Location: ${itinerary.departureInfo.location}`, 10, false, [100, 100, 100]);
          y += 2;
          addText(`Return: ${itinerary.returnInfo.mode} at ${itinerary.returnInfo.time}`, 11, true, [0, 184, 148]);
          addText(`Location: ${itinerary.returnInfo.location}`, 10, false, [100, 100, 100]);
          y += 6;
          doc.line(margin, y, pageWidth - margin, y);
          y += 10;
        }

        // Daily Plans
        itinerary.dailyPlans?.forEach((day, idx) => {
          if (y > 250) { doc.addPage(); y = 20; }

          addText(`DAY ${idx + 1}: ${day.title || 'Scheduled Activities'}`, 14, true, [40, 40, 40]);
          y += 2;

          day.activities?.forEach(act => {
            if (y > 270) { doc.addPage(); y = 20; }
            addText(`${act.time} - ${act.location}`, 11, true, [60, 60, 60]);
            addText(act.description, 10, false, [100, 100, 100]);
            y += 4;
          });
          y += 4;
        });

        // Cost Breakdown
        if (itinerary.travelCost) {
          if (y > 230) {
            doc.addPage();
            y = 20;
          } else {
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;
          }
          addText(`EXPENSE BREAKDOWN`, 14, true, [40, 40, 40]);
          y += 4;
          const cost = itinerary.travelCost;
          if (cost.flight) addText(`Flight & Transport: ${cost.flight}`, 11, false, [80, 80, 80]);
          if (cost.hotel) addText(`Accommodation: ${cost.hotel}`, 11, false, [80, 80, 80]);
          if (cost.food) addText(`Food & Dining: ${cost.food}`, 11, false, [80, 80, 80]);
          if (cost.activity) addText(`Activities/Entries: ${cost.activity}`, 11, false, [80, 80, 80]);
          y += 2;
          if (cost.estimatedCost) addText(`TOTAL ESTIMATE: ${cost.estimatedCost}`, 12, true, [20, 20, 20]);
        }

        doc.save(`VoyageAI_${itinerary.destination?.replace(/\s+/g, '_')}_Itinerary.pdf`);
        toast.success('Document downloaded successfully!', { id: 'pdf' });
      } catch (e) {
        console.error(e);
        toast.error('Failed to generate document.', { id: 'pdf' });
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  // ⚠️ ALL hooks must be called BEFORE any early return (Rules of Hooks)
  const totalActivities = useMemo(() => {
    return (itinerary?.dailyPlans || []).reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  }, [itinerary]);

  const selectedDay = itinerary?.dailyPlans?.[selectedDayIndex];

  const mapDestinations = useMemo(() => {
    if (!itinerary) return [];
    const base = [{
      location: itinerary.destination || '',
      day: 1,
      type: 'arrival',
      latitude: itinerary.latitude,
      longitude: itinerary.longitude
    }];
    const activities = (selectedDay?.activities || []).map(a => ({
      location: a.location,
      day: selectedDayIndex + 1,
      type: 'waypoint',
      latitude: a.latitude,
      longitude: a.longitude
    }));
    return [...base, ...activities];
  }, [itinerary, selectedDay, selectedDayIndex]);

  // Show loading skeleton while AI is generating (NOT the error screen)
  if (!itinerary?.dailyPlans || itinerary.dailyPlans.length === 0) {
    if (isLoading) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-20 glass-card transition-colors duration-500 border-surface-border">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8 border border-brand-primary/20 shadow-2xl shadow-brand-primary/10 animate-pulse">
            <Rocket className="h-10 w-10 text-brand-primary" />
          </div>
          <h2 className="text-3xl font-black text-text-main mb-4 uppercase tracking-tighter transition-colors duration-500">Planning Your Trip</h2>
          <p className="text-text-muted font-medium text-center max-w-md mb-10 leading-relaxed transition-colors duration-500">
            {itinerary?.destination
              ? `Crafting your perfect itinerary for ${itinerary.destination}...`
              : 'Our AI is crafting your personalized itinerary...'}
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="w-full flex flex-col items-center justify-center p-20 glass-card transition-colors duration-500 border-surface-border">
        <div className="w-20 h-20 bg-brand-secondary/10 rounded-3xl flex items-center justify-center mb-8 border border-brand-secondary/20 shadow-2xl shadow-brand-secondary/10">
          <Rocket className="h-10 w-10 text-brand-secondary animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-text-main mb-4 uppercase tracking-tighter transition-colors duration-500">Itinerary Incomplete</h2>
        <p className="text-text-muted font-medium text-center max-w-md mb-10 leading-relaxed transition-colors duration-500">
          Something went wrong while generating your itinerary. Please try again with different settings.
        </p>
        <button
          onClick={onCreateNewTrip}
          className="btn-secondary px-12 py-5 border-surface-border flex items-center gap-3 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform" />
          {isFromLibrary ? 'Back to Library' : 'Back to Planner'}
        </button>
      </div>
    );
  }

  // totalActivities is now computed above (before early return)

  const getActivityIcon = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('eat') || d.includes('dinner') || d.includes('lunch') || d.includes('food')) return <Utensils className="h-4 w-4" />;
    if (d.includes('flight') || d.includes('airport')) return <Plane className="h-4 w-4" />;
    if (d.includes('photo') || d.includes('view') || d.includes('sight')) return <Camera className="h-4 w-4" />;
    if (d.includes('sleep') || d.includes('hotel') || d.includes('accommodation')) return <Moon className="h-4 w-4" />;
    return <Compass className="h-4 w-4" />;
  };

  return (
    <>
      <div className="w-full pb-20 animate-fadeInUp">

        {/* Expedition Overview Header */}
        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 md:gap-10 mb-10 md:mb-16">
          <div className="max-w-3xl">
            <button
              onClick={onCreateNewTrip}
              className="group flex items-center gap-3 text-text-muted hover:text-text-main transition-colors mb-8 font-black uppercase tracking-[0.3em] text-[10px]"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              {isFromLibrary ? 'Back to Library' : 'Back to Planner'}
            </button>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest border border-brand-primary/20">
                Trip: {itinerary.destination.toUpperCase()}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-brand-tertiary/10 text-brand-tertiary text-[10px] font-black uppercase tracking-widest border border-brand-tertiary/20">
                Plan Complete ✓
              </span>
            </div>

            <div ref={itineraryRef}>
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-text-main tracking-tighter leading-[0.85] mb-6 md:mb-8 transition-colors duration-500">
                TRIP TO <span className="text-gradient">{itinerary.destination?.toUpperCase()}</span>
              </h1>

              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 transition-colors duration-500">Duration</p>
                    <p className="text-base md:text-lg font-black text-text-main leading-none transition-colors duration-500">{itinerary.duration} Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 transition-colors duration-500">Activities</p>
                    <p className="text-base md:text-lg font-black text-text-main leading-none transition-colors duration-500">{totalActivities} Locations</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center">
                    <Globe className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 transition-colors duration-500">Region</p>
                    <p className="text-lg font-black text-text-main leading-none transition-colors duration-500">{itinerary.localization?.targetLanguage || 'Global'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center">
                    <Wallet className="h-5 w-5 md:h-6 md:w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 transition-colors duration-500">Est. Cost</p>
                    <p className="text-base md:text-lg font-black text-text-main leading-none transition-colors duration-500">{itinerary.travelCost?.estimatedCost || 'Calculating...'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            {(itinerary.memberRole === 'owner' || itinerary.memberRole === 'member') && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                title={itinerary.memberRole === 'owner' ? "Add Members" : "View Members"}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-3 glass-panel px-6 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border-white/5 hover:bg-brand-primary/5 transition-all active:scale-95 group"
              >
                <Share2 className="h-4 w-4 group-hover:rotate-12 transition-transform opacity-70 group-hover:opacity-100 group-hover:text-brand-primary" />
                {itinerary.memberRole === 'owner' ? "Add Members" : "View Members"}
              </button>
            )}

            {itinerary.memberRole === 'member' && (
              <button
                onClick={handleLeaveTripRequest}
                disabled={isLeaving}
                title="Leave Expedition"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-3 glass-panel px-6 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 text-red-400 transition-all active:scale-95 group disabled:opacity-50"
              >
                <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                {isLeaving ? 'Leaving...' : 'Leave'}
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Download PDF Itinerary"
              className="flex-1 sm:flex-initial btn-primary flex items-center justify-center gap-3 shadow-brand-primary/20 hover:shadow-brand-primary/40 disabled:opacity-50 px-6 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] md:text-xs"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-[#020617] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGeneratingPdf ? '...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Mission Logistics Section */}
        {itinerary.departureInfo && itinerary.returnInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            {/* Departure Leg */}
            <div className="glass-card p-6 md:p-8 flex items-center gap-6 relative overflow-hidden group border-brand-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-brand-primary/10">
                <Plane className="h-6 w-6 md:h-8 md:w-8 text-brand-primary rotate-45" />
              </div>
              <div className="flex-grow">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-2">Outbound Journey</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-lg md:text-xl font-black text-text-main truncate">{itinerary.departureInfo.mode}</h3>
                  <span className="text-xs md:text-sm font-black text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">{itinerary.departureInfo.time}</span>
                </div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  Departure: {itinerary.departureInfo.location}
                </p>
              </div>
            </div>

            {/* Return Leg */}
            <div className="glass-card p-6 md:p-8 flex items-center gap-6 relative overflow-hidden group border-brand-secondary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary" />
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-brand-secondary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-brand-secondary/10">
                <Plane className="h-6 w-6 md:h-8 md:w-8 text-brand-secondary -rotate-45" />
              </div>
              <div className="flex-grow">
                <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-2">Return Journey</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-lg md:text-xl font-black text-text-main truncate">{itinerary.returnInfo.mode}</h3>
                  <span className="text-xs md:text-sm font-black text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-lg border border-brand-secondary/20">{itinerary.returnInfo.time}</span>
                </div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                  Terminal: {itinerary.returnInfo.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Sub-Navigation — grid on narrow screens so all tabs (including Channel) stay visible; long labels were pushed off-screen with overflow-x scroll */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-10 border-b border-surface-border/50 pb-8 w-full min-w-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Itinerary Tab */}
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 active:scale-95 border min-w-0 relative z-10 ${
              activeTab === 'itinerary' 
                ? 'bg-brand-primary text-black border-brand-primary shadow-lg shadow-brand-primary/20' 
                : 'text-text-muted hover:text-brand-primary border-brand-primary/20 hover:border-brand-primary/40 bg-brand-primary/5 hover:bg-brand-primary/10'
            }`}
          >
            <Layout className={`h-4 w-4 shrink-0 ${activeTab === 'itinerary' ? '' : 'opacity-70'}`} />
            <span className="text-center leading-tight">Itinerary</span>
          </button>

          {/* Expenses Tab (Financial Ledger) */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 active:scale-95 border min-w-0 relative z-10 ${
              activeTab === 'expenses' 
                ? 'bg-brand-tertiary text-white border-brand-tertiary shadow-lg shadow-brand-tertiary/20' 
                : 'text-brand-tertiary border-brand-tertiary/20 hover:border-brand-tertiary/40 bg-brand-tertiary/5 hover:bg-brand-tertiary/10'
            }`}
          >
            <Receipt className={`h-4 w-4 shrink-0 ${activeTab === 'expenses' ? '' : 'opacity-80'}`} />
            <span className="text-center leading-tight">
              <span className="md:hidden">Ledger</span>
              <span className="hidden md:inline">Financial Ledger</span>
            </span>
          </button>

          {/* Chat Tab */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 active:scale-95 border min-w-0 relative z-10 ${
              activeTab === 'chat' 
                ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                : 'text-blue-500 border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10'
            }`}
          >
            <MessageSquare className={`h-4 w-4 shrink-0 ${activeTab === 'chat' ? '' : 'opacity-80'}`} />
            <span className="text-center leading-tight">Trip Chat</span>
          </button>
        </div>

        {activeTab === 'itinerary' ? (
          <>
            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

              {/* Left Column: Mission Log Selectors */}
              <div className="lg:col-span-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {Array.from({ length: itinerary.duration || 0 }).map((_, idx) => {
                  const hasPlan = !!itinerary.dailyPlans?.[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => hasPlan && setSelectedDayIndex(idx)}
                      disabled={!hasPlan}
                      className={`flex-shrink-0 w-16 h-16 lg:w-full lg:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border relative overflow-hidden ${selectedDayIndex === idx
                        ? 'bg-brand-primary text-[#020617] font-black border-brand-primary shadow-lg shadow-brand-primary/20'
                        : hasPlan
                          ? 'glass-panel text-text-muted border-white/5 hover:border-white/20'
                          : 'glass-panel text-text-muted/30 border-white/5 opacity-50 cursor-not-allowed'
                        }`}
                    >
                      <span className="text-[10px] uppercase font-black leading-none opacity-60">Day</span>
                      <span className="text-2xl font-black leading-none">{idx + 1}</span>
                      {!hasPlan && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Center Column: Detailed Activities */}
              <div className="lg:col-span-7 space-y-8">
                <div className="glass-card p-6 md:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-primary/10 transition-colors" />

                  <div className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 md:mb-12">
                      <div>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-3 transition-colors duration-500">Day {selectedDayIndex + 1} Details</p>
                        <h2 className="text-2xl md:text-4xl font-black text-text-main leading-tight transition-colors duration-500">
                          {selectedDay?.title || `Operations in ${itinerary.destination}`}
                        </h2>
                      </div>
                      <div className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl glass-panel border-white/5">
                        <Navigation className="h-4 w-4 text-brand-tertiary" />
                        <span className="text-xs font-black text-text-main">{selectedDay?.activities?.length || 0} Stops</span>
                      </div>
                    </div>

                    <div className="space-y-12 relative">
                      {!selectedDay ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-pulse">
                          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                            <Compass className="h-8 w-8 text-brand-primary animate-spin" />
                          </div>
                          <p className="text-xs font-black text-text-muted uppercase tracking-[0.3em]">Analyzing Day {selectedDayIndex + 1}...</p>
                        </div>
                      ) : (
                        selectedDay.activities?.map((activity, idx) => (
                          <div key={idx} className="relative pl-12 group/item animate-fadeInUp" style={{ animationDelay: `${idx * 100}ms` }}>
                            {/* Time Line */}
                            {idx < selectedDay.activities.length - 1 && (
                              <div className="absolute left-[20px] top-10 bottom-[-40px] w-0.5 bg-gradient-to-b from-brand-primary/30 to-transparent" />
                            )}

                            {/* Activity Indicator */}
                            <div className="absolute left-0 top-0 w-10 h-10 rounded-2xl glass-panel group-hover/item:bg-brand-primary group-hover/item:text-void flex items-center justify-center transition-all duration-500 border-white/10 group-hover/item:scale-110 shadow-lg group-hover/item:shadow-brand-primary/50">
                              {getActivityIcon(activity.description)}
                            </div>

                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none transition-colors duration-500">{activity.time}</span>
                                <div className="h-[1px] w-8 bg-surface-border" />
                                <span className="text-[10px] font-black text-brand-tertiary uppercase tracking-widest leading-none">Planned Stop</span>
                              </div>
                              <h3 className="text-xl font-bold text-text-main mb-3 flex items-center gap-3 group-hover/item:text-brand-primary transition-colors">
                                {activity.location}
                                <ArrowLeft className="h-4 w-4 rotate-180 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                              </h3>
                              <p className="text-text-muted text-sm font-medium leading-relaxed max-w-xl transition-colors duration-500">
                                {activity.description}
                              </p>

                              {/* Delete Activity Button for Collaborators */}
                              {itinerary?._id && (itinerary.memberRole === 'owner' || itinerary.memberRole === 'member') && (
                                <button
                                  onClick={() => handleDeleteActivity(selectedDayIndex, idx)}
                                  className="absolute right-0 top-10 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Remove stop"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {/* Inline Add Event Form */}
                      {itinerary?._id && selectedDay && (itinerary.memberRole === 'owner' || itinerary.memberRole === 'member') && (
                        <div className="pt-8 border-t border-white/5">
                          {isAddingEvent ? (
                            <div className="glass-panel p-6 rounded-2xl border border-brand-primary/20 space-y-4 animate-fadeIn">
                              <div className="grid grid-cols-2 gap-4">
                                <input
                                  type="text"
                                  placeholder="Time (e.g., 2:00 PM)"
                                  value={newEvent.time}
                                  onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                                <input
                                  type="text"
                                  placeholder="Location/Title"
                                  value={newEvent.location}
                                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                              </div>
                              <textarea
                                placeholder="Description of the activity..."
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[80px]"
                              />
                              <div className="flex gap-3 justify-end mt-2">
                                <button
                                  onClick={() => setIsAddingEvent(false)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddActivity(selectedDayIndex)}
                                  className="btn-primary py-2 px-6 shadow-brand-primary/20"
                                >
                                  Save Event
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsAddingEvent(true)}
                              className="w-full py-4 glass-panel border border-brand-primary/20 rounded-2xl text-brand-primary text-sm font-black uppercase tracking-widest hover:bg-brand-primary hover:text-[#020617] transition-all shadow-lg hover:shadow-brand-primary/30"
                            >
                              + Add Custom Event
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Planetary Trajectory (Map Card) */}
              <div className="lg:col-span-4 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] space-y-8 pb-8">
                <div className="glass-card p-8 group h-full flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <MapIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Trip Map</h3>
                        <p className="text-[10px] font-bold text-text-muted opacity-60 transition-colors duration-500">Your Route & Stops</p>
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-brand-tertiary animate-pulse shadow-[0_0_12px_#9bffce]" />
                  </div>

                  <div className="flex-grow rounded-3xl overflow-hidden glass-panel border-white/10 relative cursor-zoom-in group/map">
                    <div
                      className="absolute inset-0 z-[399] bg-transparent"
                      onClick={() => setIsMapFull(true)}
                    />
                    <MapView destinations={mapDestinations} />

                    {/* Maximize Button Overlay */}
                    <button
                      onClick={() => setIsMapFull(true)}
                      title="View Fullscreen Map"
                      className="absolute top-4 right-4 z-[400] w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-text-main opacity-0 group-hover/map:opacity-100 transition-opacity border-white/10"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>

                    {/* Map Overlay HUD */}
                    <div className="absolute bottom-6 left-6 right-6 p-4 glass-panel border-white/10 rounded-xl z-[400] flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-primary" />
                        <span className="text-[10px] font-black text-text-main uppercase tracking-tighter transition-colors duration-500">Viewing {itinerary.destination}</span>
                      </div>
                      <span className="text-[9px] font-black text-text-muted font-mono transition-colors duration-500 uppercase tracking-widest">Map Link Active</span>
                    </div>
                  </div>

                  <div className="mt-8 p-6 glass-panel border-white/5 rounded-2xl bg-brand-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="h-3 w-3 text-brand-primary" />
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest transition-colors duration-500">Map Note</span>
                    </div>
                    <p className="text-xs font-medium text-text-muted opacity-70 leading-relaxed transition-all duration-500">
                      Locations are approximate. Please verify addresses and directions before visiting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Post-flight Intel (Full Width) */}
            <div className="w-full mt-12 mb-12 space-y-6">
              {/* Detailed Cost Analysis - Full Width */}
              {itinerary.travelCost && (
                <div className="animate-fadeInUp w-full" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Trip Budgeting</h3>
                      <p className="text-[10px] font-bold text-text-muted opacity-60">AI-powered cost projections</p>
                    </div>
                  </div>
                  <div className="w-full">
                    <TravelCostCard travelCost={itinerary.travelCost as any} />
                  </div>
                </div>
              )}

              {/* Daily Advice Section - Full Width Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="glass-card p-8 border-brand-tertiary/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-brand-tertiary/10 flex items-center justify-center">
                      <Wind className="h-5 w-5 text-brand-tertiary" />
                    </div>
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Weather Tips</h3>
                  </div>
                  <p className="text-sm font-medium text-text-muted opacity-80 italic transition-all duration-500">
                    {itinerary.localization?.targetLanguage && `Local language: ${itinerary.localization.targetLanguage}. `}
                    Pack comfortable clothes and dress for the weather. Stay hydrated during your trip.
                  </p>
                </div>

                <div className="glass-card p-8 border-purple-500/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Compass className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] transition-colors duration-500">Local Tips</h3>
                  </div>
                  <p className="text-sm font-medium text-text-muted opacity-80 transition-all duration-500">
                    Explore local neighborhoods and hidden gems beyond the tourist spots for a richer cultural experience.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'expenses' ? (
          <TripExpenses
            tripId={itinerary._id!}
            members={members}
            currentUser={user}
          />
        ) : (
          <TripChat
            tripId={itinerary._id!}
            currentUser={user}
          />
        )}
      </div>

      {/* Fullscreen Map Overlay */}
      {isMapFull && (
        <div
          className="fixed inset-0 z-[1000] bg-white/90 dark:bg-void/90 backdrop-blur-2xl p-4 md:p-10 flex flex-col animate-fadeIn"
          onClick={() => setIsMapFull(false)}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-1">Route Overview</p>
              <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter italic">
                Full-Scale Trip Briefing: <span className="text-gradient">{itinerary.destination}</span>
              </h2>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMapFull(false); }}
              title="Close Map"
              className="w-14 h-14 rounded-2xl glass-panel border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-secondary/10 transition-all shadow-xl shadow-brand-secondary/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div
            className="flex-grow rounded-[40px] overflow-hidden border border-surface-border shadow-3xl relative"
            onClick={e => e.stopPropagation()}
          >
            <MapView destinations={mapDestinations} />
          </div>
        </div>
      )}

      {itinerary._id && isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            apiService.getTripMembers(itinerary._id!).then(setMembers).catch(console.error);
          }}
          tripId={itinerary._id}
          currentUserRole={itinerary.memberRole || 'viewer'}
        />
      )}

      <ConfirmationModal
        isOpen={isLeaveConfirmOpen}
        title="Leave This Trip"
        message="Are you sure you want to leave this trip? This will immediately revoke your access to the trip details, expenses, and chat. You cannot rejoin without a fresh invite."
        confirmLabel="Leave Trip"
        onConfirm={handleConfirmLeave}
        onCancel={() => setIsLeaveConfirmOpen(false)}
        variant="warning"
      />
    </>
  );
};

export default ItineraryDisplay;