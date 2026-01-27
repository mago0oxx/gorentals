import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, MapPin, ChevronLeft, Loader2, CheckCircle, Shield, 
  CreditCard, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { NotificationService } from "@/components/notifications/notificationService";
import { motion } from "framer-motion";

export default function CreateBooking() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get("data");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl("Register"));
        return;
      }

      if (!dataParam) {
        navigate(createPageUrl("Browse"));
        return;
      }

      const data = JSON.parse(decodeURIComponent(dataParam));
      setBookingData(data);

      const [userData, vehicleData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Vehicle.filter({ id: data.vehicleId })
      ]);

      setUser(userData);
      
      if (vehicleData.length > 0) {
        setVehicle(vehicleData[0]);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos");
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!vehicle || !user || !bookingData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check for existing bookings on these dates
      const existingBookings = await base44.entities.Booking.filter({
        vehicle_id: vehicle.id
      });

      const requestedDates = [];
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        requestedDates.push(d.toISOString().split("T")[0]);
      }

      // Check if any dates conflict with existing approved/paid bookings
      const hasConflict = existingBookings.some(booking => {
        if (!["approved", "paid", "active"].includes(booking.status)) return false;
        
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        
        for (let d = new Date(bookingStart); d <= bookingEnd; d.setDate(d.getDate() + 1)) {
          if (requestedDates.includes(d.toISOString().split("T")[0])) {
            return true;
          }
        }
        return false;
      });

      if (hasConflict) {
        setError("Las fechas seleccionadas ya están reservadas. Por favor elige otras fechas.");
        setIsSubmitting(false);
        return;
      }

      // Create booking
      const newBooking = await base44.entities.Booking.create({
        vehicle_id: vehicle.id,
        vehicle_title: vehicle.title,
        vehicle_photo: vehicle.photos?.[0] || "",
        owner_id: vehicle.owner_id,
        owner_name: vehicle.owner_name,
        owner_email: vehicle.owner_email,
        renter_id: user.id,
        renter_name: user.full_name,
        renter_email: user.email,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        total_days: bookingData.days,
        price_per_day: vehicle.price_per_day,
        subtotal: bookingData.subtotal,
        platform_fee: bookingData.platformFee,
        security_deposit: bookingData.securityDeposit,
        total_amount: bookingData.total,
        owner_payout: bookingData.subtotal - bookingData.platformFee,
        status: "pending",
        payment_status: "pending",
        pickup_location: vehicle.location,
        notes: notes
      });

      // Send notification to owner
      await NotificationService.notifyNewBookingRequest(newBooking);

      navigate(createPageUrl(`BookingDetails?id=${newBooking.id}&success=true`));
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Error al crear la reserva. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando..." />;
  }

  if (!vehicle || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Datos de reserva no disponibles</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmar reserva</h1>
          <p className="text-gray-500 mb-8">Revisa los detalles antes de enviar tu solicitud</p>

          <div className="space-y-6">
            {/* Vehicle Summary */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-32 sm:h-auto">
                  <img
                    src={vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"}
                    alt={vehicle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="flex-1 p-5">
                  <h3 className="font-semibold text-lg">{vehicle.title}</h3>
                  <p className="text-gray-500">{vehicle.brand} {vehicle.model} • {vehicle.year}</p>
                  {vehicle.location && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {vehicle.location}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>

            {/* Dates */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium">Fechas de alquiler</p>
                    <p className="text-gray-500 text-sm">{bookingData.days} días</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Inicio</p>
                    <p className="font-medium">
                      {format(new Date(bookingData.startDate), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                  <div className="h-px w-8 bg-gray-300" />
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Fin</p>
                    <p className="font-medium">
                      {format(new Date(bookingData.endDate), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <Label htmlFor="notes" className="text-base font-medium">
                  Mensaje para el propietario (opcional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Cuéntale al propietario sobre tu viaje, hora de recogida preferida, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-3 rounded-xl resize-none"
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resumen de pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">${vehicle.price_per_day} x {bookingData.days} días</span>
                  <span>${bookingData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarifa de servicio</span>
                  <span>${bookingData.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Depósito de seguridad
                  </span>
                  <span>${bookingData.securityDeposit.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${bookingData.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  * El depósito de seguridad será retenido y devuelto después del alquiler
                </p>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">¿Cómo funciona?</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>1. Envías tu solicitud de reserva al propietario</li>
                    <li>2. El propietario revisa y aprueba tu solicitud</li>
                    <li>3. Una vez aprobada, recibirás instrucciones de pago</li>
                    <li>4. Después del pago, coordinas la recogida del vehículo</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando solicitud...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Enviar solicitud de reserva
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              No se te cobrará hasta que el propietario acepte tu solicitud
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}