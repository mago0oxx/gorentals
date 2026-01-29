import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function BookingCalendar({ blockedDates = [], onDateSelect }) {
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const handleSelect = (range) => {
    setDateRange(range || { from: null, to: null });
    
    if (range?.from && range?.to) {
      const days = differenceInDays(range.to, range.from) + 1;
      onDateSelect({
        startDate: range.from.toISOString().split("T")[0],
        endDate: range.to.toISOString().split("T")[0],
        days
      });
    } else {
      onDateSelect(null);
    }
  };

  const isDateDisabled = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || blockedDates.includes(dateStr);
  };

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-medium">Selecciona tus fechas</p>
            <p className="text-gray-500 text-sm">Elige cuándo necesitas el vehículo</p>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            numberOfMonths={1}
            locale={es}
            className="rounded-xl border"
          />
        </div>

        {dateRange?.from && dateRange?.to && (
          <div className="p-4 bg-teal-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-700 mb-1">Fecha de inicio</p>
                <p className="font-medium text-teal-900">
                  {format(dateRange.from, "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <div className="h-px w-8 bg-teal-300" />
              <div className="text-right">
                <p className="text-xs text-teal-700 mb-1">Fecha de fin</p>
                <p className="font-medium text-teal-900">
                  {format(dateRange.to, "d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
            <Badge className="mt-3 bg-teal-600 text-white border-0">
              {differenceInDays(dateRange.to, dateRange.from) + 1} días seleccionados
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-200" />
            <span>No disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-teal-500" />
            <span>Seleccionado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}