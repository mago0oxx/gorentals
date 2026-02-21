import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const NotificationService = {
  // Notificar al propietario de nueva solicitud de reserva
  async notifyNewBookingRequest(booking) {
    // Crear notificación en la app
    try {
      await base44.entities.Notification.create({
        user_email: booking.owner_email,
        title: "Nueva solicitud de reserva",
        message: `${booking.renter_name} quiere alquilar tu ${booking.vehicle_title} del ${format(new Date(booking.start_date), "d MMM", { locale: es })} al ${format(new Date(booking.end_date), "d MMM", { locale: es })}`,
        type: "booking_request",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    // Enviar email al propietario
    try {
      const bookingUrl = `${window.location.origin}/#/BookingDetails?id=${booking.id}`;
      const startDate = format(new Date(booking.start_date), "EEEE d 'de' MMMM, yyyy", { locale: es });
      const endDate = format(new Date(booking.end_date), "EEEE d 'de' MMMM, yyyy", { locale: es });

      await base44.integrations.Core.SendEmail({
        to: booking.owner_email,
        subject: `Nueva solicitud de reserva - ${booking.vehicle_title}`,
        body: `
        <h2>¡Nueva Solicitud de Reserva!</h2>
        
        <p>Hola,</p>
        
        <p><strong>${booking.renter_name}</strong> ha solicitado alquilar tu vehículo:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${booking.vehicle_title}</h3>
          <p><strong>📅 Fechas:</strong><br/>
          Desde: ${startDate}<br/>
          Hasta: ${endDate}<br/>
          Total: ${booking.total_days} días</p>
          
          <p><strong>💰 Ganancia estimada:</strong> $${booking.owner_payout?.toFixed(2)}</p>
          
          ${booking.notes ? `<p><strong>📝 Mensaje del arrendatario:</strong><br/>"${booking.notes}"</p>` : ''}
        </div>
        
        <p><strong>Información del arrendatario:</strong><br/>
        Email: ${booking.renter_email}</p>
        
        <div style="margin: 30px 0;">
          <a href="${bookingUrl}" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Ver detalles y aprobar reserva
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Recuerda revisar los detalles de la reserva antes de aprobarla. Una vez aprobada, el arrendatario recibirá una notificación para proceder con el pago.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
        
        <p style="color: #9ca3af; font-size: 12px;">
          Este es un mensaje automático de GoRentals. Por favor no respondas a este correo.
        </p>
      `
      });
    } catch (err) {
      console.log('Could not send email to owner:', err.message);
    }
  },

  // Notificar al arrendatario que su reserva fue aprobada
  async notifyBookingApproved(booking) {
    // Crear notificación en la app
    try {
      await base44.entities.Notification.create({
        user_email: booking.renter_email,
        title: "¡Reserva aprobada!",
        message: `Tu solicitud para ${booking.vehicle_title} ha sido aprobada. Procede con el pago para confirmar.`,
        type: "booking_approved",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    // Enviar email al arrendatario
    try {
      const bookingUrl = `${window.location.origin}/#/BookingDetails?id=${booking.id}`;
      const startDate = format(new Date(booking.start_date), "EEEE d 'de' MMMM, yyyy", { locale: es });
      const endDate = format(new Date(booking.end_date), "EEEE d 'de' MMMM, yyyy", { locale: es });

      await base44.integrations.Core.SendEmail({
        to: booking.renter_email,
        subject: `¡Reserva aprobada! - ${booking.vehicle_title}`,
        body: `
        <h2>¡Tu Reserva ha sido Aprobada! 🎉</h2>
        
        <p>Hola ${booking.renter_name},</p>
        
        <p>El propietario ha aprobado tu solicitud de reserva para:</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #059669;">${booking.vehicle_title}</h3>
          <p><strong>📅 Fechas:</strong><br/>
          Desde: ${startDate}<br/>
          Hasta: ${endDate}<br/>
          Total: ${booking.total_days} días</p>
          
          <p><strong>💰 Total a pagar:</strong> $${booking.total_amount?.toFixed(2)}</p>
        </div>
        
        <p><strong>⚡ Siguiente paso:</strong> Completa el pago para confirmar tu reserva.</p>
        
        <div style="margin: 30px 0;">
          <a href="${bookingUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Proceder al pago
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Una vez completado el pago, podrás coordinar con el propietario para la entrega del vehículo.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
        
        <p style="color: #9ca3af; font-size: 12px;">
          Este es un mensaje automático de GoRentals. Por favor no respondas a este correo.
        </p>
      `
      });
    } catch (err) {
      console.log('Could not send email to renter:', err.message);
    }
  },

  // Notificar al arrendatario que su reserva fue rechazada
  async notifyBookingRejected(booking) {
    // Crear notificación en la app
    try {
      await base44.entities.Notification.create({
        user_email: booking.renter_email,
        title: "Reserva rechazada",
        message: `Lo sentimos, tu solicitud para ${booking.vehicle_title} no fue aprobada. Busca otras opciones disponibles.`,
        type: "booking_rejected",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    // Enviar email al arrendatario
    try {
      await base44.integrations.Core.SendEmail({
        to: booking.renter_email,
        subject: `Solicitud de reserva no aprobada - ${booking.vehicle_title}`,
        body: `
        <h2>Solicitud de Reserva No Aprobada</h2>
        
        <p>Hola ${booking.renter_name},</p>
        
        <p>Lamentablemente, el propietario no pudo aprobar tu solicitud de reserva para <strong>${booking.vehicle_title}</strong>.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;">No te preocupes, hay muchas otras opciones disponibles en GoRentals.</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${window.location.origin}/#/Browse" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Explorar otros vehículos
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Encuentra el vehículo perfecto para tus necesidades en nuestra plataforma.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
        
        <p style="color: #9ca3af; font-size: 12px;">
          Este es un mensaje automático de GoRentals. Por favor no respondas a este correo.
        </p>
      `
      });
    } catch (err) {
      console.log('Could not send email to renter:', err.message);
    }
  },

  // Notificar al propietario que el pago fue recibido
  async notifyBookingPaid(booking) {
    try {
      await base44.entities.Notification.create({
        user_email: booking.owner_email,
        title: "Pago confirmado",
        message: `${booking.renter_name} ha completado el pago para ${booking.vehicle_title}. Coordina la entrega del vehículo.`,
        type: "booking_paid",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification for owner:', err.message);
    }

    // También notificar al arrendatario
    try {
      await base44.entities.Notification.create({
        user_email: booking.renter_email,
        title: "Pago confirmado",
        message: `Tu pago para ${booking.vehicle_title} ha sido confirmado. El propietario te contactará para coordinar la entrega.`,
        type: "booking_paid",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification for renter:', err.message);
    }
  },

  // Notificar que la reserva fue completada
  async notifyBookingCompleted(booking) {
    try {
      await base44.entities.Notification.create({
        user_email: booking.renter_email,
        title: "Alquiler completado",
        message: `Tu alquiler de ${booking.vehicle_title} ha finalizado. ¡No olvides dejar una reseña!`,
        type: "booking_completed",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    try {
      await base44.entities.Notification.create({
        user_email: booking.owner_email,
        title: "Alquiler completado",
        message: `El alquiler de ${booking.vehicle_title} con ${booking.renter_name} ha finalizado exitosamente.`,
        type: "booking_completed",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }
  },

  // Recordatorio de recogida (para ambos)
  async notifyPickupReminder(booking) {
    const pickupDate = format(new Date(booking.start_date), "EEEE d 'de' MMMM", { locale: es });
    
    try {
      await base44.entities.Notification.create({
        user_email: booking.renter_email,
        title: "Recordatorio de recogida",
        message: `Mañana ${pickupDate} recoges ${booking.vehicle_title}. Ubicación: ${booking.pickup_location || "Por confirmar"}`,
        type: "pickup_reminder",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    try {
      await base44.entities.Notification.create({
        user_email: booking.owner_email,
        title: "Recordatorio de entrega",
        message: `Mañana ${pickupDate} entregas ${booking.vehicle_title} a ${booking.renter_name}.`,
        type: "pickup_reminder",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }
  },

  // Recordatorio de devolución (para ambos)
  async notifyReturnReminder(booking) {
    const returnDate = format(new Date(booking.end_date), "EEEE d 'de' MMMM", { locale: es });
    
    try {
      await base44.entities.Notification.create({
        user_email: booking.renter_email,
        title: "Recordatorio de devolución",
        message: `Mañana ${returnDate} termina tu alquiler de ${booking.vehicle_title}. Recuerda devolverlo a tiempo.`,
        type: "return_reminder",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    try {
      await base44.entities.Notification.create({
        user_email: booking.owner_email,
        title: "Recordatorio de devolución",
        message: `Mañana ${returnDate} ${booking.renter_name} devuelve ${booking.vehicle_title}.`,
        type: "return_reminder",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }
  },

  // Notificar cancelación de reserva
  async notifyBookingCancelled(booking, cancelledBy, cancelReason, refundAmount) {
    const recipientEmail = cancelledBy === "owner" ? booking.renter_email : booking.owner_email;
    const recipientName = cancelledBy === "owner" ? booking.renter_name : booking.owner_name;
    const cancellerName = cancelledBy === "owner" ? booking.owner_name : booking.renter_name;
    const bookingUrl = `${window.location.origin}/#/BookingDetails?id=${booking.id}`;
    
    // Crear notificación en la app
    try {
      await base44.entities.Notification.create({
        user_email: recipientEmail,
        title: "Reserva cancelada",
        message: `La reserva de ${booking.vehicle_title} fue cancelada por ${cancelledBy === "owner" ? "el propietario" : "el arrendatario"}${refundAmount > 0 ? `. Reembolso: $${refundAmount.toFixed(2)}` : "."}`,
        type: "booking_cancelled",
        booking_id: booking.id,
        is_read: false
      });
    } catch (err) {
      console.log('Could not create notification:', err.message);
    }

    // Enviar email
    try {
      const startDate = format(new Date(booking.start_date), "EEEE d 'de' MMMM, yyyy", { locale: es });
      const endDate = format(new Date(booking.end_date), "EEEE d 'de' MMMM, yyyy", { locale: es });

      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Reserva cancelada - ${booking.vehicle_title}`,
        body: `
        <h2>Reserva Cancelada</h2>
        
        <p>Hola ${recipientName},</p>
        
        <p>La reserva para <strong>${booking.vehicle_title}</strong> ha sido cancelada por ${cancelledBy === "owner" ? "el propietario" : "el arrendatario"}.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Detalles de la reserva:</h3>
          <p><strong>📅 Fechas:</strong><br/>
          Desde: ${startDate}<br/>
          Hasta: ${endDate}<br/>
          Total: ${booking.total_days} días</p>
          
          ${cancelReason ? `<p><strong>📝 Motivo:</strong> ${cancelReason}</p>` : ''}
        </div>
        
        ${refundAmount > 0 ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;">
            <strong>💰 Reembolso:</strong> $${refundAmount.toFixed(2)}<br/>
            El reembolso será procesado en los próximos 5-10 días hábiles.
          </p>
        </div>
        ` : ''}
        
        <div style="margin: 30px 0;">
          <a href="${bookingUrl}" style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Ver detalles de la reserva
          </a>
        </div>
        
        ${cancelledBy !== "owner" ? `
        <div style="margin: 30px 0;">
          <a href="${window.location.origin}/#/Browse" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Explorar otros vehículos
          </a>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
        
        <p style="color: #9ca3af; font-size: 12px;">
          Este es un mensaje automático de GoRentals. Por favor no respondas a este correo.
        </p>
      `
      });
    } catch (err) {
      console.log('Could not send cancellation email:', err.message);
    }
  }
};