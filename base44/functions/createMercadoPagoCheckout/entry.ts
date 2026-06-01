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
    const bookings = await base44.entities.Booking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Verify user is the renter
    if (booking.renter_email !== user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already paid
    if (booking.status === 'paid' || booking.payment_status === 'paid') {
      return Response.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // Get MercadoPago access token
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MercadoPago access token not configured');
      return Response.json({ error: 'Payment provider not configured' }, { status: 500 });
    }

    // Create preference in MercadoPago
    const preference = {
      items: [
        {
          title: `Alquiler - ${booking.vehicle_title}`,
          description: `${booking.total_days} días de alquiler`,
          quantity: 1,
          unit_price: booking.total_amount,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: user.email,
        name: user.full_name
      },
      back_urls: {
        success: `${req.headers.get('origin')}/BookingDetails?id=${booking_id}&payment=success`,
        failure: `${req.headers.get('origin')}/BookingDetails?id=${booking_id}&payment=failure`,
        pending: `${req.headers.get('origin')}/BookingDetails?id=${booking_id}&payment=pending`
      },
      auto_return: 'approved',
      external_reference: booking_id,
      notification_url: `${req.headers.get('origin')}/api/functions/mercadoPagoWebhook`,
      metadata: {
        booking_id: booking_id,
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const error = await mpResponse.text();
      console.error('MercadoPago API error:', error);
      return Response.json({ error: 'Payment provider error' }, { status: 500 });
    }

    const mpData = await mpResponse.json();

    // Store MercadoPago preference ID
    await base44.entities.Booking.update(booking_id, {
      metadata: {
        ...booking.metadata,
        mp_preference_id: mpData.id
      }
    });

    return Response.json({
      checkout_url: mpData.init_point,
      preference_id: mpData.id
    });

  } catch (error) {
    console.error('Error creating MercadoPago checkout:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});