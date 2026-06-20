import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '300px'
};

const LIBRARIES = ['visualization', 'places'];

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const iconColors = ['blue', 'green', 'orange', 'purple'];

const MAP_OPTIONS = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
  ],
  disableDefaultUI: true,
  gestureHandling: 'greedy',
};

export default function PatrolRouteMap({ teams = [] }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const allStops = useMemo(() => teams.flatMap(t => t.stops || []), [teams]);
  
  const center = useMemo(() => {
    return allStops.length > 0 
      ? { lat: allStops[0].lat, lng: allStops[0].lng } 
      : { lat: 12.9716, lng: 77.5946 };
  }, [allStops]);

  const teamData = useMemo(() => {
    return teams.map((team, idx) => {
      if (!team.stops || team.stops.length === 0) return null;
      return {
        id: team.team,
        stops: team.stops,
        path: team.stops.map(s => ({ lat: s.lat, lng: s.lng })),
        polyOptions: { strokeColor: colors[idx % colors.length], strokeWeight: 5, strokeOpacity: 0.8 },
        iconUrl: `http://maps.google.com/mapfiles/ms/icons/${iconColors[idx % iconColors.length]}-dot.png`
      };
    }).filter(Boolean);
  }, [teams]);

  if (!isLoaded) return <div className="text-gray-400 p-4">Loading Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={MAP_OPTIONS}
    >
      {teamData.map((data) => (
        <React.Fragment key={data.id}>
          {data.path.length > 1 && (
            <Polyline
              path={data.path}
              options={data.polyOptions}
            />
          )}
          {data.stops.map(s => (
            <Marker
              key={s.hotspot_id}
              position={{ lat: s.lat, lng: s.lng }}
              title={s.location}
              icon={data.iconUrl}
            />
          ))}
        </React.Fragment>
      ))}
    </GoogleMap>
  );
}
