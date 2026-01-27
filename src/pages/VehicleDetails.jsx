import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Star, MapPin, Settings, Fuel, Users, Calendar as CalendarIcon,
  Shield, ChevronLeft, ChevronRight, User, MessageCircle, Check, X
} from "lucide-react";
import { format, differenceInDays, addDays, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StarRating from "@/components/ui/StarRating";
import { motion, AnimatePresence } from "framer-motion";

const vehicleTypeLabels = {
  sedan: "Sedán", suv: "SUV", pickup: "Pickup", van: "Van", motorcycle: "Moto", compact: "Compacto"
};
const transmissionLabels = { automatic: "Automático", manual: "Manual" };
const fuelLabels = { gasoline: "Gasolina", diesel: "Diésel", electric: "Eléctrico", hybrid: "Híbrido" };

export default function VehicleDetails() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("id");

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    if (!vehicleId) return;
    setIsLoading(true);

    const [vehicleData, reviewsData, auth] = await Promise.all([
      base44.entities.Vehicle.filter({ id: vehicleId }),
      base44.entities.Review.filter({ vehicle_id: vehicleId }, "-created_date"),
      base44.auth.isAuthenticated()
    ]);

    if (vehicleData.length > 0) {
      setVehicle(vehicleData[0]);
      
      // Load owner
      const owners = await base44.entities.User.filter({ email: vehicleData[0].owner_email });
      if (owners.length > 0) setOwner(owners[0]);
    }

    setReviews(reviewsData);
    setIsAuthenticated(auth);
    
    if (auth) {
      const user = await base44.auth.me();
      setCurrentUser(user);
    }

    setIsLoading(false);
  };

  const photos = vehicle?.photos?.length > 0 
    ? vehicle.photos 
    : ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800"];

  const blockedDates = vehicle?.blocked_dates?.map(d => new Date(d)) || [];

  const isDateDisabled = (date) => {
    if (date < new Date()) return true;
    const dateStr = date.toISOString().split("T")[0];
    return vehicle?.blocked_dates?.includes(dateStr);
  };

  const calculateTotal = () => {
    if (!dateRange.from || !dateRange.to || !vehicle) return null;
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const subtotal = days * vehicle.price_per_day;
    const platformFee = subtotal * 0.15; // 15% platform fee
    const total = subtotal + platformFee + vehicle.security_deposit;
    return { days, subtotal, platformFee, securityDeposit: vehicle.security_deposit, total };
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(createPageUrl(`VehicleDetails?id=${vehicleId}`));
      return;
    }
    
    const pricing = calculateTotal();
    if (!pricing) return;

    const bookingData = {
      vehicleId: vehicle.id,
      startDate: dateRange.from.toISOString().split("T")[0],
      endDate: dateRange.to.toISOString().split("T")[0],
      ...pricing
    };
    
    navigate(createPageUrl(`CreateBooking?data=${encodeURIComponent(JSON.stringify(bookingData))}`));
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando detalles..." />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vehículo no encontrado</p>
      </div>
    );
  }

  const pricing = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Back Button */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photos & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-200 aspect-[16/10]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentPhotoIndex}
                  src={photos[currentPhotoIndex]}
                  alt={vehicle.title}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPhotoIndex(i => (i + 1) % photos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPhotoIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentPhotoIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Vehicle Info */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-teal-100 text-teal-700 border-0">
                        {vehicleTypeLabels[vehicle.vehicle_type]}
                      </Badge>
                      {vehicle.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{vehicle.average_rating.toFixed(1)}</span>
                          <span className="text-gray-400">({vehicle.total_reviews})</span>
                        </div>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{vehicle.title}</h1>
                    <p className="text-gray-500">{vehicle.brand} {vehicle.model} • {vehicle.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">${vehicle.price_per_day}</p>
                    <p className="text-gray-500">por día</p>
                  </div>
                </div>

                {vehicle.location && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{vehicle.location}</span>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Transmisión</p>
                      <p className="font-medium">{transmissionLabels[vehicle.transmission]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Fuel className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Combustible</p>
                      <p className="font-medium">{fuelLabels[vehicle.fuel_type]}</p>
                    </div>
                  </div>
                  {vehicle.seats && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Asientos</p>
                        <p className="font-medium">{vehicle.seats}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Depósito</p>
                      <p className="font-medium">${vehicle.security_deposit}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {vehicle.features?.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold mb-3">Características</h3>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="rounded-full">
                            <Check className="w-3 h-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Description */}
                {vehicle.description && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold mb-3">Descripción</h3>
                      <p className="text-gray-600 whitespace-pre-line">{vehicle.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            {owner && (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Propietario</h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={owner.profile_image} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-lg">
                        {owner.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{owner.full_name}</p>
                      {owner.location && (
                        <p className="text-gray-500 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {owner.location}
                        </p>
                      )}
                      {owner.average_rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{owner.average_rating.toFixed(1)}</span>
                          <span className="text-gray-400">({owner.total_reviews} reseñas)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    {vehicle.average_rating?.toFixed(1)} · {vehicle.total_reviews} reseñas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="pb-4 border-b last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.renter_photo} />
                          <AvatarFallback>{review.renter_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.renter_name}</p>
                          <StarRating rating={review.rating} readonly size="sm" />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 ml-13">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg rounded-2xl sticky top-20">
              <CardContent className="p-6">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold">${vehicle.price_per_day}</span>
                  <span className="text-gray-500">/ día</span>
                </div>

                <div className="mb-6">
                  <p className="font-medium mb-3">Selecciona las fechas</p>
                  <div className="border rounded-xl p-2">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      locale={es}
                      disabled={isDateDisabled}
                      numberOfMonths={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {pricing && (
                  <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">${vehicle.price_per_day} x {pricing.days} días</span>
                      <span>${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tarifa de servicio</span>
                      <span>${pricing.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Depósito de seguridad</span>
                      <span>${pricing.securityDeposit.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  disabled={!pricing || (currentUser && currentUser.user_type === "owner" && currentUser.email === vehicle.owner_email)}
                  className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
                >
                  {!isAuthenticated ? "Iniciar sesión para reservar" : "Solicitar reserva"}
                </Button>

                {currentUser?.email === vehicle.owner_email && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    No puedes reservar tu propio vehículo
                  </p>
                )}

                <p className="text-center text-xs text-gray-400 mt-4">
                  No se te cobrará hasta que el propietario acepte tu solicitud
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}