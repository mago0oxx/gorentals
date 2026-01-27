import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const NotificationService = {
  // Notificar al propietario de nueva solicitud de reserva
  async notifyNewBookingRequest(booking) {
    await base44.entities.Notification.create({
      user_email: booking.owner_email,
      title: "Nueva solicitud de reserva",
      message: `${booking.renter_name} quiere alquilar tu ${booking.vehicle_title} del ${format(new Date(booking.start_date), "d MMM", { locale: es })} al ${format(new Date(booking.end_date), "d MMM", { locale: es })}`,
      type: "booking_request",
      booking_id: booking.id,
      is_read: false
    });
  },

  // Notificar al arrendatario que su reserva fue aprobada
  async notifyBookingApproved(booking) {
    await base44.entities.Notification.create({
      user_email: booking.renter_email,
      title: "¡Reserva aprobada!",
      message: `Tu solicitud para ${booking.vehicle_title} ha sido aprobada. Procede con el pago para confirmar.`,
      type: "booking_approved",
      booking_id: booking.id,
      is_read: false
    });
  },

  // Notificar al arrendatario que su reserva fue rechazada
  async notifyBookingRejected(booking) {
    await base44.entities.Notification.create({
      user_email: booking.renter_email,
      title: "Reserva rechazada",
      message: `Lo sentimos, tu solicitud para ${booking.vehicle_title} no fue aprobada. Busca otras opciones disponibles.`,
      type: "booking_rejected",
      booking_id: booking.id,
      is_read: false
    });
  },

  // Notificar al propietario que el pago fue recibido
  async notifyBookingPaid(booking) {
    await base44.entities.Notification.create({
      user_email: booking.owner_email,
      title: "Pago confirmado",
      message: `${booking.renter_name} ha completado el pago para ${booking.vehicle_title}. Coordina la entrega del vehículo.`,
      type: "booking_paid",
      booking_id: booking.id,
      is_read: false
    });

    // También notificar al arrendatario
    await base44.entities.Notification.create({
      user_email: booking.renter_email,
      title: "Pago confirmado",
      message: `Tu pago para ${booking.vehicle_title} ha sido confirmado. El propietario te contactará para coordinar la entrega.`,
      type: "booking_paid",
      booking_id: booking.id,
      is_read: false
    });
  },

  // Notificar que la reserva fue completada
  async notifyBookingCompleted(booking) {
    await base44.entities.Notification.create({
      user_email: booking.renter_email,
      title: "Alquiler completado",
      message: `Tu alquiler de ${booking.vehicle_title} ha finalizado. ¡No olvides dejar una reseña!`,
      type: "booking_completed",
      booking_id: booking.id,
      is_read: false
    });

    await base44.entities.Notification.create({
      user_email: booking.owner_email,
      title: "Alquiler completado",
      message: `El alquiler de ${booking.vehicle_title} con ${booking.renter_name} ha finalizado exitosamente.`,
      type: "booking_completed",
      booking_id: booking.id,
      is_read: false
    });
  },

  // Recordatorio de recogida (para ambos)
  async notifyPickupReminder(booking) {
    const pickupDate = format(new Date(booking.start_date), "EEEE d 'de' MMMM", { locale: es });
    
    await base44.entities.Notification.create({
      user_email: booking.renter_email,
      title: "Recordatorio de recogida",
      message: `Mañana ${pickupDate} recoges ${booking.vehicle_title}. Ubicación: ${booking.pickup_location || "Por confirmar"}`,
      type: "pickup_reminder",
      booking_id: booking.id,
      is_read: false
    });

    await base44.entities.Notification.create({
      user_email: booking.owner_email,
      title: "Recordatorio de entrega",
      message: `Mañana ${pickupDate} entregas ${booking.vehicle_title} a ${booking.renter_name}.`,
      type: "pickup_reminder",
      booking_id: booking.id,
      is_read: false
    });
  },

  // Recordatorio de devolución (para ambos)
  async notifyReturnReminder(booking) {
    const returnDate = format(new Date(booking.end_date), "EEEE d 'de' MMMM", { locale: es });
    
    await base44.entities.Notification.create({
      user_email: booking.renter_email,
      title: "Recordatorio de devolución",
      message: `Mañana ${returnDate} termina tu alquiler de ${booking.vehicle_title}. Recuerda devolverlo a tiempo.`,
      type: "return_reminder",
      booking_id: booking.id,
      is_read: false
    });

    await base44.entities.Notification.create({
      user_email: booking.owner_email,
      title: "Recordatorio de devolución",
      message: `Mañana ${returnDate} ${booking.renter_name} devuelve ${booking.vehicle_title}.`,
      type: "return_reminder",
      booking_id: booking.id,
      is_read: false
    });
  }
};