import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPreferences, Itinerary } from './types';
import { generateItinerary } from './services/geminiService';
import { apiService, setTokenGetter } from './services/apiService';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { INTEREST_TAGS } from './constants';
import { GlobeIcon } from './components/icons/Icons';

import AuthPage from './components/AuthPage';
import Header from './components/Header';
import Hero from './components/Hero';
import PlannerForm from './components/PlannerForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import Footer from './components/Footer';
import Destinations from './components/Destinations';
import SavedTrips from './components/SavedTrips';
import Favorites from './components/Favorites';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfirmationModal } from './components/ConfirmationModal';

type AppView = 'form' | 'itinerary';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, getAccessToken } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState<Partial<Itinerary> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('form');
  const [savedTrips, setSavedTrips] = useState<Itinerary[]>([]);
  const [interests, setInterests] = useState<string[]>(['Anime', 'History', 'Street Food']);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; tripId: string | null }>({
    isOpen: false,
    tripId: null
  });
  const location = useLocation();

  // Load saved trips on mount from MongoDB
  const loadTrips = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const saved = await apiService.getSavedTrips();
      setSavedTrips(saved);
    } catch (e) {
      console.error("Failed to fetch saved trips from backend:", e);
    }
  }, [isAuthenticated]);

  // Wire the token getter into the API service
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Real-time notification for new trips
  useEffect(() => {
    if (socket) {
      socket.on('trip_added', (data) => {
        console.log('📡 AI-Update: New Mission Assigned', data);
        toast.success('You have been added to a new mission!');
        loadTrips();
      });
      return () => {
        socket.off('trip_added');
      };
    }
  }, [socket, loadTrips]);

  // Reset view when navigating to home or saved-trips manually
  useEffect(() => {
    // If the user clicks "Home" or "My Trips" from the navbar, 
    // we should probably reset any active itinerary view.
    if (!itinerary) {
      setView('form');
    }
  }, [location.pathname, itinerary]);

  const handlePlanTrip = useCallback(async (preferences: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    const toastId = toast.loading('Planning your trip...', {
      className: 'glass-card border-brand-primary/20',
    });
    setItinerary({}); // Start with an empty object to trigger itinerary view
    setView('itinerary');
    navigate('/saved-trips');
    window.scrollTo(0, 0);

    let finalItinerary: Partial<Itinerary> = {};

    try {
      const itineraryGenerator = generateItinerary(preferences);
      for await (const partialItinerary of itineraryGenerator) {
        finalItinerary = partialItinerary;
        setItinerary(partialItinerary);
        
        if (partialItinerary.isComplete) {
          toast.success('Your itinerary is ready!', { id: toastId });
        }
      }

      // Save to history (MongoDB + LocalStorage fallback)
      if (finalItinerary.destination && finalItinerary.dailyPlans && finalItinerary.dailyPlans.length > 0) {
        try {
          const savedTrip = await apiService.saveItinerary(finalItinerary as Itinerary);
          setItinerary(savedTrip);
          setSavedTrips(prev => {
            const updated = [savedTrip, ...prev.filter(t => t.destination !== savedTrip.destination)].slice(0, 5);
            return updated;
          });
        } catch (e) {
          console.error("Failed to save trip to MongoDB:", e);
        }
      }
    } catch (err: any) {
      console.error("Itinerary generation failed:", err);
      const errorMessage = err.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      setView('form');
      setItinerary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadTrip = useCallback((trip: Itinerary) => {
    setItinerary(trip);
    setView('itinerary');
    navigate('/saved-trips');
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleDeleteTripRequest = useCallback((tripId: string) => {
    setDeleteConfirm({ isOpen: true, tripId });
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.tripId) return;
    
    try {
      await apiService.deleteItinerary(deleteConfirm.tripId);
      setSavedTrips(prev => prev.filter(t => t._id !== deleteConfirm.tripId));
      toast.success('Trip deleted successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete trip');
    } finally {
      setDeleteConfirm({ isOpen: false, tripId: null });
    }
  };

  const handleCreateNewTrip = useCallback(() => {
    setView('form');
    setItinerary(null);
    setError(null);
    window.scrollTo(0, 0);
  }, []);

  const handleInterestToggle = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  // Auth loading screen handled in individual routes or at top level if desired
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-void transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center shadow-xl animate-pulse border border-brand-primary/20">
            <GlobeIcon className="h-8 w-8 text-brand-primary" />
          </div>
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest animate-pulse">Initializing VoyageAI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
      {/* Public Auth Routes - No Header/Footer */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <AuthPage initialMode="login" />
      } />
      <Route path="/signup" element={
        isAuthenticated ? <Navigate to="/" replace /> : <AuthPage initialMode="signup" />
      } />

      {/* Protected Main Layout for all other pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={
          <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-bg-void transition-colors duration-500">
            <div className="app-container max-w-7xl mx-auto flex flex-col w-full px-4 sm:px-6 md:px-8">
              <Header onGoHome={handleCreateNewTrip} localization={itinerary?.localization || null} />
              <main className="flex-grow relative py-6 md:py-10">
                <Outlet />
              </main>
            </div>
            <Footer />
          </div>
        }>
        {/* Protected Core Routes */}
        <Route path="/" element={
          <div className="flex flex-col items-center">
            <div className="w-full max-w-5xl py-12">
              <Hero savedTrips={savedTrips} onLoadTrip={handleLoadTrip} />
              <PlannerForm 
                onPlanTrip={handlePlanTrip} 
                error={error} 
                isLoading={isLoading}
                externalInterests={interests}
                onInterestToggle={handleInterestToggle}
              />
            </div>
          </div>
        } />

        {/* Other Routes */}
        <Route path="/saved-trips" element={
          view === 'itinerary' && itinerary ? (
            <div className="max-w-7xl mx-auto py-16">
              <ItineraryDisplay 
                itinerary={itinerary} 
                onCreateNewTrip={handleCreateNewTrip}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <SavedTrips 
              savedTrips={savedTrips} 
              onLoadTrip={handleLoadTrip} 
              onDeleteTrip={handleDeleteTripRequest}
            />
          )
        } />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/favorites" element={<Favorites />} />
      </Route>
    </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

    <ConfirmationModal
      isOpen={deleteConfirm.isOpen}
      title="Purge Expedition Log"
      message="Are you sure you want to delete this trip permanently? This action is irreversible and will remove all mission data from the archives."
      confirmLabel="Purge Archive"
      onConfirm={handleConfirmDelete}
      onCancel={() => setDeleteConfirm({ isOpen: false, tripId: null })}
      variant="danger"
    />
    </>
  );
};

export default App;
