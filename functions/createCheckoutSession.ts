import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse body first
    const body = await req.json();
    const { booking_id } = body;
    
    // Then check auth
    const user = await base44.auth.me();

    if (!user) {
      console.error('Unauthorized: No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!booking_id) {
      console.error('Missing booking_id');
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Get booking details
    console.log('Fetching booking:', booking_id);
    
    let booking;
    try {
      booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    } catch (err) {
      console.error('Error fetching booking:', err.message);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    console.log('Found booking:', booking.id, 'Status:', booking.status);

    // Verify user is the renter
    if (booking.renter_email !== user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify booking is approved
    if (booking.status !== 'approved') {
      return Response.json({ error: 'Booking must be approved before payment' }, { status: 400 });
    }

    // Create Stripe checkout session
    console.log('Creating Stripe session for booking:', booking_id);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Alquiler: ${booking.vehicle_title}`,
              description: `${booking.total_days} días • ${booking.start_date} a ${booking.end_date}`,
              images: booking.vehicle_photo ? [booking.vehicle_photo] : []
            },
            unit_amount: Math.round((booking.subtotal + booking.platform_fee + (booking.insurance_cost || 0) + (booking.extras_total || 0)) * 100)
          },
          quantity: 1
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Depósito de seguridad (reembolsable)',
              description: 'Se devolverá después de la devolución del vehículo'
            },
            unit_amount: Math.round(booking.security_deposit * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${req.headers.get('origin')}/BookingDetails?id=${booking_id}&payment=success`,
      cancel_url: `${req.headers.get('origin')}/BookingDetails?id=${booking_id}&payment=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        booking_id: booking_id,
        renter_email: booking.renter_email,
        owner_email: booking.owner_email,
        vehicle_id: booking.vehicle_id
      },
      customer_email: user.email
    });

    console.log('Stripe session created:', session.id);
    return Response.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Error al crear la sesión de pago'
    }, { status: 500 });
  }
});