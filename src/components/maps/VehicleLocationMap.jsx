import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon for vehicles
const vehicleIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097142.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Location mapping for Isla de Margarita
const locationCoordinates = {
  "porlamar": { lat: 10.9576, lng: -63.8496 },
  "pampatar": { lat: 10.9983, lng: -63.7983 },
  "juan griego": { lat: 11.0819, lng: -63.9694 },
  "la asuncion": { lat: 11.0331, lng: -63.8628 },
  "el yaque": { lat: 10.8892, lng: -63.8947 },
  "playa el agua": { lat: 11.0167, lng: -63.8333 },
  "valle": { lat: 10.9833, lng: -63.9167 },
  "costa azul": { lat: 10.9700, lng: -63.8600 }
};

export const getCoordinatesFromLocation = (location) => {
  if (!location) return [10.9971, -63.9137]; // Default center of Margarita

  const locationLower = location.toLowerCase();
  
  // Check for exact or partial matches
  for (const [key, coords] of Object.entries(locationCoordinates)) {
    if (locationLower.includes(key)) {
      // Add small random offset for multiple vehicles in same area
      const offset = 0.005;
      return [
        coords.lat + (Math.random() - 0.5) * offset,
        coords.lng + (Math.random() - 0.5) * offset
      ];
    }
  }

  // If no match, return default with slight randomization
  return [
    10.9971 + (Math.random() - 0.5) * 0.05,
    -63.9137 + (Math.random() - 0.5) * 0.05
  ];
};

export default function VehicleLocationMap({ vehicle, vehicles, height = "400px", zoom = 12, showPopup = true }) {
  const isSingleVehicle = !!vehicle;
  const vehicleList = isSingleVehicle ? [vehicle] : vehicles || [];
  
  // Calculate center based on vehicles
  const center = isSingleVehicle 
    ? getCoordinatesFromLocation(vehicle.location)
    : [10.9971, -63.9137]; // Center of Isla de Margarita

  return (
    <div style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden border shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {vehicleList.map((v) => {
          const coords = getCoordinatesFromLocation(v.location);
          return (
            <Marker 
              key={v.id} 
              position={coords}
              icon={vehicleIcon}
            >
              {showPopup && (
                <Popup maxWidth={250}>
                  <div className="p-2">
                    {v.photos?.[0] && (
                      <img
                        src={v.photos[0]}
                        alt={v.title}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="font-semibold text-sm mb-1">{v.title}</p>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {v.location}
                    </p>
                    <p className="font-bold text-teal-600 mb-2">${v.price_per_day}/día</p>
                    {!isSingleVehicle && (
                      <Link
                        to={createPageUrl(`VehicleDetails?id=${v.id}`)}
                        className="text-xs text-teal-600 hover:underline font-medium block"
                      >
                        Ver detalles →
                      </Link>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}