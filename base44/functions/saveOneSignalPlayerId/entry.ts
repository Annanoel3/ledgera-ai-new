import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('[saveOneSignalPlayerId] Unauthorized - no user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId } = await req.json();
    console.log('[saveOneSignalPlayerId] Called for user:', user.email, 'playerId:', playerId);

    if (!playerId) {
      return Response.json({ error: 'Missing playerId' }, { status: 400 });
    }

    // Get current user record
    const userRecords = await base44.asServiceRole.entities.User.filter({ email: user.email });
    
    if (!userRecords || userRecords.length === 0) {
      console.error('[saveOneSignalPlayerId] User not found in DB for email:', user.email);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = userRecords[0];
    const currentPlayerIds = userRecord.onesignal_player_ids || [];
    console.log('[saveOneSignalPlayerId] Current player IDs:', currentPlayerIds);

    if (!currentPlayerIds.includes(playerId)) {
      const updatedPlayerIds = [...currentPlayerIds, playerId];
      
      await base44.asServiceRole.entities.User.update(userRecord.id, {
        onesignal_player_ids: updatedPlayerIds
      });

      console.log(`[saveOneSignalPlayerId] ✅ Added player ID ${playerId} for user ${user.email}. Total IDs: ${updatedPlayerIds.length}`);

      return Response.json({
        success: true,
        message: 'Player ID saved',
        player_ids: updatedPlayerIds
      });
    }

    console.log(`[saveOneSignalPlayerId] Player ID ${playerId} already exists for ${user.email}`);
    return Response.json({
      success: true,
      message: 'Player ID already exists',
      player_ids: currentPlayerIds
    });

  } catch (error) {
    console.error('[saveOneSignalPlayerId] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});