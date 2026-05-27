import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    console.log('🎤 speechToText v3 started');

    try {
        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
        }

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('📥 Body keys:', Object.keys(body).join(', '));
        console.log('📥 mime_type:', body.mime_type);

        if (!body.audio_base64) {
            return Response.json({ error: 'No audio_base64 provided' }, { status: 400 });
        }

        // Decode base64 to bytes
        const base64Clean = body.audio_base64.replace(/^data:[^;]+;base64,/, '');
        const binaryStr = atob(base64Clean);
        const audioBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            audioBytes[i] = binaryStr.charCodeAt(i);
        }
        console.log('📊 Decoded audio size:', audioBytes.byteLength, 'bytes');

        if (audioBytes.byteLength < 500) {
            throw new Error(`Audio too small (${audioBytes.byteLength} bytes) — recording may be empty`);
        }

        // Always send AAC/M4A audio as recording.m4a with audio/mp4 MIME
        // This is the correct way to present AAC to Whisper's REST API
        const filename = 'recording.m4a';
        const mimeType = 'audio/mp4';

        console.log('🔄 Sending to Whisper as:', filename, mimeType);

        const formData = new FormData();
        formData.append('file', new Blob([audioBytes], { type: mimeType }), filename);
        formData.append('model', 'whisper-1');

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
        });

        const result = await whisperRes.json();
        console.log('🔊 Whisper status:', whisperRes.status, JSON.stringify(result));

        if (!whisperRes.ok) {
            throw new Error(result?.error?.message || `Whisper API error ${whisperRes.status}`);
        }

        console.log('✅ Transcription:', result.text);
        return Response.json({ text: result.text, success: true });

    } catch (error) {
        console.error('❌ speechToText error:', error.message);
        return Response.json({
            error: 'Transcription failed',
            details: error.message
        }, { status: 500 });
    }
});