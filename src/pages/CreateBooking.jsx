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
  ChevronLeft, ChevronRight, Loader2, CheckCircle, Shield, 
  AlertCircle, MapPin, Calendar, Package, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BookingCalendar from "@/components/booking/BookingCalendar";
import ExtrasSelector from "@/components/booking/ExtrasSelector";
import InsuranceSelector from "@/components/booking/InsuranceSelector";
import { NotificationService } from "@/components/notifications/notificationService";
import { motion, AnimatePresence } from "framer-motion";

const COMMISSION_RATE = 0.15;

export default function CreateBooking() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);

  // Booking data
  const [selectedDates, setSelectedDates] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [insurance, setInsurance] = useState({ type: "none", cost: 0 });
  const [notes, setNotes] = useState("");

  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("id");
  const startDateParam = params.get("startDate");
  const endDateParam = params.get("endDate");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      navigate(createPageUrl("Register"));
      return;
    }

    if (!vehicleId) {
      navigate(createPageUrl("Browse"));
      return;
    }

    const [userData, vehicleData] = await Promise.all([
      base44.auth.me(),
      base44.entities.Vehicle.filter({ id: vehicleId })
    ]);

    setUser(userData);
    
    if (vehicleData.length > 0) {
      setVehicle(vehicleData[0]);
    }

    setIsLoading(false);
  };

  const calculatePricing = () => {
    if (!vehicle || !selectedDates) return null;

    const days = selectedDates.days;
    const subtotal = vehicle.price_per_day * days;
    const platformFee = subtotal * COMMISSION_RATE;
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.total, 0);
    const insuranceCost = insurance.cost;
    const securityDeposit = vehicle.security_deposit || 0;
    const total = subtotal + platformFee + extrasTotal + insuranceCost + securityDeposit;
    const ownerPayout = subtotal - platformFee + extrasTotal;

    return {
      days,
      pricePerDay: vehicle.price_per_day,
      subtotal,
      platformFee,
      extrasTotal,
      insuranceCost,
      securityDeposit,
      total,
      ownerPayout
    };
  };

  const pricing = calculatePricing();

  const canProceedToStep2 = selectedDates !== null;
  const canProceedToStep3 = canProceedToStep2;

  const handleSubmit = async () => {
    if (!vehicle || !user || !selectedDates || !pricing) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check for conflicts
      const existingBookings = await base44.entities.Booking.filter({
        vehicle_id: vehicle.id
      });

      const requestedDates = [];
      const start = new Date(selectedDates.startDate);
      const end = new Date(selectedDates.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        requestedDates.push(d.toISOString().split("T")[0]);
      }

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
        start_date: selectedDates.startDate,
        end_date: selectedDates.endDate,
        total_days: pricing.days,
        price_per_day: vehicle.price_per_day,
        subtotal: pricing.subtotal,
        platform_fee: pricing.platformFee,
        security_deposit: pricing.securityDeposit,
        selected_extras: selectedExtras,
        extras_total: pricing.extrasTotal,
        insurance_type: insurance.type,
        insurance_cost: insurance.cost,
        total_amount: pricing.total,
        owner_payout: pricing.ownerPayout,
        status: "pending",
        payment_status: "pending",
        pickup_location: vehicle.location,
        notes: notes
      });

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

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vehículo no disponible</p>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Fechas", icon: Calendar },
    { number: 2, title: "Extras", icon: Package },
    { number: 3, title: "Confirmar", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive ? "bg-teal-600 text-white" :
                    isCompleted ? "bg-green-500 text-white" :
                    "bg-gray-200 text-gray-400"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs mt-2 ${
                    isActive ? "text-teal-600 font-medium" :
                    isCompleted ? "text-green-600" :
                    "text-gray-400"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-all ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Dates */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Selecciona las fechas</h1>
                    <p className="text-gray-500">Elige cuándo necesitas el vehículo</p>
                  </div>

                  <BookingCalendar
                    blockedDates={vehicle.blocked_dates || []}
                    onDateSelect={setSelectedDates}
                  />

                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 rounded-xl"
                  >
                    Continuar a extras
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Extras & Insurance */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Personaliza tu reserva</h1>
                    <p className="text-gray-500">Agrega extras y protección adicional</p>
                  </div>

                  <ExtrasSelector
                    extras={vehicle.extras || []}
                    totalDays={selectedDates?.days || 1}
                    onExtrasChange={setSelectedExtras}
                  />

                  <InsuranceSelector
                    totalDays={selectedDates?.days || 1}
                    onInsuranceChange={setInsurance}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 h-12 rounded-xl"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Atrás
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedToStep3}
                      className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 rounded-xl"
                    >
                      Continuar a resumen
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmar reserva</h1>
                    <p className="text-gray-500">Revisa los detalles antes de enviar</p>
                  </div>

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

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">¿Cómo funciona?</p>
                        <ul className="text-blue-700 space-y-1">
                          <li>1. Envías tu solicitud al propietario</li>
                          <li>2. El propietario revisa y aprueba</li>
                          <li>3. Recibirás instrucciones de pago</li>
                          <li>4. Coordinas la recogida del vehículo</li>
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

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 h-12 rounded-xl"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Atrás
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Enviar solicitud
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    No se te cobrará hasta que el propietario acepte
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Vehicle Card */}
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <img
                  src={vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"}
                  alt={vehicle.title}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <h3 className="font-semibold">{vehicle.title}</h3>
                  <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                  {vehicle.location && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {vehicle.location}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Summary */}
              {pricing && (
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Resumen de costos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">${pricing.pricePerDay} × {pricing.days} días</span>
                      <span>${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tarifa de servicio</span>
                      <span>${pricing.platformFee.toFixed(2)}</span>
                    </div>
                    {pricing.extrasTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extras</span>
                        <span>${pricing.extrasTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.insuranceCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Seguro adicional</span>
                        <span>${pricing.insuranceCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Depósito
                      </span>
                      <span>${pricing.securityDeposit.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-teal-600">${pricing.total.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      * El depósito será devuelto después del alquiler
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}