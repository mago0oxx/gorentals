import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmEmail } = await req.json();

    // Verify email confirmation
    if (confirmEmail !== user.email) {
      return Response.json({ 
        error: 'Email confirmation does not match' 
      }, { status: 400 });
    }

    // Delete user's related data using service role
    try {
      // Delete user's bookings (as renter)
      const renterBookings = await base44.asServiceRole.entities.Booking.filter({ renter_email: user.email });
      for (const booking of renterBookings) {
        await base44.asServiceRole.entities.Booking.delete(booking.id);
      }

      // Delete user's bookings (as owner)
      const ownerBookings = await base44.asServiceRole.entities.Booking.filter({ owner_email: user.email });
      for (const booking of ownerBookings) {
        await base44.asServiceRole.entities.Booking.delete(booking.id);
      }

      // Delete user's vehicles
      const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ owner_email: user.email });
      for (const vehicle of vehicles) {
        await base44.asServiceRole.entities.Vehicle.delete(vehicle.id);
      }

      // Delete user's conversations
      const conversations = await base44.asServiceRole.entities.Conversation.filter({
        $or: [
          { owner_email: user.email },
          { renter_email: user.email }
        ]
      });
      for (const conv of conversations) {
        await base44.asServiceRole.entities.Conversation.delete(conv.id);
      }

      // Delete user's messages
      const messages = await base44.asServiceRole.entities.Message.filter({ sender_email: user.email });
      for (const message of messages) {
        await base44.asServiceRole.entities.Message.delete(message.id);
      }

      // Delete user's notifications
      const notifications = await base44.asServiceRole.entities.Notification.filter({ user_email: user.email });
      for (const notification of notifications) {
        await base44.asServiceRole.entities.Notification.delete(notification.id);
      }

      // Delete user's reviews
      const reviews = await base44.asServiceRole.entities.Review.filter({ renter_id: user.id });
      for (const review of reviews) {
        await base44.asServiceRole.entities.Review.delete(review.id);
      }

      // Delete user's verification documents
      const documents = await base44.asServiceRole.entities.VerificationDocument.filter({ user_email: user.email });
      for (const doc of documents) {
        await base44.asServiceRole.entities.VerificationDocument.delete(doc.id);
      }

      // Delete user's maintenance records
      const maintenanceRecords = await base44.asServiceRole.entities.VehicleMaintenanceRecord.filter({ owner_email: user.email });
      for (const record of maintenanceRecords) {
        await base44.asServiceRole.entities.VehicleMaintenanceRecord.delete(record.id);
      }

      // Finally, delete the user account
      await base44.asServiceRole.entities.User.delete(user.id);

      return Response.json({ 
        success: true,
        message: 'Account deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting user data:', error);
      return Response.json({ 
        error: 'Failed to delete account data',
        details: error.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in deleteAccount function:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});