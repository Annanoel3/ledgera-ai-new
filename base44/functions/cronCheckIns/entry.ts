import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CRON_SECRET = Deno.env.get('CRON_SECRET');
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function isInQuietHours(user) {
  if (!user.quiet_hours_enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const startTime = parseTime(user.quiet_hours_start || '22:00');
  const endTime = parseTime(user.quiet_hours_end || '08:00');
  
  // Handles midnight spanning (e.g., 22:00 - 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  return currentTime >= startTime && currentTime <= endTime;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Accept CRON_SECRET in body (manual trigger) or empty/no-secret body (automation scheduler)
    const bodyText = await req.text();
    if (bodyText && bodyText.trim() !== '{}' && bodyText.trim() !== '') {
      let body = {};
      try { body = JSON.parse(bodyText); } catch {}
      if (body.secret && body.secret !== CRON_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    
    let processedCount = 0;
    let checkInsScanned = 0;
    let checkInsSent = 0;
    const errors = [];

    for (const user of users) {
      try {
        processedCount++;

        // Check quiet hours
        if (isInQuietHours(user)) {
          console.log(`[Ledgera Cron] User ${user.email} is in quiet hours, skipping`);
          continue;
        }

        // Check notification settings
        const notificationSettings = user.notification_settings || {};
        if (notificationSettings.check_ins === false) {
          console.log(`[Ledgera Cron] User ${user.email} has disabled check-ins, skipping`);
          continue;
        }

        // Get pending check-ins for this user
        const now = new Date();
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);

        const pendingCheckIns = await base44.asServiceRole.entities.ScheduledCheckIn.filter({
          userEmail: user.email,
          sent: false
        });

        checkInsScanned += pendingCheckIns.length;

        for (const checkIn of pendingCheckIns) {
          const scheduledTime = new Date(checkIn.scheduledFor);

          // Check if it's time to send (within next 15 minutes to match cron interval)
          if (scheduledTime <= fifteenMinutesFromNow) {
            try {
              // Get user's profile for personalization
              const profiles = await base44.asServiceRole.entities.UserProfile.filter({
                created_by: user.email
              });

              const profile = profiles[0];
              const profession = profile?.professions?.[0] || 'your business';

              // Construct message based on check-in type
              let title, body;
              
              if (checkIn.type === 'after_event') {
                title = `💼 How did ${checkIn.eventName} go?`;
                body = `Quick check-in: Did you have any income or expenses from ${checkIn.eventName}? Let me know so I can update your books!`;
              } else if (checkIn.type === 'weekly') {
                title = '📊 Weekly Financial Check-In';
                body = `Hey! Let's review your week. Any income, expenses, or projects for ${profession} you'd like to log?`;
              } else {
                title = '💰 Financial Check-In';
                body = 'Time to update your books! Any transactions to log?';
              }

              // Get player IDs
              const playerIds = user.onesignal_player_ids || [];

              if (playerIds.length > 0) {
                // Send notification via OneSignal REST API
                const notification = {
                  app_id: ONESIGNAL_APP_ID,
                  include_player_ids: playerIds,
                  headings: { en: title },
                  contents: { en: body },
                  data: {
                    type: 'check_in',
                    check_in_id: checkIn.id,
                    screen: '/Chat'
                  },
                  ios_sound: 'default',
                  android_sound: 'default',
                  android_channel_id: 'ledgera_default'
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

                if (response.ok) {
                  console.log(`[Ledgera Cron] Sent notification to ${user.email}:`, result);
                  checkInsSent++;

                  // Also create a conversation prompt
                  const conversationPrompt = `${title}\n\n${body}`;
                  
                  await base44.asServiceRole.entities.Conversation.create({
                    userEmail: user.email,
                    name: title,
                    messages: [{
                      role: 'assistant',
                      content: conversationPrompt
                    }],
                    createdAt: new Date().toISOString()
                  });

                  // Mark as sent
                  await base44.asServiceRole.entities.ScheduledCheckIn.update(checkIn.id, {
                    sent: true,
                    sentAt: new Date().toISOString()
                  });
                } else {
                  console.error(`[Ledgera Cron] Failed to send to ${user.email}:`, result);
                  errors.push(`Failed to send to ${user.email}: ${JSON.stringify(result)}`);
                }
              } else {
                console.log(`[Ledgera Cron] User ${user.email} has no player IDs, skipping notification`);
                
                // Still create conversation and mark as sent
                const conversationPrompt = `${title}\n\n${body}`;
                
                await base44.asServiceRole.entities.Conversation.create({
                  userEmail: user.email,
                  name: title,
                  messages: [{
                    role: 'assistant',
                    content: conversationPrompt
                  }],
                  createdAt: new Date().toISOString()
                });

                await base44.asServiceRole.entities.ScheduledCheckIn.update(checkIn.id, {
                  sent: true,
                  sentAt: new Date().toISOString()
                });
                
                checkInsSent++;
              }
            } catch (error) {
              console.error(`[Ledgera Cron] Error processing check-in ${checkIn.id}:`, error);
              errors.push(`Check-in ${checkIn.id}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error(`[Ledgera Cron] Error processing user ${user.email}:`, error);
        errors.push(`User ${user.email}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      users_processed: processedCount,
      check_ins_scanned: checkInsScanned,
      check_ins_sent: checkInsSent,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('[Ledgera Cron] Fatal error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});