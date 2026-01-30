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
  Shield, ChevronLeft, ChevronRight, User, MessageCircle, Check, X, Briefcase
} from "lucide-react";
import { format, differenceInDays, addDays, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StarRating from "@/components/ui/StarRating";
import VehicleLocationMap from "@/components/maps/VehicleLocationMap";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/i18n/LanguageContext";

const getVehicleTypeLabels = (t) => ({
  sedan: "Sedán", suv: "SUV", pickup: "Pickup", van: "Van", motorcycle: "Moto", compact: "Compacto"
});
const getTransmissionLabels = (t) => ({ automatic: "Automático", manual: "Manual" });
const getFuelLabels = (t) => ({ gasoline: "Gasolina", diesel: "Diésel", electric: "Eléctrico", hybrid: "Híbrido" });

export default function VehicleDetails() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const vehicleTypeLabels = getVehicleTypeLabels(t);
  const transmissionLabels = getTransmissionLabels(t);
  const fuelLabels = getFuelLabels(t);
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
    if (!vehicleId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      const [vehicleData, reviewsData, auth] = await Promise.all([
        base44.entities.Vehicle.filter({ id: vehicleId }),
        base44.entities.Review.filter({ vehicle_id: vehicleId }, "-created_date"),
        base44.auth.isAuthenticated()
      ]);

      if (vehicleData.length > 0) {
        setVehicle(vehicleData[0]);
        
        // Load owner info if available
        try {
          const owners = await base44.entities.User.filter({ email: vehicleData[0].owner_email });
          if (owners.length > 0) setOwner(owners[0]);
        } catch (err) {
          console.log("Owner user not found, using vehicle data");
        }
      }

      setReviews(reviewsData);
      setIsAuthenticated(auth);
      
      if (auth) {
        try {
          const user = await base44.auth.me();
          setCurrentUser(user);
        } catch (err) {
          console.log("Error loading user");
        }
      }
    } catch (error) {
      console.error("Error loading vehicle data:", error);
    } finally {
      setIsLoading(false);
    }
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
    if (!dateRange || !dateRange.from || !dateRange.to || !vehicle) return null;
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
    if (!pricing || !dateRange || !dateRange.from || !dateRange.to) return;

    const startDate = dateRange.from.toISOString().split("T")[0];
    const endDate = dateRange.to.toISOString().split("T")[0];
    
    navigate(createPageUrl(`CreateBooking?id=${vehicle.id}&startDate=${startDate}&endDate=${endDate}`));
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text={t('vehicleDetails.loading')} />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('vehicleDetails.notFound')}</p>
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
            {t('vehicleDetails.back')}
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
                    <p className="text-gray-500">{t('vehicleDetails.perDay')}</p>
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
                      <p className="text-xs text-gray-500">{t('vehicleDetails.transmission')}</p>
                      <p className="font-medium">{transmissionLabels[vehicle.transmission]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Fuel className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('vehicleDetails.fuel')}</p>
                      <p className="font-medium">{fuelLabels[vehicle.fuel_type]}</p>
                    </div>
                  </div>
                  {vehicle.seats && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{t('vehicleDetails.seats')}</p>
                        <p className="font-medium">{vehicle.seats}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('vehicleDetails.deposit')}</p>
                      <p className="font-medium">${vehicle.security_deposit}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {vehicle.features?.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold mb-3">{t('vehicleDetails.features')}</h3>
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

                {/* Commercial Use */}
                {vehicle.allow_commercial_use && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                      <Briefcase className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">{t('vehicleDetails.commercialUseAllowed')}</p>
                        <p className="text-sm text-green-700">{t('vehicleDetails.commercialUseDesc')}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Description */}
                {vehicle.description && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold mb-3">{t('vehicleDetails.description')}</h3>
                      <p className="text-gray-600 whitespace-pre-line">{vehicle.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  {t('vehicleDetails.pickupLocation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-6">
                <VehicleLocationMap 
                  vehicle={vehicle} 
                  height="400px"
                  zoom={13}
                  showPopup={false}
                />
                <div className="px-6 pt-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.location}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('vehicleDetails.coordinateWithOwner')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">{t('vehicleDetails.owner')}</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={owner?.profile_image} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-lg">
                      {(owner?.full_name || vehicle.owner_name)?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{owner?.full_name || vehicle.owner_name}</p>
                    {(owner?.location || vehicle.location) && (
                      <p className="text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {owner?.location || vehicle.location}
                      </p>
                    )}
                    {owner?.average_rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{owner.average_rating.toFixed(1)}</span>
                        <span className="text-gray-400">({owner.total_reviews} {t('vehicleDetails.reviews')})</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    {vehicle.average_rating?.toFixed(1)} · {vehicle.total_reviews} {t('vehicleDetails.reviews')}
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
                  <span className="text-gray-500">/ {t('vehicleDetails.perDay')}</span>
                </div>

                <div className="mb-6">
                  <p className="font-medium mb-3">{t('vehicleDetails.selectDates')}</p>
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
                      <span className="text-gray-600">${vehicle.price_per_day} x {pricing.days} {t('vehicleDetails.days')}</span>
                      <span>${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('vehicleDetails.serviceFee')}</span>
                      <span>${pricing.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('vehicleDetails.securityDeposit')}</span>
                      <span>${pricing.securityDeposit.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>{t('vehicleDetails.total')}</span>
                      <span>${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  disabled={!pricing || (currentUser && currentUser.user_type === "owner" && currentUser.email === vehicle.owner_email)}
                  className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
                >
                  {!isAuthenticated ? t('vehicleDetails.loginToBook') : t('vehicleDetails.requestBooking')}
                </Button>

                {currentUser?.email === vehicle.owner_email && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    {t('vehicleDetails.cantBookOwn')}
                  </p>
                )}

                <p className="text-center text-xs text-gray-400 mt-4">
                  {t('vehicleDetails.noChargeUntil')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}