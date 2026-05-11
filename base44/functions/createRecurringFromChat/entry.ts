import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, name, amount, frequency, customDays, startDate, notes } = await req.json();

    if (!projectId || !name || !amount || !frequency || !startDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create recurring subscription
    const subscription = await base44.asServiceRole.entities.RecurringSubscription.create({
      projectId,
      name,
      amount: parseFloat(amount),
      frequency,
      customDays: frequency === 'custom' ? parseInt(customDays) : null,
      category: 'subscriptions',
      startDate,
      lastChargeDate: startDate,
      notes,
      active: true,
      created_by: user.email
    });

    // Create first expense immediately
    await base44.asServiceRole.entities.ExpenseItem.create({
      projectId,
      amount: parseFloat(amount),
      date: startDate,
      category: 'subscriptions',
      vendor: name,
      notes: `Recurring subscription: ${name}`,
      created_by: user.email
    });

    return Response.json({
      success: true,
      subscription
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});