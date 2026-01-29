import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Car, MapPin, Grid3x3, Map as MapIcon, ArrowUpDown } from "lucide-react";
import VehicleCard from "@/components/vehicles/VehicleCard";
import VehicleFilters from "@/components/vehicles/VehicleFilters";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Browse() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    vehicleType: "all",
    transmission: "all",
    fuelType: "all",
    seats: "all",
    priceRange: [0, 500],
    startDate: null,
    endDate: null,
    location: "",
    features: [],
    commercialUse: false
  });
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, filters, searchTerm, sortBy]);

  const loadVehicles = async () => {
    setIsLoading(true);
    const data = await base44.entities.Vehicle.filter(
      { is_active: true, is_available: true },
      "-created_date"
    );
    setVehicles(data);
    setIsLoading(false);
  };

  const applyFilters = () => {
    let result = [...vehicles];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.title?.toLowerCase().includes(search) ||
        v.brand?.toLowerCase().includes(search) ||
        v.model?.toLowerCase().includes(search) ||
        v.location?.toLowerCase().includes(search)
      );
    }

    // Vehicle type filter
    if (filters.vehicleType !== "all") {
      result = result.filter(v => v.vehicle_type === filters.vehicleType);
    }

    // Transmission filter
    if (filters.transmission !== "all") {
      result = result.filter(v => v.transmission === filters.transmission);
    }

    // Fuel type filter
    if (filters.fuelType !== "all") {
      result = result.filter(v => v.fuel_type === filters.fuelType);
    }

    // Seats filter
    if (filters.seats !== "all") {
      const seatsNum = parseInt(filters.seats);
      if (seatsNum === 7) {
        result = result.filter(v => v.seats >= 7);
      } else {
        result = result.filter(v => v.seats === seatsNum);
      }
    }

    // Price range filter
    result = result.filter(v =>
      v.price_per_day >= filters.priceRange[0] &&
      v.price_per_day <= filters.priceRange[1]
    );

    // Location filter
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter(v => v.location?.toLowerCase().includes(loc));
    }

    // Commercial use filter
    if (filters.commercialUse) {
      result = result.filter(v => v.allow_commercial_use === true);
    }

    // Features filter
    if (filters.features && filters.features.length > 0) {
      result = result.filter(v => {
        if (!v.features) return false;
        return filters.features.every(f => v.features.includes(f));
      });
    }

    // Date availability filter
    if (filters.startDate && filters.endDate) {
      result = result.filter(v => {
        if (!v.blocked_dates || v.blocked_dates.length === 0) return true;
        
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          if (v.blocked_dates.includes(dateStr)) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting
    result = applySorting(result);

    setFilteredVehicles(result);
  };

  const applySorting = (data) => {
    const sorted = [...data];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price_per_day - b.price_per_day);
      case "price-high":
        return sorted.sort((a, b) => b.price_per_day - a.price_per_day);
      case "rating":
        return sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      default:
        return sorted;
    }
  };

  const clearFilters = () => {
    setFilters({
      vehicleType: "all",
      transmission: "all",
      fuelType: "all",
      seats: "all",
      priceRange: [0, 500],
      startDate: null,
      endDate: null,
      location: "",
      features: [],
      commercialUse: false
    });
    setSearchTerm("");
  };

  // Coordinates for Isla de Margarita
  const mapCenter = [10.9971, -63.9137];

  const getVehicleCoordinates = (vehicle) => {
    // Generate approximate coordinates based on location string
    const baseCoords = { lat: 10.9971, lng: -63.9137 };
    const locations = {
      "porlamar": { lat: 10.9576, lng: -63.8496 },
      "pampatar": { lat: 10.9983, lng: -63.7983 },
      "juan griego": { lat: 11.0819, lng: -63.9694 },
      "la asuncion": { lat: 11.0331, lng: -63.8628 },
      "el yaque": { lat: 10.8892, lng: -63.8947 }
    };

    const location = vehicle.location?.toLowerCase() || "";
    for (const [key, coords] of Object.entries(locations)) {
      if (location.includes(key)) {
        return [coords.lat + (Math.random() - 0.5) * 0.01, coords.lng + (Math.random() - 0.5) * 0.01];
      }
    }

    return [baseCoords.lat + (Math.random() - 0.5) * 0.1, baseCoords.lng + (Math.random() - 0.5) * 0.1];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl("Landing")} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent hidden sm:block">GoRentals</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-gray-600">Isla de Margarita</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por marca, modelo o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-200 text-base"
            />
          </div>

          {/* Filters */}
          <VehicleFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingSpinner className="py-20" text="Cargando vehículos..." />
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No se encontraron vehículos"
            description="Intenta ajustar tus filtros o buscar con otros términos"
            actionLabel="Limpiar filtros"
            onAction={clearFilters}
          />
        ) : (
          <>
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{filteredVehicles.length}</span> vehículos encontrados
              </p>
              
              <div className="flex items-center gap-3">
                {/* Sort Selector */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor valorados</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <Tabs value={viewMode} onValueChange={setViewMode} className="hidden md:block">
                  <TabsList className="bg-gray-100 rounded-xl">
                    <TabsTrigger value="grid" className="rounded-lg">
                      <Grid3x3 className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="map" className="rounded-lg">
                      <MapIcon className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <VehicleCard vehicle={vehicle} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === "map" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-[600px] rounded-2xl overflow-hidden border shadow-sm">
                  <MapContainer
                    center={mapCenter}
                    zoom={11}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredVehicles.map((vehicle) => {
                      const coords = getVehicleCoordinates(vehicle);
                      return (
                        <Marker key={vehicle.id} position={coords}>
                          <Popup>
                            <div className="p-2">
                              <img
                                src={vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200"}
                                alt={vehicle.title}
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                              <p className="font-semibold text-sm mb-1">{vehicle.title}</p>
                              <p className="text-xs text-gray-500 mb-2">{vehicle.location}</p>
                              <p className="font-bold text-teal-600">${vehicle.price_per_day}/día</p>
                              <Link
                                to={createPageUrl(`VehicleDetails?id=${vehicle.id}`)}
                                className="text-xs text-teal-600 hover:underline mt-2 block"
                              >
                                Ver detalles →
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
                
                <div className="h-[600px] overflow-y-auto space-y-4">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}