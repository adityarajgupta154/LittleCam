import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, TrafficLayer } from '@react-google-maps/api';
import { darkMapStyle } from '../utils/mapStyles';
import { useData } from '../context/DataContext';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 12.9716,
  lng: 77.5946
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const libraries = ['visualization', 'places'];

const HEATMAP_GRADIENT = [
  'rgba(0, 255, 255, 0)',
  'rgba(0, 255, 255, 1)',
  'rgba(0, 191, 255, 1)',
  'rgba(0, 127, 255, 1)',
  'rgba(0, 63, 255, 1)',
  'rgba(0, 0, 255, 1)',
  'rgba(0, 0, 223, 1)',
  'rgba(0, 0, 191, 1)',
  'rgba(0, 0, 159, 1)',
  'rgba(0, 0, 127, 1)',
  'rgba(63, 0, 91, 1)',
  'rgba(127, 0, 63, 1)',
  'rgba(191, 0, 31, 1)',
  'rgba(255, 0, 0, 1)'
];

// Optimized map options — greedy gesture, no extra UI, GPU-friendly
const mapOptions = {
  styles: darkMapStyle,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

// Build marker icon config (pure function, no deps on google)
const getMarkerConfig = (score) => {
  let color = '#10b981';
  let scale = 6;
  if (score >= 80) { color = '#ef4444'; scale = 12; }
  else if (score >= 50) { color = '#f59e0b'; scale = 9; }
  return { color, scale };
};

const GoogleTrafficMap = ({ 
  mode = 'current', 
  showHeatmap = false, 
  showTraffic = false,
  customData = null
}) => {
  const { data } = useData();
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const hotspots = customData || data.hotspots || [];

  // ─── NATIVE MARKER MANAGEMENT ───────────────────────────────
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => {
      try { m.setMap(null); } catch (e) { /* ignore */ }
    });
    markersRef.current = [];
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !isLoaded || !window.google?.maps) return;

    // Clear old markers
    clearMarkers();

    // Don't render markers during heatmap mode
    if (showHeatmap) return;

    const circlePath = window.google.maps.SymbolPath?.CIRCLE || 0;

    // Create all markers natively in one pass
    const newMarkers = hotspots.map(h => {
      const score = mode === 'predicted'
        ? Math.min((h.predicted_next_window || 0) * 3, 100)
        : h.impact_score;
      const cfg = getMarkerConfig(score);

      const marker = new window.google.maps.Marker({
        position: { lat: h.centroid_lat, lng: h.centroid_lng },
        map: map,
        icon: {
          path: circlePath,
          fillColor: cfg.color,
          fillOpacity: 0.8,
          scale: cfg.scale,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
        optimized: true, // use canvas rendering for perf
      });

      marker.addListener('click', () => setSelectedHotspot(h));
      return marker;
    });

    markersRef.current = newMarkers;

    return () => clearMarkers();
  }, [isLoaded, mapReady, hotspots, mode, showHeatmap, clearMarkers]);

  // ─── NATIVE HEATMAP MANAGEMENT ──────────────────────────────
  const heatmapData = useMemo(() => {
    return hotspots
      .filter(h => {
        const lat = Number(h.centroid_lat);
        const lng = Number(h.centroid_lng);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(h => ({
        lat: Number(h.centroid_lat),
        lng: Number(h.centroid_lng),
        weight: (h.impact_score || 1) * (h.violation_count || 1)
      }));
  }, [hotspots]);

  useEffect(() => {
    // Clean up old heatmap
    if (heatmapRef.current) {
      try { heatmapRef.current.setMap(null); } catch (e) { /* ignore */ }
      heatmapRef.current = null;
    }

    const map = mapRef.current;
    if (
      !showHeatmap || !map || !mapReady ||
      !window.google?.maps?.visualization
    ) return;

    try {
      const points = heatmapData.map(d => ({
        location: new window.google.maps.LatLng(d.lat, d.lng),
        weight: d.weight
      }));

      if (points.length === 0) return;

      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: points,
        map: map,
        radius: 20,
        opacity: 0.6,
        gradient: HEATMAP_GRADIENT
      });
    } catch (err) {
      // Silently handle failure
    }

    return () => {
      if (heatmapRef.current) {
        try { heatmapRef.current.setMap(null); } catch (e) { /* ignore */ }
        heatmapRef.current = null;
      }
    };
  }, [showHeatmap, mapReady, hotspots]);

  // ─── MAP LIFECYCLE ──────────────────────────────────────────
  const onLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    setMapReady(true);
  }, []);

  const onUnmount = useCallback(() => {
    clearMarkers();
    if (heatmapRef.current) {
      try { heatmapRef.current.setMap(null); } catch (e) { /* ignore */ }
      heatmapRef.current = null;
    }
    mapRef.current = null;
    setMapReady(false);
  }, [clearMarkers]);

  // Close info window callback
  const handleCloseInfo = useCallback(() => setSelectedHotspot(null), []);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0f1e] text-gray-400">
        Loading Map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {showTraffic && <TrafficLayer />}

      {selectedHotspot && (
        <InfoWindow
          position={{ lat: selectedHotspot.centroid_lat, lng: selectedHotspot.centroid_lng }}
          onCloseClick={handleCloseInfo}
        >
          <div className="text-gray-900 min-w-[200px] p-1 font-sans">
            <h3 className="font-bold text-lg mb-2 border-b pb-1">
              #{selectedHotspot.rank} {selectedHotspot.police_station || selectedHotspot.location_name}
            </h3>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-600">Location:</span>
              <span>{selectedHotspot.nearest_landmark}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-600">Impact Score:</span>
              <span className={`font-bold ${selectedHotspot.impact_score >= 80 ? 'text-red-600' : 'text-orange-500'}`}>
                {selectedHotspot.impact_score}/100
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-600">Violations:</span>
              <span>{selectedHotspot.violation_count}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-600">Peak Time:</span>
              <span>{selectedHotspot.peak_time || '6PM-9PM'}</span>
            </div>
            <div className="mt-3 pt-2 border-t text-sm font-semibold text-emerald-600">
              Action: Deploy {Math.max(2, Math.round(selectedHotspot.impact_score / 15))} officers
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default React.memo(GoogleTrafficMap);
