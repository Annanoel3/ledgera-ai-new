import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active recurring subscriptions for this user
    const subscriptions = await base44.asServiceRole.entities.RecurringSubscription.filter({
      active: true,
      created_by: user.email
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    let processed = 0;
    let errors = [];

    for (const sub of subscriptions) {
      try {
        // Check if subscription has ended
        if (sub.endDate && new Date(sub.endDate) < today) {
          // Deactivate ended subscription
          await base44.asServiceRole.entities.RecurringSubscription.update(sub.id, {
            active: false
          });
          continue;
        }

        // Calculate next charge date
        const lastCharge = sub.lastChargeDate ? new Date(sub.lastChargeDate) : new Date(sub.startDate);
        const nextCharge = new Date(lastCharge);

        if (sub.frequency === 'monthly') {
          nextCharge.setMonth(nextCharge.getMonth() + 1);
        } else if (sub.frequency === 'yearly') {
          nextCharge.setFullYear(nextCharge.getFullYear() + 1);
        } else if (sub.frequency === 'weekly') {
          nextCharge.setDate(nextCharge.getDate() + 7);
        } else if (sub.frequency === 'custom' && sub.customDays) {
          nextCharge.setDate(nextCharge.getDate() + sub.customDays);
        }

        nextCharge.setHours(0, 0, 0, 0);
        const nextChargeString = nextCharge.toISOString().split('T')[0];

        // If it's time to charge, create expense
        if (nextChargeString <= todayString) {
          // Create expense
          await base44.asServiceRole.entities.ExpenseItem.create({
            projectId: sub.projectId,
            amount: sub.amount,
            date: todayString,
            category: sub.category,
            vendor: sub.name,
            notes: `Auto-recurring: ${sub.name}`,
            created_by: user.email
          });

          // Update last charge date
          await base44.asServiceRole.entities.RecurringSubscription.update(sub.id, {
            lastChargeDate: todayString
          });

          processed++;
        }
      } catch (error) {
        errors.push({
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      processed,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});