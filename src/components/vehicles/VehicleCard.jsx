import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Users, Fuel, Settings } from "lucide-react";

const vehicleTypeLabels = {
  sedan: "Sedán",
  suv: "SUV",
  pickup: "Pickup",
  van: "Van",
  motorcycle: "Moto",
  compact: "Compacto"
};

const transmissionLabels = {
  automatic: "Automático",
  manual: "Manual"
};

const fuelLabels = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido"
};

export default function VehicleCard({ vehicle }) {
  const mainPhoto = vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400";

  return (
    <Link to={createPageUrl(`VehicleDetails?id=${vehicle.id}`)}>
      <Card className="group overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={mainPhoto}
            alt={vehicle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          <Badge className="absolute top-3 left-3 bg-white/95 text-gray-800 backdrop-blur-sm border-0 shadow-sm">
            {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
          </Badge>
          
          {vehicle.average_rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-gray-800">{vehicle.average_rating.toFixed(1)}</span>
            </div>
          )}
          
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-semibold text-lg drop-shadow-md">
              ${vehicle.price_per_day}<span className="text-sm font-normal opacity-90">/día</span>
            </p>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-teal-600 transition-colors">
            {vehicle.title}
          </h3>
          <p className="text-gray-500 text-sm mb-3">
            {vehicle.brand} {vehicle.model} • {vehicle.year}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              <span>{transmissionLabels[vehicle.transmission]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              <span>{fuelLabels[vehicle.fuel_type]}</span>
            </div>
            {vehicle.seats && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{vehicle.seats}</span>
              </div>
            )}
          </div>
          
          {vehicle.location && (
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{vehicle.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}