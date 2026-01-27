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
  Calendar, MapPin, ChevronLeft, CheckCircle, XCircle, Clock,
  Phone, Mail, User, Car, Shield, Loader2, Star, MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StarRating from "@/components/ui/StarRating";
import { motion } from "framer-motion";

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Aprobado", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: XCircle },
  paid: { label: "Pagado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  active: { label: "En curso", color: "bg-teal-100 text-teal-700", icon: Car },
  completed: { label: "Completado", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle }
};

export default function BookingDetails() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
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
    if (!bookingId) return;
    setIsLoading(true);

    const [userData, bookingData] = await Promise.all([
      base44.auth.me(),
      base44.entities.Booking.filter({ id: bookingId })
    ]);

    setUser(userData);
    
    if (bookingData.length > 0) {
      setBooking(bookingData[0]);
      
      // Check for existing review
      const reviews = await base44.entities.Review.filter({
        booking_id: bookingId,
        renter_id: userData.id
      });
      if (reviews.length > 0) {
        setExistingReview(reviews[0]);
      }
    }

    setIsLoading(false);
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

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando detalles..." />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Reserva no encontrada</p>
      </div>
    );
  }

  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const isOwner = user?.email === booking.owner_email;
  const isRenter = user?.email === booking.renter_email;

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

        {/* Contact Info */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {isOwner ? "Información del arrendatario" : "Información del propietario"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span>{isOwner ? booking.renter_name : booking.owner_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <a href={`mailto:${isOwner ? booking.renter_email : booking.owner_email}`} className="text-teal-600 hover:underline">
                {isOwner ? booking.renter_email : booking.owner_email}
              </a>
            </div>
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
            <CardTitle className="text-lg">Resumen de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">${booking.price_per_day} x {booking.total_days} días</span>
              <span>${booking.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tarifa de servicio</span>
              <span>${booking.platform_fee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Depósito de seguridad
              </span>
              <span>${booking.security_deposit?.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${booking.total_amount?.toFixed(2)}</span>
            </div>
            {isOwner && (
              <div className="flex justify-between text-teal-600 font-medium pt-2 border-t">
                <span>Tu ganancia</span>
                <span>${booking.owner_payout?.toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions for Owner */}
        {isOwner && booking.status === "pending" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Acciones del propietario</h3>
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

        {/* Mark as Paid (Owner) */}
        {isOwner && booking.status === "approved" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <p className="text-gray-600 mb-4">
                Una vez que recibas el pago del arrendatario, marca esta reserva como pagada.
              </p>
              <Button
                onClick={() => handleStatusUpdate("paid")}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmar pago recibido
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mark as Active (Owner) */}
        {isOwner && booking.status === "paid" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <p className="text-gray-600 mb-4">
                Cuando entregues el vehículo, marca la reserva como activa.
              </p>
              <Button
                onClick={() => handleStatusUpdate("active")}
                disabled={isUpdating}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
                Vehículo entregado
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete Booking (Owner) */}
        {isOwner && booking.status === "active" && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <p className="text-gray-600 mb-4">
                Cuando el arrendatario devuelva el vehículo, completa la reserva.
              </p>
              <Button
                onClick={handleCompleteBooking}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Completar reserva
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
      </div>
    </div>
  );
}