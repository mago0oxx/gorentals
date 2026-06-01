import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Set token from headers before validation
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const base44 = createClientFromRequest(req);

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { booking_id, owner_email, renter_email, vehicle_id } = session.metadata;

      console.log('Processing payment for booking:', booking_id);

      // Get booking
      const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
      if (bookings.length === 0) {
        console.error('Booking not found:', booking_id);
        return Response.json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookings[0];

      // Update booking status
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        status: 'paid',
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent
      });

      console.log('Booking updated to paid status');

      // Create transaction records
      const platformFee = booking.platform_fee || 0;
      const ownerPayout = booking.owner_payout || (booking.subtotal - platformFee);

      // Renter payment transaction
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: booking.id,
        user_email: renter_email,
        user_role: 'renter',
        type: 'payment',
        amount: booking.total_amount,
        status: 'completed',
        description: `Pago por alquiler de ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title,
        stripe_payment_intent_id: session.payment_intent,
        metadata: {
          days: booking.total_days,
          start_date: booking.start_date,
          end_date: booking.end_date
        }
      });

      // Owner payout transaction (pending until booking completes)
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: booking.id,
        user_email: owner_email,
        user_role: 'owner',
        type: 'payout',
        amount: ownerPayout,
        status: 'pending',
        description: `Pago por alquiler de ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title,
        stripe_payment_intent_id: session.payment_intent
      });

      // Platform commission transaction
      await base44.asServiceRole.entities.Transaction.create({
        booking_id: booking.id,
        user_email: 'platform@gorentals.com',
        user_role: 'platform',
        type: 'commission',
        amount: platformFee,
        status: 'completed',
        description: `Comisión por ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title,
        stripe_payment_intent_id: session.payment_intent
      });

      // Security deposit hold
      if (booking.security_deposit > 0) {
        await base44.asServiceRole.entities.Transaction.create({
          booking_id: booking.id,
          user_email: renter_email,
          user_role: 'renter',
          type: 'deposit_hold',
          amount: booking.security_deposit,
          status: 'pending',
          description: `Depósito de seguridad - ${booking.vehicle_title}`,
          vehicle_title: booking.vehicle_title
        });
      }

      console.log('Transactions created');

      // Generate invoice PDF
      let invoicePdf = null;
      try {
        const invoiceResponse = await base44.asServiceRole.functions.invoke('generateInvoice', {
          booking_id: booking_id
        });
        invoicePdf = invoiceResponse.data.pdf;
        console.log('Invoice generated successfully');
      } catch (err) {
        console.error('Error generating invoice:', err);
      }

      // Send notifications with invoice
      const renterEmailBody = `
Hola ${booking.renter_name},

¡Tu pago ha sido procesado exitosamente!

Detalles de tu reserva:
- Vehículo: ${booking.vehicle_title}
- Fechas: ${booking.start_date} al ${booking.end_date}
- Total pagado: $${booking.total_amount}

El propietario te contactará pronto para coordinar los detalles de entrega.

Adjunto encontrarás la factura completa de tu reserva.

¡Disfruta tu viaje!

Equipo GoRentals
`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: renter_email,
        subject: '¡Pago confirmado! Tu reserva está lista',
        body: renterEmailBody
      });

      const ownerEmailBody = `
Hola ${booking.owner_name},

Has recibido un nuevo pago por tu vehículo ${booking.vehicle_title}.

Detalles de la reserva:
- Cliente: ${booking.renter_name}
- Fechas: ${booking.start_date} al ${booking.end_date}
- Total: $${booking.total_amount}
- Tu pago: $${ownerPayout} (se procesará al completar la reserva)

Por favor contacta al cliente para coordinar la entrega del vehículo.

Adjunto encontrarás la factura de esta transacción.

Equipo GoRentals
`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner_email,
        subject: 'Pago recibido - Nueva reserva confirmada',
        body: ownerEmailBody
      });

      // Create in-app notifications
      await base44.asServiceRole.entities.Notification.create({
        user_email: renter_email,
        title: 'Pago confirmado',
        message: `Tu pago de $${booking.total_amount} ha sido procesado. El propietario te contactará pronto.`,
        type: 'booking_paid',
        booking_id: booking.id,
        is_read: false
      });

      await base44.asServiceRole.entities.Notification.create({
        user_email: owner_email,
        title: 'Pago recibido',
        message: `${booking.renter_name} ha pagado $${booking.total_amount} por ${booking.vehicle_title}.`,
        type: 'booking_paid',
        booking_id: booking.id,
        is_read: false
      });

      console.log('Notifications sent');
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});