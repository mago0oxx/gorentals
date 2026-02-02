import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Navigation, DollarSign, Waves, UtensilsCrossed, Camera } from "lucide-react";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const categoryColors = {
  beach: "#0891b2",
  restaurant: "#ea580c",
  route: "#8b5cf6",
  attraction: "#ec4899"
};

const categoryIcons = {
  beach: "🏖️",
  restaurant: "🍴",
  route: "🗺️",
  attraction: "📸"
};

const createCustomMarker = (category) => {
  const color = categoryColors[category] || "#64748b";
  const icon = categoryIcons[category] || "📍";
  
  return L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="
          background: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 18px;
          ">${icon}</span>
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const getPriceDisplay = (priceLevel) => {
  const levels = {
    free: "Gratis",
    budget: "$",
    moderate: "$$",
    expensive: "$$$"
  };
  return levels[priceLevel] || "$";
};

export default function LocalGuidesMap({ guides, selectedCategory }) {
  const [map, setMap] = useState(null);

  // Filter guides by category and ensure they have coordinates
  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const hasCoords = guide.coordinates?.lat && guide.coordinates?.lng;
      const matchesCategory = selectedCategory === "all" || guide.category === selectedCategory;
      return hasCoords && matchesCategory && guide.is_active;
    });
  }, [guides, selectedCategory]);

  // Calculate map center based on filtered guides
  const mapCenter = useMemo(() => {
    if (filteredGuides.length === 0) {
      return [11.0, -63.9]; // Default Margarita center
    }
    
    const avgLat = filteredGuides.reduce((sum, g) => sum + g.coordinates.lat, 0) / filteredGuides.length;
    const avgLng = filteredGuides.reduce((sum, g) => sum + g.coordinates.lng, 0) / filteredGuides.length;
    
    return [avgLat, avgLng];
  }, [filteredGuides]);

  // Fit bounds when filtered guides change
  useEffect(() => {
    if (map && filteredGuides.length > 0) {
      const bounds = L.latLngBounds(
        filteredGuides.map(g => [g.coordinates.lat, g.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, filteredGuides]);

  return (
    <div className="relative h-[400px] md:h-[600px] w-full rounded-xl md:rounded-2xl overflow-hidden shadow-lg border-2 md:border-4 border-white">
      <MapContainer
        center={mapCenter}
        zoom={11}
        className="h-full w-full"
        scrollWheelZoom={false}
        dragging={true}
        touchZoom={true}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredGuides.map((guide) => (
          <Marker
            key={guide.id}
            position={[guide.coordinates.lat, guide.coordinates.lng]}
            icon={createCustomMarker(guide.category)}
          >
            <Popup className="custom-popup" maxWidth={300}>
              <div className="p-2">
                {guide.photos?.[0] && (
                  <img
                    src={guide.photos[0]}
                    alt={guide.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-bold text-lg mb-2">{guide.title}</h3>
                
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{guide.location}</span>
                </div>

                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {guide.description}
                </p>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    {categoryIcons[guide.category]}
                    {guide.category === "beach" && "Playa"}
                    {guide.category === "restaurant" && "Restaurante"}
                    {guide.category === "route" && "Ruta"}
                    {guide.category === "attraction" && "Atracción"}
                  </Badge>
                  
                  {guide.rating && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {guide.rating.toFixed(1)}
                    </Badge>
                  )}

                  <Badge variant="outline">
                    {getPriceDisplay(guide.price_level)}
                  </Badge>
                </div>

                {guide.tips?.length > 0 && (
                  <div className="text-xs text-teal-700 bg-teal-50 p-2 rounded mb-3">
                    💡 {guide.tips[0]}
                  </div>
                )}

                <Button 
                  size="sm" 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    // Scroll to the guide card in the list
                    const element = document.getElementById(`guide-${guide.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.classList.add('ring-4', 'ring-teal-400', 'ring-offset-2');
                      setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-teal-400', 'ring-offset-2');
                      }, 2000);
                    }
                  }}
                >
                  Ver detalles
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-white rounded-lg md:rounded-xl shadow-lg p-2 md:p-4 z-[1000] max-w-[140px] md:max-w-none">
        <h4 className="font-semibold text-xs md:text-sm mb-1 md:mb-2">Categorías</h4>
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors.beach }}></div>
            <span>Playas</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors.attraction }}></div>
            <span>Atracciones</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors.restaurant }}></div>
            <span>Comida</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors.route }}></div>
            <span>Rutas</span>
          </div>
        </div>
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t text-xs text-gray-600">
          {filteredGuides.length} lugares
        </div>
      </div>
    </div>
  );
}