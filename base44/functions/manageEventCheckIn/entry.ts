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

      // Schedule push notification 2 hours after event (same as check-in)
      let notificationId = null;
      try {
        const sendAtISO = new Date(new Date(startDate).getTime() + 2 * 60 * 60000).toISOString();
        const schedulePushUrl = new URL(req.url);
        schedulePushUrl.pathname = schedulePushUrl.pathname.replace('/manageEventCheckIn', '/schedulePush');
        const pushRes = await fetch(schedulePushUrl.toString(), {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify({
            toUserExternalId: user.email,
            title: `Follow up: ${name}`,
            body: `Did anything change during ${name}? Log any updates or new invoices.`,
            sendAtISO,
            data: { eventId: event.id }
          })
        });
        if (pushRes.ok) {
          const pushData = await pushRes.json();
          notificationId = pushData.notification_id;
        }
      } catch (pushErr) {
        console.error('Failed to schedule push notification:', pushErr);
      }

      // Link check-in and notification to event
      await base44.entities.Event.update(event.id, {
        checkInScheduledId: checkIn.id,
        ...(notificationId && { onesignalNotificationId: notificationId })
      });

      return Response.json({
        success: true,
        event,
        checkIn,
        notificationId
      });
    }

    if (action === 'update') {
      // Fetch existing event to check if startDate changed
      const existingEvent = await base44.entities.Event.get(eventId);
      const startDateChanged = startDate && startDate !== existingEvent.startDate;

      // Cancel old OneSignal notification if startDate changed
      if (startDateChanged && existingEvent.onesignalNotificationId) {
        try {
          const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
          const onesignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
          await fetch(
            `https://onesignal.com/api/v1/notifications/${existingEvent.onesignalNotificationId}?app_id=${onesignalAppId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${onesignalRestKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (err) {
          console.error('Failed to cancel old OneSignal notification:', err);
        }
      }

      // Update event
      const event = await base44.entities.Event.update(eventId, {
        name: name || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes || undefined
      });

      // If startDate changed, schedule new notification
      if (startDateChanged) {
        let newNotificationId = null;
        try {
          const sendAtISO = new Date(new Date(startDate).getTime() + 2 * 60 * 60000).toISOString();
          const schedulePushUrl = new URL(req.url);
          schedulePushUrl.pathname = schedulePushUrl.pathname.replace('/manageEventCheckIn', '/schedulePush');
          const pushRes = await fetch(schedulePushUrl.toString(), {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify({
              toUserExternalId: user.email,
              title: `Follow up: ${name || event.name}`,
              body: `Did anything change during ${name || event.name}? Log any updates or new invoices.`,
              sendAtISO,
              data: { eventId: event.id }
            })
          });
          if (pushRes.ok) {
            const pushData = await pushRes.json();
            newNotificationId = pushData.notification_id;
          }
        } catch (pushErr) {
          console.error('Failed to schedule new push notification:', pushErr);
        }

        // Update event with new notification ID
        if (newNotificationId) {
          await base44.entities.Event.update(eventId, {
            onesignalNotificationId: newNotificationId
          });
        }

        // Update check-in time if it exists
        if (event.checkInScheduledId) {
          const checkInTime = new Date(new Date(startDate).getTime() + 2 * 60 * 60000);
          await base44.entities.ScheduledCheckIn.update(event.checkInScheduledId, {
            scheduledFor: checkInTime.toISOString(),
            eventName: name || event.name
          });
        }
      }

      return Response.json({
        success: true,
        event
      });
    }

    if (action === 'delete') {
      // Fetch event to get associated IDs
      const event = await base44.entities.Event.get(eventId);

      // Cancel OneSignal notification
      if (event.onesignalNotificationId) {
        try {
          const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
          const onesignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
          await fetch(
            `https://onesignal.com/api/v1/notifications/${event.onesignalNotificationId}?app_id=${onesignalAppId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${onesignalRestKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (err) {
          console.error('Failed to cancel OneSignal notification:', err);
        }
      }

      // Delete check-in
      if (event.checkInScheduledId) {
        await base44.entities.ScheduledCheckIn.delete(event.checkInScheduledId);
      }

      // Delete event
      await base44.entities.Event.delete(eventId);

      return Response.json({
        success: true,
        message: 'Event and associated notifications deleted'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Event check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});