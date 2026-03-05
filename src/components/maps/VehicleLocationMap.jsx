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

// Create custom marker with price badge
const createCustomMarker = (price) => {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          color: #0f766e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
          border: 2px solid #14b8a6;
        ">$${price}</div>
      </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -54],
  });
};

// Location mapping for Isla de Margarita
const margaritaCoordinates = {
  "porlamar": { lat: 10.9576, lng: -63.8496 },
  "pampatar": { lat: 10.9983, lng: -63.7983 },
  "juan griego": { lat: 11.0819, lng: -63.9694 },
  "la asuncion": { lat: 11.0331, lng: -63.8628 },
  "el yaque": { lat: 10.8892, lng: -63.8947 },
  "playa el agua": { lat: 11.0167, lng: -63.8333 },
  "valle": { lat: 10.9833, lng: -63.9167 },
  "costa azul": { lat: 10.9700, lng: -63.8600 }
};

// Location mapping for Buenos Aires
const buenosAiresCoordinates = {
  "palermo": { lat: -34.5755, lng: -58.4244 },
  "belgrano": { lat: -34.5595, lng: -58.4560 },
  "microcentro": { lat: -34.6037, lng: -58.3816 },
  "san telmo": { lat: -34.6214, lng: -58.3731 },
  "recoleta": { lat: -34.5875, lng: -58.3938 },
  "puerto madero": { lat: -34.6131, lng: -58.3631 },
  "caballito": { lat: -34.6185, lng: -58.4417 },
  "villa urquiza": { lat: -34.5730, lng: -58.4890 },
  "almagro": { lat: -34.6098, lng: -58.4175 },
  "flores": { lat: -34.6320, lng: -58.4600 },
  "mataderos": { lat: -34.6557, lng: -58.5120 },
  "constitucion": { lat: -34.6270, lng: -58.3820 },
  "retiro": { lat: -34.5922, lng: -58.3743 },
  "once": { lat: -34.6089, lng: -58.4085 },
  "liniers": { lat: -34.6435, lng: -58.5220 },
  "corrientes": { lat: -34.6041, lng: -58.3952 },
  "buenos aires": { lat: -34.6037, lng: -58.3816 }
};

export const getCoordinatesFromLocation = (location) => {
  if (!location) {
    // Detect branch from localStorage
    try {
      const branch = JSON.parse(localStorage.getItem('selectedBranch'));
      if (branch?.city === "Buenos Aires") return [-34.6037, -58.3816];
    } catch {}
    return [10.9971, -63.9137]; // Default Margarita
  }

  const locationLower = location.toLowerCase();

  // Check Buenos Aires coordinates first
  for (const [key, coords] of Object.entries(buenosAiresCoordinates)) {
    if (locationLower.includes(key)) {
      const offset = 0.003;
      return [
        coords.lat + (Math.random() - 0.5) * offset,
        coords.lng + (Math.random() - 0.5) * offset
      ];
    }
  }

  // Then check Margarita coordinates
  for (const [key, coords] of Object.entries(margaritaCoordinates)) {
    if (locationLower.includes(key)) {
      const offset = 0.005;
      return [
        coords.lat + (Math.random() - 0.5) * offset,
        coords.lng + (Math.random() - 0.5) * offset
      ];
    }
  }

  // Fallback: detect branch from localStorage
  try {
    const branch = JSON.parse(localStorage.getItem('selectedBranch'));
    if (branch?.city === "Buenos Aires") {
      return [
        -34.6037 + (Math.random() - 0.5) * 0.05,
        -58.3816 + (Math.random() - 0.5) * 0.05
      ];
    }
  } catch {}

  return [
    10.9971 + (Math.random() - 0.5) * 0.05,
    -63.9137 + (Math.random() - 0.5) * 0.05
  ];
};

export default function VehicleLocationMap({ vehicle, vehicles, height = "400px", zoom = 12, showPopup = true }) {
  const isSingleVehicle = !!vehicle;
  const vehicleList = isSingleVehicle ? [vehicle] : vehicles || [];

  // Detect default center from branch or first vehicle
  const getDefaultCenter = () => {
    if (isSingleVehicle) return getCoordinatesFromLocation(vehicle.location);
    if (vehicleList.length > 0) return getCoordinatesFromLocation(vehicleList[0].location);
    try {
      const branch = JSON.parse(localStorage.getItem('selectedBranch'));
      if (branch?.city === "Buenos Aires") return [-34.6037, -58.3816];
    } catch {}
    return [10.9971, -63.9137];
  };
  
  const center = getDefaultCenter();

  return (
    <div style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden border shadow-sm">
      <style>{`
        .custom-vehicle-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
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
              icon={createCustomMarker(v.price_per_day)}
            >
              {showPopup && (
                <Popup maxWidth={280} className="vehicle-popup">
                  <div className="overflow-hidden">
                    {v.photos?.[0] && (
                      <img
                        src={v.photos[0]}
                        alt={v.title}
                        className="w-full h-36 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="font-bold text-base mb-1 text-gray-900">{v.title}</p>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {v.location}
                      </p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-teal-600">${v.price_per_day}</span>
                        <span className="text-sm text-gray-500">/día</span>
                      </div>
                      {v.average_rating > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium">{v.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({v.total_reviews})</span>
                        </div>
                      )}
                      {!isSingleVehicle && (
                        <Link
                          to={createPageUrl(`VehicleDetails?id=${v.id}`)}
                          className="block text-center bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Ver detalles
                        </Link>
                      )}
                    </div>
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