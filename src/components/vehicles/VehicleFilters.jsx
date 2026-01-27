import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function VehicleFilters({ filters, onFiltersChange, onClearFilters }) {
  const [open, setOpen] = useState(false);

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

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.vehicleType !== "all" || 
    filters.transmission !== "all" || 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 500 ||
    filters.startDate ||
    filters.endDate;

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
        <SheetContent className="w-[320px]">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
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

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Precio por día: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(v) => updateFilter("priceRange", v)}
                min={0}
                max={500}
                step={10}
                className="mt-2"
              />
            </div>

            <Button 
              variant="outline" 
              className="w-full rounded-xl"
              onClick={() => {
                onClearFilters();
                setOpen(false);
              }}
            >
              Limpiar filtros
            </Button>
          </div>
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