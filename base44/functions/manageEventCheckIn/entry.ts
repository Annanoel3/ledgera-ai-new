import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, eventId, projectId, name, startDate, endDate, notes } = await req.json();

    if (action === 'create') {
      // Create event
      const event = await base44.entities.Event.create({
        projectId,
        name,
        startDate,
        endDate: endDate || null,
        notes: notes || null
      });

      // Schedule check-in 2 hours after event start
      const checkInTime = new Date(new Date(startDate).getTime() + 2 * 60 * 60000);
      const checkIn = await base44.entities.ScheduledCheckIn.create({
        userEmail: user.email,
        type: 'after_event',
        scheduledFor: checkInTime.toISOString(),
        eventName: name,
        projectId,
        sent: false
      });

      // Link check-in to event
      await base44.entities.Event.update(event.id, {
        checkInScheduledId: checkIn.id
      });

      return Response.json({
        success: true,
        event,
        checkIn
      });
    }

    if (action === 'update') {
      // Update event and reschedule check-in if startDate changed
      const event = await base44.entities.Event.update(eventId, {
        name: name || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes || undefined
      });

      // If startDate changed, update the check-in time
      if (startDate && event.checkInScheduledId) {
        const checkInTime = new Date(new Date(startDate).getTime() + 2 * 60 * 60000);
        await base44.entities.ScheduledCheckIn.update(event.checkInScheduledId, {
          scheduledFor: checkInTime.toISOString(),
          eventName: name || event.name
        });
      }

      return Response.json({
        success: true,
        event
      });
    }

    if (action === 'delete') {
      // Delete event and cancel associated check-in
      const event = await base44.entities.Event.filter({ id: eventId });
      if (event.length > 0 && event[0].checkInScheduledId) {
        await base44.entities.ScheduledCheckIn.delete(event[0].checkInScheduledId);
      }
      await base44.entities.Event.delete(eventId);

      return Response.json({
        success: true,
        message: 'Event and associated check-in deleted'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Event check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});