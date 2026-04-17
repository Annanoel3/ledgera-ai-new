import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      toUserExternalId, 
      title, 
      body, 
      sendAtISO, 
      minutesFromNow,
      data,
      android_channel_id 
    } = await req.json();

    if (!toUserExternalId || !title || !body) {
      return Response.json({ 
        error: 'Missing required fields: toUserExternalId, title, body' 
      }, { status: 400 });
    }

    if (!sendAtISO && !minutesFromNow) {
      return Response.json({ 
        error: 'Must provide either sendAtISO or minutesFromNow' 
      }, { status: 400 });
    }

    // Calculate send_after timestamp
    let sendAfter;
    if (sendAtISO) {
      sendAfter = sendAtISO;
    } else {
      const now = new Date();
      const sendDate = new Date(now.getTime() + minutesFromNow * 60000);
      sendAfter = sendDate.toISOString();
    }

    // Send to OneSignal REST API
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return Response.json({ error: 'OneSignal credentials not configured' }, { status: 500 });
    }

    const notification = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [toUserExternalId],
      headings: { en: title },
      contents: { en: body },
      send_after: sendAfter,
      data: data || {},
      ios_sound: 'default',
      android_sound: 'default',
      android_channel_id: android_channel_id || 'ledgera_default',
      channel_for_external_user_ids: 'push'
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(notification)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return Response.json({ 
        success: false, 
        error: result 
      }, { status: response.status });
    }

    return Response.json({
      success: true,
      notification_id: result.id,
      send_after: sendAfter
    });

  } catch (error) {
    console.error('schedulePush error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});