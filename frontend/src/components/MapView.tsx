import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Loader2, MapPin, Satellite, Shield, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MapDestination {
  location: string;
  day: number;
  type: string;
  latitude?: number;
  longitude?: number;
}

interface MapViewProps {
  destinations: MapDestination[];
}

// Fix for default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Simple Geocoding Cache to avoid redundant API hits
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

const MapView: React.FC<MapViewProps> = ({ destinations }) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedCount, setResolvedCount] = useState(0);

  // Helper to wait between requests (Nominatim limit: 1 request per second)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fitBounds = () => {
    if (!mapRef.current || markersRef.current.length === 0) return;
    try {
      const markerGroup = L.featureGroup(markersRef.current);
      // Relaxed zoom for better context (maxZoom 11)
      mapRef.current.fitBounds(markerGroup.getBounds(), { padding: [80, 80], maxZoom: 11 });
    } catch (e) {
      console.warn("Failed to fit bounds", e);
    }
  };

  const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number } | null> => {
    if (geocodeCache[query]) return geocodeCache[query];

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'VoyageAI-Planner/1.0 (contact: support@voyageai.local)'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache[query] = result;
        return result;
      }
    } catch (e) {
      console.error(`Geocoding failed for ${query}:`, e);
    }
    return null;
  };

  // 1. Initialization and Theme Handling
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView([20, 0], 2);
    }
    
    // Handle Tile Layer separately so we can update it without re-running geocoding
    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    } else if (mapRef.current) {
      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 20,
      }).addTo(mapRef.current);
    }

    const timer = setTimeout(() => mapRef.current?.invalidateSize(), 800);
    return () => clearTimeout(timer);
  }, [theme]);

  // 2. Destinations and Markers Handling
  useEffect(() => {
    if (!mapRef.current) return;
    
    const resolveAllCoordinates = async () => {
      const needsGeocoding = destinations.some(d => !d.latitude || !d.longitude);
      setIsGeocoding(needsGeocoding);
      setResolvedCount(0);
      
      const map = mapRef.current;
      if (!map) return;

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const mainDestination = destinations.find(d => d.type === 'arrival')?.location || destinations[0]?.location || '';
      let lastValidCoords: { lat: number; lng: number } | null = null;
      let markersAdded = 0;

      for (const dest of destinations) {
        let lat: number, lng: number;

        if (dest.latitude && dest.longitude) {
          lat = dest.latitude + (Math.random() - 0.5) * 0.0001;
          lng = dest.longitude + (Math.random() - 0.5) * 0.0001;
        } else {
          const query = dest.type === 'waypoint' ? `${mainDestination}, ${dest.location}` : dest.location;
          if (!geocodeCache[query]) await delay(1100); 
          const coords = await geocodeLocation(query);
          if (coords) {
            lat = coords.lat; lng = coords.lng;
            lastValidCoords = coords;
          } else {
            const seed = lastValidCoords || { lat: 20, lng: 0 }; 
            lat = seed.lat + (Math.random() - 0.5) * 0.05; 
            lng = seed.lng + (Math.random() - 0.5) * 0.05;
          }
        }

        const isArrival = dest.type === 'arrival';
        const colorClass = isArrival ? 'text-brand-primary' : 'text-brand-tertiary';
        const glowClass = isArrival ? 'shadow-brand-primary/50' : 'shadow-brand-tertiary/50';
        
        const customIcon = L.divIcon({
          html: `
            <div class="mission-marker flex items-center justify-center">
              <div class="absolute w-12 h-12 border border-white/10 rounded-full animate-rotate-target opacity-20"></div>
              <div class="absolute w-8 h-8 ${isArrival ? 'bg-brand-primary/20' : 'bg-brand-tertiary/20'} rounded-full animate-pulse-glow opacity-40"></div>
              <div class="relative w-7 h-7 bg-bg-void rounded-xl flex items-center justify-center border-2 ${isArrival ? 'border-brand-primary' : 'border-brand-tertiary'} ${glowClass} shadow-lg transition-transform hover:scale-125 z-10">
                <span class="text-[9px] font-black ${colorClass} uppercase tracking-tighter">${isArrival ? '★' : dest.day}</span>
              </div>
              <div class="absolute top-[100%] mt-1 whitespace-nowrap bg-bg-void/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-[8px] font-black text-white uppercase tracking-widest">${dest.location}</span>
              </div>
            </div>
          `,
          className: 'marker-group',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([lat, lng], { icon: customIcon })
          .bindPopup(`
            <div class="hud-popup p-4 min-w-[220px]">
              <div class="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div class="flex items-center gap-2">
                  ${isArrival ? '<Shield class="h-3 w-3 text-brand-primary" />' : '<Zap class="h-3 w-3 text-brand-tertiary" />'}
                  <span class="text-[9px] font-black text-white uppercase tracking-[0.2em]">${isArrival ? 'Primary Objective' : 'Waypoint ' + dest.day}</span>
                </div>
                <span class="text-[8px] font-mono text-white/40">GEO-FIX: ${lat.toFixed(4)}</span>
              </div>
              <h4 class="text-sm font-black text-brand-primary leading-none mb-1 uppercase">${dest.location}</h4>
              <p class="text-[9px] font-bold text-text-muted transition-colors duration-500 uppercase tracking-widest">Phase Deployment Sequence Active</p>
            </div>
          `, { className: 'custom-leaflet-popup', closeButton: false })
          .addTo(map);

        markersRef.current.push(marker);
        markersAdded++;
        setResolvedCount(markersAdded);

        if (markersAdded === 1) {
          map.setView([lat, lng], 8);
        }
      }

      if (markersRef.current.length > 0) {
        fitBounds();
      }
      setIsGeocoding(false);
    };

    resolveAllCoordinates();
  }, [destinations]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-bg-void transition-colors duration-500 overflow-hidden rounded-[40px] border border-white/5 shadow-3xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px] z-0" />
      
      {/* HUD Layers */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Tactical Grid Overlay */}
        <div className="absolute inset-0 map-grid-overlay opacity-30" />
        
        {/* Scanning Line Animation */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-brand-primary/40 to-transparent animate-scan" style={{ top: '-10%' }} />
        </div>

        {/* HUD Frame Elements */}
        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-brand-primary/30 m-6 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-brand-primary/30 m-6 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-brand-primary/30 m-6 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-brand-primary/30 m-6 rounded-br-2xl" />
      </div>

      {/* Geocoding Overlay HUD */}
      {isGeocoding && (
        <div className="absolute top-10 left-10 z-[402] flex items-center gap-4 glass-panel p-5 rounded-2xl border-brand-primary/30 animate-fadeIn backdrop-blur-xl">
          <div className="relative">
            <Loader2 className="h-6 w-6 text-brand-primary animate-spin" />
            <Satellite className="h-3 w-3 text-brand-primary absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="flex flex-col">
            <p className="text-[11px] font-black text-brand-primary uppercase tracking-[0.3em] leading-none mb-1.5">Satellite Uplink</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary transition-all duration-500" 
                  style={{ width: `${(resolvedCount / destinations.length) * 100}%` }} 
                />
              </div>
              <p className="text-[9px] font-black text-text-muted leading-none uppercase">Scouting {resolvedCount}/{destinations.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls HUD - Tactical Sidebar Style */}
      <div className="absolute bottom-10 right-10 z-[401] flex flex-col gap-4">
        <div className="glass-panel p-2 rounded-[24px] flex flex-col gap-2 border-brand-primary/20 backdrop-blur-xl shadow-2xl">
          <button 
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
            className="w-12 h-12 rounded-2xl bg-bg-void border border-white/5 flex items-center justify-center text-text-main hover:text-brand-primary hover:border-brand-primary/40 transition-all font-black text-xl active:scale-95 group"
          >
            <span className="group-hover:scale-110 transition-transform">+</span>
          </button>
          <button 
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
            className="w-12 h-12 rounded-2xl bg-bg-void border border-white/5 flex items-center justify-center text-text-main hover:text-brand-primary hover:border-brand-primary/40 transition-all font-black text-xl active:scale-95 group"
          >
            <span className="group-hover:scale-110 transition-transform">-</span>
          </button>
          <div className="h-[1px] mx-2 bg-white/10" />
          <button 
            onClick={fitBounds}
            title="Recenter Map"
            className="w-12 h-12 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 flex items-center justify-center text-brand-primary hover:bg-brand-primary/20 transition-all shadow-lg active:scale-95"
          >
            <Crosshair className="h-6 w-6" />
          </button>
        </div>
      </div>

      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: var(--surface-glass) !important;
          backdrop-filter: blur(24px) !important;
          border: 1px solid var(--brand-primary) !important;
          border-radius: 20px !important;
          box-shadow: 0 0 30px rgba(255, 145, 83, 0.2) !important;
          padding: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: var(--brand-primary) !important;
        }
        .leaflet-container {
          background: var(--bg-void) !important;
          cursor: crosshair !important;
        }
        .leaflet-tile-pane {
          filter: ${theme === 'dark' 
            ? 'brightness(1.1) contrast(1.1) saturate(1.1) hue-rotate(0deg)' 
            : 'brightness(1.05) contrast(1.05) saturate(1.1)'};
          transition: filter 0.5s ease;
        }
        .marker-group {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .marker-group:hover {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
};

export default React.memo(MapView);