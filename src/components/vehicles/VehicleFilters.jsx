import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlidersHorizontal, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCurrency } from "@/components/currency/CurrencyContext";

export default function VehicleFilters({ filters, onFiltersChange, onClearFilters }) {
  const { getPriceRange, getCurrencySymbol } = useCurrency();
  const [open, setOpen] = useState(false);
  const priceRange = getPriceRange();

  const vehicleTypes = [
    { value: "all", label: "Todos los tipos" },
    { value: "sedan", label: "Sedán" },
    { value: "suv", label: "SUV" },
    { value: "pickup", label: "Pickup" },
    { value: "van", label: "Van" },
    { value: "motorcycle", label: "Moto" },
    { value: "compact", label: "Compacto" }
  ];

  const transmissions = [
    { value: "all", label: "Todas" },
    { value: "automatic", label: "Automático" },
    { value: "manual", label: "Manual" }
  ];

  const fuelTypes = [
    { value: "all", label: "Todos" },
    { value: "gasoline", label: "Gasolina" },
    { value: "diesel", label: "Diésel" },
    { value: "electric", label: "Eléctrico" },
    { value: "hybrid", label: "Híbrido" }
  ];

  const allFeatures = [
    "Aire acondicionado",
    "GPS",
    "Bluetooth",
    "Cámara de reversa",
    "Sensores de parqueo",
    "Asientos de cuero",
    "Techo corredizo",
    "Sistema de sonido premium",
    "USB/AUX",
    "Portaequipajes"
  ];

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleFeature = (feature) => {
    const currentFeatures = filters.features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    updateFilter("features", newFeatures);
  };

  const hasActiveFilters = filters.vehicleType !== "all" || 
    filters.transmission !== "all" || 
    filters.fuelType !== "all" ||
    filters.seats !== "all" ||
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 500 ||
    filters.startDate ||
    filters.endDate ||
    filters.location ||
    (filters.features && filters.features.length > 0) ||
    filters.commercialUse === true;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-11 px-4 rounded-xl border-gray-200 hover:border-teal-300 hover:bg-teal-50/50">
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
            {filters.startDate && filters.endDate ? (
              <span className="text-sm">
                {format(filters.startDate, "dd MMM", { locale: es })} - {format(filters.endDate, "dd MMM", { locale: es })}
              </span>
            ) : (
              <span className="text-gray-500">Fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: filters.startDate, to: filters.endDate }}
            onSelect={(range) => {
              updateFilter("startDate", range?.from);
              updateFilter("endDate", range?.to);
            }}
            locale={es}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
          />
        </PopoverContent>
      </Popover>

      {/* Vehicle Type */}
      <Select value={filters.vehicleType} onValueChange={(v) => updateFilter("vehicleType", v)}>
        <SelectTrigger className="w-[160px] h-11 rounded-xl border-gray-200 hover:border-teal-300">
          <SelectValue placeholder="Tipo de vehículo" />
        </SelectTrigger>
        <SelectContent>
          {vehicleTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* More Filters */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-11 rounded-xl border-gray-200 hover:border-teal-300 hover:bg-teal-50/50">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Más filtros
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 bg-teal-500 rounded-full" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[380px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Filtros avanzados</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <div className="space-y-6 pr-4">
              {/* Transmission */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Transmisión</Label>
                <Select value={filters.transmission} onValueChange={(v) => updateFilter("transmission", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transmissions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fuel Type */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Tipo de combustible</Label>
                <Select value={filters.fuelType || "all"} onValueChange={(v) => updateFilter("fuelType", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seats */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Número de asientos</Label>
                <Select value={filters.seats || "all"} onValueChange={(v) => updateFilter("seats", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="2">2 asientos</SelectItem>
                    <SelectItem value="4">4 asientos</SelectItem>
                    <SelectItem value="5">5 asientos</SelectItem>
                    <SelectItem value="7">7+ asientos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Precio por día: {getCurrencySymbol()}{filters.priceRange[0].toLocaleString()} - {getCurrencySymbol()}{filters.priceRange[1].toLocaleString()}
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(v) => updateFilter("priceRange", v)}
                  min={priceRange.min}
                  max={priceRange.max}
                  step={priceRange.step}
                  className="mt-2"
                />
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Ubicación</Label>
                <Input
                  placeholder="Ej: Porlamar, Pampatar..."
                  value={filters.location || ""}
                  onChange={(e) => updateFilter("location", e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Commercial Use */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                <Checkbox
                  id="commercial"
                  checked={filters.commercialUse || false}
                  onCheckedChange={(checked) => updateFilter("commercialUse", checked)}
                />
                <label htmlFor="commercial" className="text-sm font-medium cursor-pointer">
                  Solo vehículos para uso comercial (Uber, Yummy, InDriver)
                </label>
              </div>

              {/* Features */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Características</Label>
                <div className="space-y-2">
                  {allFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={(filters.features || []).includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <label htmlFor={feature} className="text-sm cursor-pointer">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full rounded-xl"
                onClick={() => {
                  onClearFilters();
                  setOpen(false);
                }}
              >
                Limpiar todos los filtros
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}