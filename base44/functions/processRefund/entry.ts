import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Get booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Calculate refund amount based on cancellation policy
    const startDate = new Date(booking.start_date);
    const today = new Date();
    const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    let refundAmount = 0;
    let refundPercentage = 0;

    if (daysUntilStart >= 7) {
      // 7+ days: full refund (minus platform fee)
      refundAmount = booking.subtotal + booking.security_deposit;
      refundPercentage = 100;
    } else if (daysUntilStart >= 3) {
      // 3-6 days: 50% refund + deposit
      refundAmount = (booking.subtotal * 0.5) + booking.security_deposit;
      refundPercentage = 50;
    } else if (daysUntilStart >= 1) {
      // 1-2 days: deposit only
      refundAmount = booking.security_deposit;
      refundPercentage = 0;
    } else {
      // Same day or past: no refund
      refundAmount = 0;
      refundPercentage = 0;
    }

    if (refundAmount <= 0) {
      return Response.json({ 
        success: true, 
        refund_amount: 0,
        message: 'No refund applicable according to cancellation policy'
      });
    }

    // Determine payment provider based on currency
    const currency = booking.metadata?.currency || (booking.total_amount > 100000 ? 'ARS' : 'USD');
    const isMercadoPago = currency === 'ARS' || booking.mercadopago_payment_id;

    let refundResult;

    if (isMercadoPago && booking.mercadopago_payment_id) {
      // Process MercadoPago refund
      const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      
      const mpRefund = await fetch(`https://api.mercadopago.com/v1/payments/${booking.mercadopago_payment_id}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: refundAmount
        })
      });

      if (!mpRefund.ok) {
        const error = await mpRefund.text();
        console.error('MercadoPago refund error:', error);
        throw new Error('Failed to process MercadoPago refund');
      }

      refundResult = await mpRefund.json();

    } else if (booking.stripe_payment_intent_id) {
      // Process Stripe refund
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      const Stripe = (await import('npm:stripe@17.5.0')).default;
      const stripe = new Stripe(stripeKey);

      // Convert to cents for Stripe
      const refundAmountCents = Math.round(refundAmount * 100);

      refundResult = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmountCents,
        reason: 'requested_by_customer',
        metadata: {
          booking_id: booking_id,
          refund_percentage: refundPercentage,
          days_until_start: daysUntilStart
        }
      });
    } else {
      return Response.json({ 
        error: 'No payment method found for refund' 
      }, { status: 400 });
    }

    // Create refund transaction
    await base44.asServiceRole.entities.Transaction.create({
      booking_id: booking_id,
      user_email: booking.renter_email,
      user_role: 'renter',
      type: 'refund',
      amount: refundAmount,
      currency: currency,
      status: 'completed',
      description: `Reembolso por cancelación - ${booking.vehicle_title}`,
      vehicle_title: booking.vehicle_title,
      metadata: {
        refund_percentage: refundPercentage,
        days_until_start: daysUntilStart,
        refund_id: refundResult.id
      }
    });

    // Update booking payment status
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      payment_status: 'refunded',
      metadata: {
        ...booking.metadata,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
        refund_id: refundResult.id
      }
    });

    return Response.json({
      success: true,
      refund_amount: refundAmount,
      refund_percentage: refundPercentage,
      refund_id: refundResult.id
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});