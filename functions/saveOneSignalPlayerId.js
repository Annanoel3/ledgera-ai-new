import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId } = await req.json();

    if (!playerId) {
      return Response.json({ error: 'Missing playerId' }, { status: 400 });
    }

    // Get current user record
    const userRecords = await base44.entities.User.filter({ email: user.email });
    
    if (!userRecords || userRecords.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = userRecords[0];
    const currentPlayerIds = userRecord.onesignal_player_ids || [];

    // Add player ID if not already present
    if (!currentPlayerIds.includes(playerId)) {
      const updatedPlayerIds = [...currentPlayerIds, playerId];
      
      await base44.entities.User.update(userRecord.id, {
        onesignal_player_ids: updatedPlayerIds
      });

      console.log(`[Ledgera] Added player ID ${playerId} for user ${user.email}`);

      return Response.json({
        success: true,
        message: 'Player ID saved',
        player_ids: updatedPlayerIds
      });
    }

    return Response.json({
      success: true,
      message: 'Player ID already exists',
      player_ids: currentPlayerIds
    });

  } catch (error) {
    console.error('saveOneSignalPlayerId error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});