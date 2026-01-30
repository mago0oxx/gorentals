import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/i18n/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar, MapPin, ChevronLeft, CheckCircle, XCircle, Clock,
  Phone, Mail, User, Car, Shield, Loader2, Star, MessageCircle, AlertTriangle, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StarRating from "@/components/ui/StarRating";
import { NotificationService } from "@/components/notifications/notificationService";
import PaymentButton from "@/components/payments/PaymentButton";
import VehicleHistoryCard from "@/components/booking/VehicleHistoryCard";
import DeliveryRulesCard from "@/components/booking/DeliveryRulesCard";
import CancellationPolicyCard from "@/components/booking/CancellationPolicyCard";
import { motion } from "framer-motion";

const getStatusConfig = (t) => ({
  pending: { label: t('booking.pending'), color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: t('booking.approved'), color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  rejected: { label: t('booking.rejected'), color: "bg-red-100 text-red-700", icon: XCircle },
  paid: { label: t('booking.paid'), color: "bg-green-100 text-green-700", icon: CheckCircle },
  active: { label: t('booking.active'), color: "bg-teal-100 text-teal-700", icon: Car },
  completed: { label: t('booking.completed'), color: "bg-gray-100 text-gray-700", icon: CheckCircle },
  cancelled: { label: t('booking.cancelled'), color: "bg-red-100 text-red-700", icon: XCircle }
});

export default function BookingDetails() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(t);
  const [booking, setBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  
  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("id");
  const success = params.get("success");

  useEffect(() => {
    if (success === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    loadData();
  }, [bookingId]);

  const loadData = async () => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const [userData, bookingData] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Booking.filter({ id: bookingId })
      ]);

      setUser(userData);
      
      if (bookingData.length > 0) {
        setBooking(bookingData[0]);
        
        // Check for existing review
        if (userData) {
          const reviews = await base44.entities.Review.filter({
            booking_id: bookingId,
            renter_id: userData.id
          });
          if (reviews.length > 0) {
            setExistingReview(reviews[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading booking data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateConversation = async () => {
    if (!booking || !user) return null;

    // Check if conversation exists
    const existingConvs = await base44.entities.Conversation.filter({
      booking_id: booking.id
    });

    if (existingConvs.length > 0) {
      return existingConvs[0];
    }

    // Create new conversation
    const newConv = await base44.entities.Conversation.create({
      booking_id: booking.id,
      vehicle_id: booking.vehicle_id,
      vehicle_title: booking.vehicle_title,
      owner_id: booking.owner_id,
      owner_email: booking.owner_email,
      owner_name: booking.owner_name,
      renter_id: booking.renter_id,
      renter_email: booking.renter_email,
      renter_name: booking.renter_name
    });

    return newConv;
  };

  const handleOpenChat = async () => {
    const conversation = await getOrCreateConversation();
    if (conversation) {
      navigate(createPageUrl(`Chat?id=${conversation.id}`));
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    
    await base44.entities.Booking.update(booking.id, {
      status: newStatus
    });

    // If approved, block the dates on the vehicle
    if (newStatus === "approved") {
      const vehicle = await base44.entities.Vehicle.filter({ id: booking.vehicle_id });
      if (vehicle.length > 0) {
        const currentBlocked = vehicle[0].blocked_dates || [];
        const newBlockedDates = [];
        
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          if (!currentBlocked.includes(dateStr)) {
            newBlockedDates.push(dateStr);
          }
        }
        
        await base44.entities.Vehicle.update(booking.vehicle_id, {
          blocked_dates: [...currentBlocked, ...newBlockedDates]
        });
      }
      await NotificationService.notifyBookingApproved(booking);
    } else if (newStatus === "rejected") {
      await NotificationService.notifyBookingRejected(booking);
    } else if (newStatus === "paid") {
      await NotificationService.notifyBookingPaid(booking);
    }

    await loadData();
    setIsUpdating(false);
  };

  const handleCompleteBooking = async () => {
    setIsUpdating(true);
    
    await base44.entities.Booking.update(booking.id, {
      status: "completed"
    });

    // Update owner earnings
    const owners = await base44.entities.User.filter({ email: booking.owner_email });
    if (owners.length > 0) {
      await base44.entities.User.update(owners[0].id, {
        total_earnings: (owners[0].total_earnings || 0) + booking.owner_payout
      });
    }

    // Update vehicle stats
    const vehicles = await base44.entities.Vehicle.filter({ id: booking.vehicle_id });
    if (vehicles.length > 0) {
      await base44.entities.Vehicle.update(booking.vehicle_id, {
        total_bookings: (vehicles[0].total_bookings || 0) + 1
      });
    }

    // Mark owner payout as completed
    const ownerPayouts = await base44.entities.Transaction.filter({
      booking_id: booking.id,
      user_email: booking.owner_email,
      type: "payout"
    });
    if (ownerPayouts.length > 0) {
      await base44.entities.Transaction.update(ownerPayouts[0].id, { status: "completed" });
    }

    // Release security deposit
    const depositHolds = await base44.entities.Transaction.filter({
      booking_id: booking.id,
      type: "deposit_hold"
    });
    if (depositHolds.length > 0) {
      await base44.entities.Transaction.update(depositHolds[0].id, { status: "completed" });
      // Create deposit release transaction
      await base44.entities.Transaction.create({
        booking_id: booking.id,
        user_email: booking.renter_email,
        user_role: "renter",
        type: "deposit_release",
        amount: booking.security_deposit,
        status: "completed",
        description: `Devolución de depósito - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title
      });
    }

    // Send notifications
    await NotificationService.notifyBookingCompleted(booking);

    await loadData();
    setIsUpdating(false);
  };

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true);

    await base44.entities.Review.create({
      booking_id: booking.id,
      vehicle_id: booking.vehicle_id,
      owner_id: booking.owner_id,
      renter_id: user.id,
      renter_name: user.full_name,
      renter_photo: user.profile_image,
      rating: review.rating,
      comment: review.comment
    });

    // Update vehicle average rating
    const allReviews = await base44.entities.Review.filter({ vehicle_id: booking.vehicle_id });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await base44.entities.Vehicle.update(booking.vehicle_id, {
      average_rating: avgRating,
      total_reviews: allReviews.length
    });

    setShowReviewForm(false);
    await loadData();
    setIsSubmittingReview(false);
  };

  const calculateRefund = (booking) => {
    if (booking.status === "pending" || booking.status === "approved") {
      // No payment made yet
      return 0;
    }

    const startDate = new Date(booking.start_date);
    const today = new Date();
    const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    // Cancellation policies
    if (daysUntilStart >= 7) {
      // 7+ days: full refund (minus platform fee)
      return booking.subtotal + booking.security_deposit;
    } else if (daysUntilStart >= 3) {
      // 3-6 days: 50% refund + deposit
      return (booking.subtotal * 0.5) + booking.security_deposit;
    } else if (daysUntilStart >= 1) {
      // 1-2 days: deposit only
      return booking.security_deposit;
    } else {
      // Same day or past: no refund
      return 0;
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);

    const refund = calculateRefund(booking);
    const canceller = isOwner ? "owner" : "renter";

    // Update booking status
    await base44.entities.Booking.update(booking.id, {
      status: "cancelled",
      cancelled_by: canceller,
      cancellation_reason: cancelReason
    });

    // If paid, process refund
    if (booking.status === "paid" || booking.status === "active") {
      // Create refund transaction for renter
      await base44.entities.Transaction.create({
        booking_id: booking.id,
        user_email: booking.renter_email,
        user_role: "renter",
        type: "refund",
        amount: refund,
        status: "completed",
        description: `Reembolso por cancelación - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title,
        metadata: {
          cancelled_by: canceller,
          cancellation_reason: cancelReason,
          original_amount: booking.total_amount
        }
      });

      // Update payment transaction to refunded
      const payments = await base44.entities.Transaction.filter({
        booking_id: booking.id,
        type: "payment",
        user_email: booking.renter_email
      });
      if (payments.length > 0) {
        await base44.entities.Transaction.update(payments[0].id, {
          status: "refunded"
        });
      }

      // Cancel pending owner payout if exists
      const payouts = await base44.entities.Transaction.filter({
        booking_id: booking.id,
        type: "payout",
        user_email: booking.owner_email
      });
      if (payouts.length > 0) {
        await base44.entities.Transaction.update(payouts[0].id, {
          status: "cancelled"
        });
      }
    }

    // Unblock dates on vehicle
    if (booking.status === "approved" || booking.status === "paid" || booking.status === "active") {
      const vehicles = await base44.entities.Vehicle.filter({ id: booking.vehicle_id });
      if (vehicles.length > 0) {
        const currentBlocked = vehicles[0].blocked_dates || [];
        const datesToUnblock = [];
        
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          datesToUnblock.push(d.toISOString().split("T")[0]);
        }
        
        const newBlockedDates = currentBlocked.filter(date => !datesToUnblock.includes(date));
        
        await base44.entities.Vehicle.update(booking.vehicle_id, {
          blocked_dates: newBlockedDates
        });
      }
    }

    // Send notification
    const notificationMessage = isOwner 
      ? `Tu reserva de ${booking.vehicle_title} fue cancelada por el propietario.`
      : `La reserva de ${booking.vehicle_title} fue cancelada por el arrendatario.`;
    
    await base44.entities.Notification.create({
      user_email: isOwner ? booking.renter_email : booking.owner_email,
      title: "Reserva cancelada",
      message: notificationMessage + (refund > 0 ? ` Reembolso: $${refund.toFixed(2)}` : ""),
      type: "booking_cancelled",
      booking_id: booking.id
    });

    setShowCancelDialog(false);
    setIsCancelling(false);
    await loadData();
  };

  const openCancelDialog = () => {
    const refund = calculateRefund(booking);
    setRefundAmount(refund);
    setShowCancelDialog(true);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text={t('bookingDetails.loading')} />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('bookingDetails.notFound')}</p>
      </div>
    );
  }

  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const isOwner = user?.email === booking.owner_email;
  const isRenter = user?.email === booking.renter_email;
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      {showSuccess && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 bg-green-500 text-white py-4 px-4 text-center z-50"
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>¡Solicitud de reserva enviada exitosamente!</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </Button>
          <Badge className={`${status.color} border-0`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Vehicle Card */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <Link to={createPageUrl(`VehicleDetails?id=${booking.vehicle_id}`)} className="sm:w-48 h-32 sm:h-auto">
              <img
                src={booking.vehicle_photo || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"}
                alt={booking.vehicle_title}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </Link>
            <CardContent className="flex-1 p-5">
              <Link to={createPageUrl(`VehicleDetails?id=${booking.vehicle_id}`)}>
                <h2 className="font-semibold text-xl hover:text-teal-600 transition-colors">
                  {booking.vehicle_title}
                </h2>
              </Link>
              {booking.pickup_location && (
                <div className="flex items-center gap-1 mt-2 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {booking.pickup_location}
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
                <p className="text-gray-500 text-sm">{booking.total_days} días</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 mb-1">Inicio</p>
                <p className="font-medium">
                  {format(new Date(booking.start_date), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <div className="h-px w-8 bg-gray-300" />
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Fin</p>
                <p className="font-medium">
                  {format(new Date(booking.end_date), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info & Chat */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {isOwner ? "Información del arrendatario" : "Información del propietario"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{isOwner ? booking.renter_name : booking.owner_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${isOwner ? booking.renter_email : booking.owner_email}`} className="text-teal-600 hover:underline">
                  {isOwner ? booking.renter_email : booking.owner_email}
                </a>
              </div>
            </div>

            <Separator />

            {/* Chat Button */}
            <Button
              onClick={handleOpenChat}
              variant="outline"
              className="w-full border-teal-200 text-teal-600 hover:bg-teal-50 rounded-xl h-12"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar mensaje
            </Button>

            {!isOwner && (
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                <p className="text-sm text-teal-800">
                  <strong>Coordina con el propietario:</strong> Usa el chat para confirmar la ubicación exacta y horario de recogida del vehículo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Mensaje del arrendatario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{booking.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Resumen de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Alquiler</span>
                <span className="font-medium">${booking.price_per_day}/día × {booking.total_days} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal de alquiler</span>
                <span className="font-semibold">${booking.subtotal?.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tarifa de servicio (15%)</span>
                <span>${booking.platform_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Depósito de seguridad</span>
                </div>
                <span className="font-medium text-blue-600">${booking.security_deposit?.toFixed(2)}</span>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                El depósito se devuelve automáticamente tras la inspección final del vehículo.
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total a pagar</span>
              <span className="font-bold text-teal-600">${booking.total_amount?.toFixed(2)}</span>
            </div>
            
            {isOwner && (
              <>
                <Separator />
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-green-800">Tu ganancia</span>
                    <span className="text-2xl font-bold text-green-700">${booking.owner_payout?.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-green-700">
                    Recibirás este monto después de completar la reserva exitosamente.
                  </p>
                </div>
              </>
            )}
            
            {!isOwner && booking.status === "pending" && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Nota:</strong> El pago se realizará solo después de que el propietario apruebe tu solicitud.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle History (Owner only) */}
        {isOwner && (
          <VehicleHistoryCard vehicleId={booking.vehicle_id} ownerId={booking.owner_id} />
        )}

        {/* Cancellation Policy */}
        {!["completed", "cancelled", "rejected"].includes(booking.status) && (
          <CancellationPolicyCard booking={booking} isOwner={isOwner} />
        )}

        {/* Delivery Rules */}
        {(booking.status === "paid" || booking.status === "active") && (
          <DeliveryRulesCard isOwner={isOwner} />
        )}

        {/* Actions for Owner or Admin */}
        {(isOwner || isAdmin) && booking.status === "pending" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">{isAdmin ? "Acciones del administrador" : "Acciones del propietario"}</h3>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Aprobar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Rechazar esta solicitud?</AlertDialogTitle>
                      <AlertDialogDescription>
                        El arrendatario será notificado de tu decisión.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusUpdate("rejected")}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Rechazar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay Button (Renter) */}
        {isRenter && booking.status === "approved" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
                <p className="text-green-800 font-medium">¡Tu reserva fue aprobada!</p>
                <p className="text-green-700 text-sm mt-1">
                  Completa el pago para confirmar tu reserva.
                </p>
              </div>
              <PaymentButton booking={booking} onPaymentComplete={loadData} />
            </CardContent>
          </Card>
        )}

        {/* Waiting for Payment (Owner or Admin) */}
        {(isOwner || isAdmin) && booking.status === "approved" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-blue-800 font-medium">Esperando pago</p>
                <p className="text-blue-700 text-sm mt-1">
                  El arrendatario debe completar el pago para confirmar la reserva.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mark as Active (Owner or Admin) */}
        {(isOwner || isAdmin) && booking.status === "paid" && (
          <Card className="border-0 shadow-sm rounded-2xl border-teal-200">
            <CardContent className="p-5 space-y-4">
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                <h4 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Antes de entregar el vehículo
                </h4>
                <ul className="space-y-1 text-sm text-teal-800">
                  <li>✓ Verifica la identidad del arrendatario (licencia + ID)</li>
                  <li>✓ Revisa el vehículo junto con el arrendatario</li>
                  <li>✓ Toma fotos del estado actual (interior/exterior)</li>
                  <li>✓ Confirma que todos los documentos estén en orden</li>
                  <li>✓ Explica el funcionamiento básico del vehículo</li>
                </ul>
              </div>
              <Button
                onClick={() => handleStatusUpdate("active")}
                disabled={isUpdating}
                className="w-full bg-teal-600 hover:bg-teal-700 h-12"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
                Confirmar entrega del vehículo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete Booking (Owner or Admin) */}
        {(isOwner || isAdmin) && booking.status === "active" && (
          <Card className="border-0 shadow-sm rounded-2xl border-green-200">
            <CardContent className="p-5 space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Antes de completar la reserva
                </h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>✓ Inspecciona el vehículo junto con el arrendatario</li>
                  <li>✓ Verifica que no haya daños nuevos</li>
                  <li>✓ Confirma el nivel de combustible acordado</li>
                  <li>✓ Revisa que todos los accesorios estén completos</li>
                  <li>✓ Toma fotos del estado de devolución</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-sm text-blue-800">
                  Al completar, recibirás <strong>${booking.owner_payout?.toFixed(2)}</strong> en tu cuenta y se liberará el depósito del arrendatario.
                </p>
              </div>
              <Button
                onClick={handleCompleteBooking}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmar devolución y completar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Section (Renter) */}
        {isRenter && booking.status === "completed" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                {existingReview ? "Tu reseña" : "Deja una reseña"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingReview ? (
                <div>
                  <StarRating rating={existingReview.rating} readonly />
                  {existingReview.comment && (
                    <p className="mt-3 text-gray-600">{existingReview.comment}</p>
                  )}
                </div>
              ) : showReviewForm ? (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Calificación</Label>
                    <StarRating
                      rating={review.rating}
                      onRatingChange={(r) => setReview({ ...review, rating: r })}
                      size="lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comment" className="mb-2 block">Comentario (opcional)</Label>
                    <Textarea
                      id="comment"
                      value={review.comment}
                      onChange={(e) => setReview({ ...review, comment: e.target.value })}
                      placeholder="Comparte tu experiencia..."
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                    >
                      {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar reseña"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Escribir reseña
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancel Booking Button */}
        {(isRenter || isOwner) && !["completed", "cancelled", "rejected"].includes(booking.status) && (
          <Card className="border-0 shadow-sm rounded-2xl border-red-200">
            <CardContent className="p-5">
              <Button
                onClick={openCancelDialog}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-12"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar reserva
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Cancelar reserva
            </DialogTitle>
            <DialogDescription>
              Esta acción cancelará la reserva permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Refund Policy */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h4 className="font-medium text-sm">Política de reembolso</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• 7+ días antes: Reembolso completo del alquiler + depósito</p>
                <p>• 3-6 días antes: 50% del alquiler + depósito</p>
                <p>• 1-2 días antes: Solo depósito</p>
                <p>• Mismo día: Sin reembolso</p>
              </div>
            </div>

            {/* Calculated Refund */}
            {(booking.status === "paid" || booking.status === "active") && (
              <div className={`rounded-xl p-4 ${
                refundAmount > 0 ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
              }`}>
                <p className={`text-sm ${refundAmount > 0 ? "text-green-800" : "text-red-800"}`}>
                  Monto a reembolsar:
                </p>
                <p className={`text-2xl font-bold ${refundAmount > 0 ? "text-green-900" : "text-red-900"}`}>
                  ${refundAmount.toFixed(2)}
                </p>
              </div>
            )}

            {/* Cancellation Reason */}
            <div>
              <Label htmlFor="cancel-reason">Motivo de cancelación (opcional)</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explica por qué cancelas esta reserva..."
                className="mt-2 rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              Volver
            </Button>
            <Button
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar cancelación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}