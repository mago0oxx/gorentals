import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar, Car, MapPin, Clock, User, Phone, Mail,
  CheckCircle, XCircle, DollarSign, Eye, ArrowLeft
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { sendNotification } from "@/components/notifications/notificationService";

export default function MyBookings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      let userBookings = [];
      if (userData.user_type === "owner") {
        // Load bookings where user is the owner
        userBookings = await base44.entities.Booking.filter(
          { owner_email: userData.email },
          "-created_date"
        );
      } else {
        // Load bookings where user is the renter
        userBookings = await base44.entities.Booking.filter(
          { renter_email: userData.email },
          "-created_date"
        );
      }

      setBookings(userBookings);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (booking, action) => {
    setSelectedBooking(booking);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedBooking) return;

    try {
      if (actionType === "approve") {
        await base44.entities.Booking.update(selectedBooking.id, {
          status: "approved"
        });

        await sendNotification({
          user_email: selectedBooking.renter_email,
          title: "Reserva aprobada",
          message: `Tu reserva para ${selectedBooking.vehicle_title} ha sido aprobada. Ahora puedes proceder con el pago.`,
          type: "booking_approved",
          booking_id: selectedBooking.id
        });
      } else if (actionType === "reject") {
        await base44.entities.Booking.update(selectedBooking.id, {
          status: "rejected"
        });

        await sendNotification({
          user_email: selectedBooking.renter_email,
          title: "Reserva rechazada",
          message: `Tu reserva para ${selectedBooking.vehicle_title} ha sido rechazada por el propietario.`,
          type: "booking_rejected",
          booking_id: selectedBooking.id
        });
      }

      await loadData();
      setSelectedBooking(null);
      setActionType(null);
    } catch (error) {
      console.error("Error updating booking:", error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { label: "Aprobada", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      rejected: { label: "Rechazada", color: "bg-red-100 text-red-800", icon: XCircle },
      paid: { label: "Pagada", color: "bg-green-100 text-green-800", icon: DollarSign },
      active: { label: "Activa", color: "bg-teal-100 text-teal-800", icon: Car },
      completed: { label: "Completada", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
      cancelled: { label: "Cancelada", color: "bg-gray-100 text-gray-800", icon: XCircle }
    };
    return configs[status] || configs.pending;
  };

  const filterBookings = (status) => {
    if (status === "pending") {
      return bookings.filter(b => b.status === "pending");
    } else if (status === "upcoming") {
      return bookings.filter(b => 
        ["approved", "paid", "active"].includes(b.status) &&
        new Date(b.start_date) >= new Date()
      );
    } else if (status === "past") {
      return bookings.filter(b => 
        ["completed", "cancelled"].includes(b.status) ||
        (["active"].includes(b.status) && new Date(b.end_date) < new Date())
      );
    }
    return bookings;
  };

  const BookingCard = ({ booking }) => {
    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;
    const isOwner = user?.user_type === "owner";

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Vehicle Image */}
            <div className="flex-shrink-0">
              <img
                src={booking.vehicle_photo || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300"}
                alt={booking.vehicle_title}
                className="w-full lg:w-48 h-40 object-cover rounded-xl"
              />
            </div>

            {/* Booking Details */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {booking.vehicle_title}
                  </h3>
                  <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-teal-600">
                  ${booking.total_amount}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {format(new Date(booking.start_date), "d MMM yyyy", { locale: es })} - {format(new Date(booking.end_date), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{booking.total_days} días</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{booking.pickup_location || "Por definir"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">${booking.price_per_day}/día</span>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {isOwner ? "Arrendatario" : "Propietario"}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-teal-100 text-teal-700">
                      {isOwner ? booking.renter_name?.[0] : booking.owner_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {isOwner ? booking.renter_name : booking.owner_name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {isOwner ? booking.renter_email : booking.owner_email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(createPageUrl(`BookingDetails?id=${booking.id}`))}
                  className="rounded-xl"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalles
                </Button>

                {isOwner && booking.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(booking, "approve")}
                      className="bg-green-600 hover:bg-green-700 rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(booking, "reject")}
                      className="rounded-xl"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Cargando reservas..." />
      </div>
    );
  }

  const isOwner = user?.user_type === "owner";
  const pendingBookings = filterBookings("pending");
  const upcomingBookings = filterBookings("upcoming");
  const pastBookings = filterBookings("past");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isOwner ? "Gestionar Reservas" : "Mis Reservas"}
          </h1>
          <p className="text-gray-600">
            {isOwner 
              ? "Administra las solicitudes de reserva y vehículos alquilados"
              : "Visualiza el estado de tus reservas y viajes"}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={isOwner ? "pending" : "upcoming"} className="space-y-6">
          <TabsList className="bg-white border rounded-xl p-1">
            {isOwner && (
              <TabsTrigger value="pending" className="rounded-lg">
                Pendientes ({pendingBookings.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="upcoming" className="rounded-lg">
              {isOwner ? "Confirmadas" : "Próximas"} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg">
              Historial ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          {isOwner && (
            <TabsContent value="pending" className="space-y-4">
              {pendingBookings.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No hay reservas pendientes"
                  description="Las nuevas solicitudes de reserva aparecerán aquí"
                />
              ) : (
                pendingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          )}

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={isOwner ? "No hay reservas confirmadas" : "No tienes reservas próximas"}
                description={isOwner 
                  ? "Las reservas aprobadas y pagadas aparecerán aquí"
                  : "Cuando reserves un vehículo, aparecerá aquí"}
              />
            ) : (
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No hay reservas completadas"
                description="Tu historial de reservas aparecerá aquí"
              />
            ) : (
              pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Aprobar reserva" : "Rechazar reserva"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" 
                ? `¿Estás seguro de que deseas aprobar la reserva de ${selectedBooking?.renter_name} para ${selectedBooking?.vehicle_title}? El arrendatario podrá proceder con el pago.`
                : `¿Estás seguro de que deseas rechazar esta reserva? Esta acción no se puede deshacer y el arrendatario será notificado.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {actionType === "approve" ? "Aprobar" : "Rechazar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}