import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();

    // Get Google Calendar access token from app user connector
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a04df00e62b57f635e00b0f');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Calendar not connected. Please connect it first.' }, { status: 400 });
    }

    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    console.log(`[SYNC] Action: ${action}, User: ${user.email}`);

    if (action === 'check') {
      // Verify the token is valid by making an actual API call and checking the status
      const checkRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', { headers: authHeader });
      if (!checkRes.ok) {
        return Response.json({ success: false, connected: false }, { status: 400 });
      }
      return Response.json({ success: true, connected: true });
    }

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
      const ledgeraEvents = await base44.entities.Event.list();
      const userEvents = ledgeraEvents.filter(ev => ev.created_by === user.email);
      
      console.log(`[EXPORT] Found ${userEvents.length} user events`);
      const toExport = userEvents.filter(ev => !ev.googleEventId && ev.startDate);
      console.log(`[EXPORT] Ready to export: ${toExport.length} events`);

      let exported = 0;
      for (const ev of toExport) {

        if (!ev.name) {
          console.log(`[EXPORT] Skipping event with empty name`);
          continue;
        }

        // Ensure RFC 3339 format with timezone for Google Calendar
        const toRFC3339 = (dateStr) => {
          if (!dateStr) return null;
          // If already has timezone (+ or Z), return as-is
          if (dateStr.includes('+') || dateStr.includes('Z') || /\-\d{2}:\d{2}$/.test(dateStr)) {
            return dateStr;
          }
          // Ensure format includes seconds, then add UTC timezone
          const parts = dateStr.split('T');
          if (parts[1] && !parts[1].includes(':')) return dateStr + 'Z';
          // Add seconds if only HH:MM present
          if (parts[1] && parts[1].split(':').length === 2) {
            return dateStr + ':00Z';
          }
          return dateStr + 'Z';
        };

        const gEvent = {
          summary: ev.name,
          start: { dateTime: toRFC3339(ev.startDate) },
          end: { dateTime: toRFC3339(ev.endDate || ev.startDate) },
        };
        if (ev.notes) gEvent.description = ev.notes;

        console.log(`[EXPORT] Creating event: ${ev.name}`);
        const createRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          { method: 'POST', headers: authHeader, body: JSON.stringify(gEvent) }
        );

        if (createRes.ok) {
          const created = await createRes.json();
          await base44.entities.Event.update(ev.id, { googleEventId: created.id });
          exported++;
          console.log(`[EXPORT] Success: ${ev.name} (Google ID: ${created.id})`);
        } else {
          const err = await createRes.text();
          console.error(`[EXPORT] Failed to export ${ev.id} (${ev.name}), status=${createRes.status}`);
          console.error(`[EXPORT] Response: ${err}`);
          console.error(`[EXPORT] Sent payload: ${JSON.stringify(gEvent)}`);
        }
      }

      console.log(`[EXPORT] Total exported: ${exported}`);
      return Response.json({ success: true, exported });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Google Calendar sync error:', error.message, error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});