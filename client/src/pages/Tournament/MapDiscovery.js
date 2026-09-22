import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Trophy, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapDiscovery = ({ defaultLocation = [40.7128, -74.0060], onRadiusChange, onLocationChange }) => {
  const [radius, setRadius] = useState(50); // Default 50km
  const [tournaments, setTournaments] = useState([]);
  const navigate = useNavigate();

  // We need to fetch tournaments from our backend with geospatial query
  useEffect(() => {
    fetchNearbyTournaments();
  }, [radius, defaultLocation]);

  const fetchNearbyTournaments = async () => {
    try {
      const response = await fetch(`/api/tournaments/search?lat=${defaultLocation[0]}&lng=${defaultLocation[1]}&radius=${radius}`);
      const data = await response.json();
      if (data.success) {
        setTournaments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching nearby tournaments:', error);
    }
  };

  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full rounded-[32px] overflow-hidden relative glass-panel bg-white/40 border border-white">
      {/* Control Panel overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 w-64">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center">
          <MapPin size={16} className="mr-1.5 text-blue-500" /> Search Radius
        </h3>
        <div className="flex justify-between text-xs font-bold text-blue-600 mb-2">
          <span>{radius} km</span>
        </div>
        <input 
          type="range" 
          min="5" 
          max="500" 
          step="5"
          value={radius}
          onChange={handleRadiusChange}
          className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-xs text-slate-500 mt-2 font-medium">
          Found {tournaments.length} tournaments nearby
        </p>
      </div>

      <MapContainer 
        center={defaultLocation} 
        zoom={10} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current Location Circle */}
        <Circle 
          center={defaultLocation} 
          pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1 }}
          radius={radius * 1000} // Leaflet uses meters
        />
        
        {/* User Location Marker */}
        <Marker position={defaultLocation}>
          <Popup>
            <div className="font-bold text-slate-800">Your Location</div>
          </Popup>
        </Marker>

        {/* Tournament Markers */}
        {tournaments.map((tournament) => {
          if (tournament.venue?.location?.coordinates) {
            const [lng, lat] = tournament.venue.location.coordinates;
            return (
              <Marker key={tournament._id} position={[lat, lng]}>
                <Popup className="tournament-popup">
                  <div className="p-1 min-w-[200px]">
                    <h4 className="font-bold text-slate-800 text-base mb-1">{tournament.name}</h4>
                    <div className="text-sm text-slate-500 font-medium mb-3 flex items-center">
                      <Trophy size={14} className="mr-1.5 text-yellow-500" /> {tournament.sport}
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <div className="text-xs flex items-center text-slate-600">
                        <Calendar size={12} className="mr-1.5" /> 
                        {new Date(tournament.dates?.tournamentStart).toLocaleDateString()}
                      </div>
                      <div className="text-xs flex items-center text-slate-600">
                        <DollarSign size={12} className="mr-1.5" /> 
                        {tournament.registrationFee > 0 ? `$${tournament.registrationFee}` : 'Free Entry'}
                      </div>
                      <div className="text-xs flex items-center text-slate-600">
                        <Users size={12} className="mr-1.5" /> 
                        {tournament.registeredTeams?.length || 0} / {tournament.maxTeams} Teams
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/tournaments/${tournament._id}`)}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default MapDiscovery;
