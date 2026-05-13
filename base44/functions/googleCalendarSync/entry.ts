import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();

    // Get Google Calendar access token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Calendar not connected. Please connect it in Settings.' }, { status: 400 });
    }

    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    if (action === 'import') {
      // Fetch upcoming events from Google Calendar (next 90 days)
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=100&singleEvents=true&orderBy=startTime`,
        { headers: authHeader }
      );

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: 'Google Calendar API error: ' + err }, { status: 400 });
      }

      const data = await res.json();
      const googleEvents = data.items || [];

      // Get existing events for this user
      const existingEvents = await base44.entities.Event.filter({ created_by: user.email });
      const existingGoogleIds = new Set(existingEvents.map(e => e.googleEventId).filter(Boolean));

      let imported = 0;
      for (const gev of googleEvents) {
        if (existingGoogleIds.has(gev.id)) continue; // skip already imported

        const startDate = gev.start?.dateTime || (gev.start?.date ? gev.start.date + 'T00:00:00' : null);
        const endDate = gev.end?.dateTime || (gev.end?.date ? gev.end.date + 'T00:00:00' : null);

        if (!startDate) continue;

        // Create event
        const event = await base44.entities.Event.create({
          name: gev.summary || 'Google Calendar Event',
          startDate,
          endDate: endDate || null,
          notes: gev.description || null,
          googleEventId: gev.id,
        });

        // Schedule check-in 2 hours after event start
        const checkInTime = new Date(new Date(startDate).getTime() + 2 * 60 * 60000);
        if (checkInTime > new Date()) {
          const checkIn = await base44.entities.ScheduledCheckIn.create({
            userEmail: user.email,
            type: 'after_event',
            scheduledFor: checkInTime.toISOString(),
            eventName: gev.summary || 'Google Calendar Event',
            sent: false,
          });
          await base44.entities.Event.update(event.id, { checkInScheduledId: checkIn.id });
        }

        imported++;
      }

      return Response.json({ success: true, imported });
    }

    if (action === 'export') {
      // Export Ledgera events to Google Calendar (events only, not income/expenses)
      const ledgeraEvents = await base44.entities.Event.filter({ created_by: user.email });

      // Get existing Google event IDs to skip already-exported ones
      let exported = 0;
      for (const ev of ledgeraEvents) {
        if (ev.googleEventId) continue; // already from Google or already exported

        const gEvent = {
          summary: ev.name,
          description: ev.notes || 'Event from Ledgera AI',
          start: { dateTime: ev.startDate, timeZone: 'America/Chicago' },
          end: { dateTime: ev.endDate || ev.startDate, timeZone: 'America/Chicago' },
        };

        const createRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          { method: 'POST', headers: authHeader, body: JSON.stringify(gEvent) }
        );

        if (createRes.ok) {
          const created = await createRes.json();
          // Save the Google event ID back so we don't re-export
          await base44.entities.Event.update(ev.id, { googleEventId: created.id });
          exported++;
        }
      }

      return Response.json({ success: true, exported });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});