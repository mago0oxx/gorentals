import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_type !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { vehicle_id } = await req.json();

    if (!vehicle_id) {
      return Response.json({ 
        success: false, 
        error: 'Vehicle ID is required' 
      }, { status: 400 });
    }

    // Get vehicle
    const vehicle = await base44.entities.Vehicle.get(vehicle_id);
    
    if (!vehicle || vehicle.owner_email !== user.email) {
      return Response.json({ 
        success: false, 
        error: 'Vehicle not found or unauthorized' 
      }, { status: 404 });
    }

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    if (!accessToken) {
      return Response.json({ 
        success: false, 
        error: 'Google Calendar not connected. Please authorize access first.' 
      }, { status: 400 });
    }

    // Get calendar events for next 6 months
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&` +
      `timeMax=${sixMonthsLater.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error('Google Calendar API error:', error);
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch calendar events' 
      }, { status: 500 });
    }

    const calendarData = await calendarResponse.json();
    const events = calendarData.items || [];

    // Extract dates from events
    const blockedDates = new Set(vehicle.blocked_dates || []);
    let newBlockedCount = 0;

    events.forEach(event => {
      if (!event.start) return;

      // Handle all-day events
      if (event.start.date) {
        const date = event.start.date; // YYYY-MM-DD format
        if (!blockedDates.has(date)) {
          blockedDates.add(date);
          newBlockedCount++;
        }
      } 
      // Handle timed events
      else if (event.start.dateTime) {
        const date = event.start.dateTime.split('T')[0]; // Extract YYYY-MM-DD
        if (!blockedDates.has(date)) {
          blockedDates.add(date);
          newBlockedCount++;
        }
      }
    });

    // Update vehicle with new blocked dates
    await base44.asServiceRole.entities.Vehicle.update(vehicle_id, {
      blocked_dates: Array.from(blockedDates).sort()
    });

    return Response.json({
      success: true,
      blocked_count: newBlockedCount,
      total_blocked: blockedDates.size,
      events_processed: events.length
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});