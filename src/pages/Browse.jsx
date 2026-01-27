import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Car, MapPin } from "lucide-react";
import VehicleCard from "@/components/vehicles/VehicleCard";
import VehicleFilters from "@/components/vehicles/VehicleFilters";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Browse() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    vehicleType: "all",
    transmission: "all",
    priceRange: [0, 500],
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, filters, searchTerm]);

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

    // Price range filter
    result = result.filter(v =>
      v.price_per_day >= filters.priceRange[0] &&
      v.price_per_day <= filters.priceRange[1]
    );

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

    setFilteredVehicles(result);
  };

  const clearFilters = () => {
    setFilters({
      vehicleType: "all",
      transmission: "all",
      priceRange: [0, 500],
      startDate: null,
      endDate: null
    });
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl("Landing")} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">RentaMargarita</span>
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{filteredVehicles.length}</span> vehículos encontrados
              </p>
            </div>
            
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
          </>
        )}
      </div>
    </div>
  );
}