import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar que sea admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Obtener reservas pagadas que inician o terminan mañana
    const allBookings = await base44.asServiceRole.entities.Booking.filter({
      payment_status: "paid"
    });

    const pickupBookings = allBookings.filter(b => 
      b.start_date === tomorrowStr && b.status === "paid"
    );
    
    const returnBookings = allBookings.filter(b => 
      b.end_date === tomorrowStr && b.status === "active"
    );

    // Enviar recordatorios de recogida
    for (const booking of pickupBookings) {
      await sendPickupReminder(base44, booking);
    }

    // Enviar recordatorios de devolución
    for (const booking of returnBookings) {
      await sendReturnReminder(base44, booking);
    }

    return Response.json({
      success: true,
      pickupReminders: pickupBookings.length,
      returnReminders: returnBookings.length
    });

  } catch (error) {
    console.error("Error sending reminders:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendPickupReminder(base44, booking) {
  const pickupDate = new Date(booking.start_date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Notificar al arrendatario
  await base44.asServiceRole.entities.Notification.create({
    user_email: booking.renter_email,
    title: "Recordatorio de recogida",
    message: `Mañana ${pickupDate} recoges ${booking.vehicle_title}. Ubicación: ${booking.pickup_location || "Por confirmar"}`,
    type: "pickup_reminder",
    booking_id: booking.id,
    is_read: false
  });

  // Notificar al propietario
  await base44.asServiceRole.entities.Notification.create({
    user_email: booking.owner_email,
    title: "Recordatorio de entrega",
    message: `Mañana ${pickupDate} entregas ${booking.vehicle_title} a ${booking.renter_name}.`,
    type: "pickup_reminder",
    booking_id: booking.id,
    is_read: false
  });
}

async function sendReturnReminder(base44, booking) {
  const returnDate = new Date(booking.end_date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Notificar al arrendatario
  await base44.asServiceRole.entities.Notification.create({
    user_email: booking.renter_email,
    title: "Recordatorio de devolución",
    message: `Mañana ${returnDate} termina tu alquiler de ${booking.vehicle_title}. Recuerda devolverlo a tiempo.`,
    type: "return_reminder",
    booking_id: booking.id,
    is_read: false
  });

  // Notificar al propietario
  await base44.asServiceRole.entities.Notification.create({
    user_email: booking.owner_email,
    title: "Recordatorio de devolución",
    message: `Mañana ${returnDate} ${booking.renter_name} devuelve ${booking.vehicle_title}.`,
    type: "return_reminder",
    booking_id: booking.id,
    is_read: false
  });
}