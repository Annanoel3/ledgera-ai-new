import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { type } = body; // 'after_event' or 'weekly'

        // Create a test check-in scheduled for right now (so it fires immediately)
        const testCheckIn = await base44.entities.ScheduledCheckIn.create({
            userEmail: user.email,
            type: type || 'after_event',
            scheduledFor: new Date().toISOString(), // Right now
            eventName: type === 'after_event' ? 'Test Wedding Gig' : '',
            projectId: '',
            sent: false
        });

        // Now manually trigger the cron job
        const CRON_SECRET = Deno.env.get('CRON_SECRET');
        const cronUrl = `${new URL(req.url).origin}/api/cronCheckIns?secret=${CRON_SECRET}`;
        
        const cronResponse = await fetch(cronUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const cronResult = await cronResponse.json();

        return Response.json({
            success: true,
            testCheckInCreated: testCheckIn,
            cronJobResult: cronResult,
            message: 'Test check-in created and cron job triggered. Check your notifications!'
        });

    } catch (error) {
        console.error('Error in testCheckIn:', error);
        return Response.json({ 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});