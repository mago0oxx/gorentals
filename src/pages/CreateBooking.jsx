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
  AlertCircle, MapPin, Calendar, Package, DollarSign, Tag
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BookingCalendar from "@/components/booking/BookingCalendar";
import ExtrasSelector from "@/components/booking/ExtrasSelector";
import InsuranceSelector from "@/components/booking/InsuranceSelector";
import CouponInput from "@/components/booking/CouponInput";
import { NotificationService } from "@/components/notifications/notificationService";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useCurrency } from "@/components/currency/CurrencyContext";

const COMMISSION_RATE = 0.15;

export default function CreateBooking() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
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
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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

    // Pre-populate dates from URL params if available
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      setSelectedDates({
        startDate: startDateParam,
        endDate: endDateParam,
        days: days
      });
      setCurrentStep(2); // Skip to extras step since dates are already selected
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
    
    let totalBeforeDeposit = subtotal + platformFee + extrasTotal + insuranceCost;
    let discountAmount = 0;
    
    if (appliedCoupon) {
      discountAmount = appliedCoupon.discountAmount || 0;
      totalBeforeDeposit = Math.max(0, totalBeforeDeposit - discountAmount);
    }
    
    const total = totalBeforeDeposit + securityDeposit;
    const ownerPayout = subtotal - platformFee + extrasTotal - (discountAmount * 0.5); // Owner absorbs 50% of discount

    return {
      days,
      pricePerDay: vehicle.price_per_day,
      subtotal,
      platformFee,
      extrasTotal,
      insuranceCost,
      securityDeposit,
      discountAmount,
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
        setError(t('createBooking.datesBooked'));
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
        discount_amount: pricing.discountAmount || 0,
        coupon_code: appliedCoupon?.code || null,
        total_amount: pricing.total,
        owner_payout: pricing.ownerPayout,
        status: "pending",
        payment_status: "pending",
        pickup_location: vehicle.location,
        notes: notes
      });

      // Register coupon usage if applied
      if (appliedCoupon) {
        await Promise.all([
          base44.entities.CouponUsage.create({
            coupon_id: appliedCoupon.id,
            coupon_code: appliedCoupon.code,
            booking_id: newBooking.id,
            user_id: user.id,
            user_email: user.email,
            discount_amount: pricing.discountAmount,
            original_amount: pricing.subtotal + pricing.platformFee + pricing.extrasTotal + pricing.insuranceCost,
            final_amount: pricing.total - pricing.securityDeposit
          }),
          base44.entities.Coupon.update(appliedCoupon.id, {
            used_count: appliedCoupon.used_count + 1
          })
        ]);
      }

      await NotificationService.notifyNewBookingRequest(newBooking);

      navigate(createPageUrl(`BookingDetails?id=${newBooking.id}&success=true`));
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(t('createBooking.createError'));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text={t('createBooking.loading')} />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('createBooking.notAvailable')}</p>
      </div>
    );
  }

  const steps = [
    { number: 1, title: t('createBooking.dates'), icon: Calendar },
    { number: 2, title: t('createBooking.extras'), icon: Package },
    { number: 3, title: t('createBooking.confirm'), icon: CheckCircle }
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
            {t('createBooking.back')}
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('createBooking.selectDates')}</h1>
                    <p className="text-gray-500">{t('createBooking.chooseDates')}</p>
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
                    {t('createBooking.continueToExtras')}
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('createBooking.customizeBooking')}</h1>
                    <p className="text-gray-500">{t('createBooking.addExtras')}</p>
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

                  {/* Coupon Input */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">¿Tienes un cupón?</h3>
                    <CouponInput
                      totalAmount={pricing?.subtotal + pricing?.platformFee + pricing?.extrasTotal + pricing?.insuranceCost || 0}
                      vehicleType={vehicle.vehicle_type}
                      onCouponApplied={setAppliedCoupon}
                      onCouponRemoved={() => setAppliedCoupon(null)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 h-12 rounded-xl"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      {t('common.back')}
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedToStep3}
                      className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 rounded-xl"
                    >
                      {t('createBooking.continueToSummary')}
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('createBooking.confirmBooking')}</h1>
                    <p className="text-gray-500">{t('createBooking.reviewDetails')}</p>
                  </div>

                  {/* Notes */}
                  <Card className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-5">
                      <Label htmlFor="notes" className="text-base font-medium">
                        {t('createBooking.messageOwner')}
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder={t('createBooking.messagePlaceholder')}
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
                        <p className="font-medium text-blue-900 mb-1">{t('createBooking.howWorks')}</p>
                        <ul className="text-blue-700 space-y-1">
                          <li>{t('createBooking.step1')}</li>
                          <li>{t('createBooking.step2')}</li>
                          <li>{t('createBooking.step3')}</li>
                          <li>{t('createBooking.step4')}</li>
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
                      {t('common.back')}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t('createBooking.sending')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {t('createBooking.sendRequest')}
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    {t('createBooking.noChargeUntil')}
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
                    <CardTitle className="text-lg">{t('createBooking.costSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{formatPrice(pricing.pricePerDay)} × {pricing.days} {t('createBooking.days')}</span>
                      <span>{formatPrice(pricing.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('createBooking.serviceFee')}</span>
                      <span>{formatPrice(pricing.platformFee)}</span>
                    </div>
                    {pricing.extrasTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('createBooking.extras')}</span>
                        <span>{formatPrice(pricing.extrasTotal)}</span>
                      </div>
                    )}
                    {pricing.insuranceCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('createBooking.additionalInsurance')}</span>
                        <span>{formatPrice(pricing.insuranceCost)}</span>
                      </div>
                    )}
                    {pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          Descuento
                        </span>
                        <span>-{formatPrice(pricing.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Depósito
                      </span>
                      <span>{formatPrice(pricing.securityDeposit)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>{t('common.total')}</span>
                      <span className="text-teal-600">{formatPrice(pricing.total)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('createBooking.depositRefund')}
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