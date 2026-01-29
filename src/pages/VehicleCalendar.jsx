import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2, Save, Info, Calendar as CalendarIcon, User } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { motion } from "framer-motion";

export default function VehicleCalendar() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("id");

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    if (!vehicleId) {
      navigate(createPageUrl("MyVehicles"));
      return;
    }

    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      navigate(createPageUrl("Register"));
      return;
    }

    const user = await base44.auth.me();

    const [vehicleData, bookingData] = await Promise.all([
      base44.entities.Vehicle.filter({ id: vehicleId }),
      base44.entities.Booking.filter({ vehicle_id: vehicleId })
    ]);

    if (vehicleData.length === 0 || vehicleData[0].owner_email !== user.email) {
      navigate(createPageUrl("MyVehicles"));
      return;
    }

    setVehicle(vehicleData[0]);
    setBlockedDates((vehicleData[0].blocked_dates || []).map(d => new Date(d)));
    setBookings(bookingData.filter(b => ["approved", "paid", "active"].includes(b.status)));
    setIsLoading(false);
  };

  const getBookedDates = () => {
    const dates = [];
    bookings.forEach(booking => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    });
    return dates;
  };

  const bookedDates = getBookedDates();

  const isDateBooked = (date) => {
    return bookedDates.some(d => isSameDay(d, date));
  };

  const isDateBlocked = (date) => {
    return blockedDates.some(d => isSameDay(d, date));
  };

  const toggleDate = (date) => {
    if (isDateBooked(date) || date < new Date()) return;

    const dateStr = format(date, "yyyy-MM-dd");
    
    if (isDateBlocked(date)) {
      setBlockedDates(prev => prev.filter(d => !isSameDay(d, date)));
    } else {
      setBlockedDates(prev => [...prev, date]);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const blockedDateStrings = blockedDates.map(d => format(d, "yyyy-MM-dd"));
    
    await base44.entities.Vehicle.update(vehicleId, {
      blocked_dates: blockedDateStrings
    });

    setHasChanges(false);
    setIsSaving(false);
  };

  const modifiers = {
    booked: bookedDates,
    blocked: blockedDates,
    past: (date) => date < new Date()
  };

  const modifiersStyles = {
    booked: { backgroundColor: "#dcfce7", color: "#166534", fontWeight: "bold" },
    blocked: { backgroundColor: "#fee2e2", color: "#991b1b", textDecoration: "line-through" }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando calendario..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("MyVehicles"))}
              className="text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Disponibilidad</h1>
              <p className="text-sm text-gray-500">{vehicle?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Profile"))}
              className="rounded-xl"
            >
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </Button>
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Legend */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span className="text-sm text-gray-600">Reservado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span className="text-sm text-gray-600">Bloqueado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-white border border-gray-200" />
                  <span className="text-sm text-gray-600">Disponible</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Gestiona tu disponibilidad</p>
                <p>Haz clic en las fechas para bloquearlas o desbloquearlas. Las fechas bloqueadas no aparecerán como disponibles para los arrendatarios.</p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Calendario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={blockedDates}
                onDayClick={toggleDate}
                locale={es}
                numberOfMonths={2}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                disabled={(date) => date < new Date() || isDateBooked(date)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          {bookings.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Reservas próximas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">{booking.renter_name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(booking.start_date), "d MMM", { locale: es })} - {format(new Date(booking.end_date), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0">
                      {booking.total_days} días
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}