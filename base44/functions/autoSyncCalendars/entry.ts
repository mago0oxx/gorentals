import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users with calendar auto-sync enabled
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithAutoSync = allUsers.filter(u => 
      u.calendar_auto_sync && u.calendar_sync_vehicle_id
    );

    console.log(`Found ${usersWithAutoSync.length} users with auto-sync enabled`);

    const results = [];

    for (const user of usersWithAutoSync) {
      try {
        // Sync the vehicle
        const syncResponse = await base44.asServiceRole.functions.invoke('syncGoogleCalendar', {
          vehicle_id: user.calendar_sync_vehicle_id
        });

        results.push({
          user_email: user.email,
          vehicle_id: user.calendar_sync_vehicle_id,
          success: syncResponse.data?.success || false,
          blocked_count: syncResponse.data?.blocked_count || 0
        });

        // Update last sync time
        await base44.asServiceRole.entities.User.update(user.id, {
          calendar_last_sync: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Error syncing for user ${user.email}:`, error);
        results.push({
          user_email: user.email,
          vehicle_id: user.calendar_sync_vehicle_id,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      synced_users: results.length,
      results
    });

  } catch (error) {
    console.error('Auto-sync error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});