import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();
    if (!itemId) {
      return Response.json({ error: 'itemId is required' }, { status: 400 });
    }

    try {
      await base44.entities.ExpenseItem.delete(itemId);
    } catch (deleteError) {
      // If item doesn't exist, treat as success (already deleted)
      if (deleteError.message && deleteError.message.includes('not found')) {
        return Response.json({ success: true });
      }
      throw deleteError;
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});