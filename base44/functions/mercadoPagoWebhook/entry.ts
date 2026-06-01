import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // MercadoPago sends payment notifications
    const { data, type } = await req.json();

    console.log('MercadoPago webhook received:', { type, data });

    // Only process payment notifications
    if (type !== 'payment') {
      return Response.json({ status: 'ignored' });
    }

    const paymentId = data.id;
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

    // Get payment details from MercadoPago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });

    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment from MercadoPago');
      return Response.json({ error: 'Failed to fetch payment' }, { status: 500 });
    }

    const payment = await paymentResponse.json();
    console.log('Payment details:', payment);

    const bookingId = payment.external_reference;
    
    if (!bookingId) {
      console.error('No booking_id in payment metadata');
      return Response.json({ error: 'Invalid payment metadata' }, { status: 400 });
    }

    // Use service role to update booking
    const base44 = createClientFromRequest(req);
    
    // Get booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    if (bookings.length === 0) {
      console.error('Booking not found:', bookingId);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Handle payment status
    if (payment.status === 'approved') {
      // Payment successful
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        status: 'paid',
        payment_status: 'paid',
        mercadopago_payment_id: payment.id
      });

      // Create payment transaction
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: bookingId,
        user_email: booking.renter_email,
        user_role: 'renter',
        type: 'payment',
        amount: booking.total_amount,
        currency: 'ARS',
        status: 'completed',
        description: `Pago de reserva - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title,
        stripe_payment_intent_id: payment.id,
        metadata: {
          payment_method: payment.payment_method_id,
          payment_type: payment.payment_type_id
        }
      });

      // Create platform commission transaction
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: bookingId,
        user_email: 'platform@gorentals.com',
        user_role: 'platform',
        type: 'commission',
        amount: booking.platform_fee,
        currency: 'ARS',
        status: 'completed',
        description: `Comisión de plataforma - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title
      });

      // Create pending payout for owner
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: bookingId,
        user_email: booking.owner_email,
        user_role: 'owner',
        type: 'payout',
        amount: booking.owner_payout,
        currency: 'ARS',
        status: 'pending',
        description: `Pago pendiente - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title
      });

      // Create deposit hold transaction
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: bookingId,
        user_email: booking.renter_email,
        user_role: 'renter',
        type: 'deposit_hold',
        amount: booking.security_deposit,
        currency: 'ARS',
        status: 'pending',
        description: `Depósito de seguridad - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title
      });

      // Send notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.renter_email,
        title: 'Pago confirmado',
        message: `Tu pago para ${booking.vehicle_title} ha sido procesado exitosamente.`,
        type: 'booking_paid',
        booking_id: bookingId
      });

      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.owner_email,
        title: 'Reserva pagada',
        message: `${booking.renter_name} ha completado el pago para ${booking.vehicle_title}.`,
        type: 'booking_paid',
        booking_id: bookingId
      });

    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Payment failed
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        payment_status: 'failed',
        metadata: {
          ...booking.metadata,
          payment_error: payment.status_detail
        }
      });
    }

    return Response.json({ status: 'processed' });

  } catch (error) {
    console.error('Error processing MercadoPago webhook:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});