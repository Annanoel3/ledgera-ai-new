import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🎤 speechToText called');

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

        let audioBytes;
        let ext = 'mp4';

        if (body.audio_base64) {
            // Preferred path: base64 audio directly from Capacitor VoiceRecorder
            console.log('📦 Received base64 audio, mimeType:', body.mime_type);
            const rawMime = (body.mime_type || 'audio/mp4').toLowerCase();

            // Map MIME to Whisper-compatible extension
            // Send raw AAC as .m4a — Whisper's REST API accepts it when labeled as m4a
            if (rawMime.includes('webm')) ext = 'webm';
            else if (rawMime.includes('mp3') || rawMime.includes('mpeg')) ext = 'mp3';
            else if (rawMime.includes('wav')) ext = 'wav';
            else if (rawMime.includes('ogg')) ext = 'ogg';
            else if (rawMime.includes('aac')) ext = 'm4a'; // raw AAC → label as m4a for Whisper
            else ext = 'mp4';

            // Decode base64 to bytes
            const base64 = body.audio_base64.replace(/^data:[^;]+;base64,/, '');
            const binaryStr = atob(base64);
            audioBytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                audioBytes[i] = binaryStr.charCodeAt(i);
            }
        } else if (body.file_url) {
            // Fallback: download from URL
            console.log('📁 Downloading audio from URL:', body.file_url);
            const audioResponse = await fetch(body.file_url);
            if (!audioResponse.ok) {
                throw new Error(`Failed to download audio: ${audioResponse.status}`);
            }
            const buf = await audioResponse.arrayBuffer();
            audioBytes = new Uint8Array(buf);

            const urlPath = body.file_url.split('?')[0];
            const rawExt = urlPath.split('.').pop()?.toLowerCase() || 'mp4';
            ext = rawExt === 'm4a' || rawExt === 'aac' ? 'mp4' : rawExt;
        } else {
            return Response.json({ error: 'No audio_base64 or file_url provided' }, { status: 400 });
        }

        console.log('📊 Audio size:', audioBytes.byteLength, 'bytes, ext:', ext);

        if (audioBytes.byteLength < 500) {
            throw new Error(`Audio too small (${audioBytes.byteLength} bytes) — recording may be empty`);
        }

        // Send to OpenAI Whisper via raw fetch (avoids SDK multipart issues in Deno)
        const mimeType = ext === 'webm' ? 'audio/webm' :
                         ext === 'mp3'  ? 'audio/mpeg' :
                         ext === 'wav'  ? 'audio/wav'  :
                         ext === 'ogg'  ? 'audio/ogg'  :
                         ext === 'm4a'  ? 'audio/mp4'  :
                         'audio/mp4';

        const formData = new FormData();
        formData.append('file', new Blob([audioBytes], { type: mimeType }), `recording.${ext}`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        console.log('🔄 Sending to Whisper as', mimeType, `recording.${ext}`);

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
        });

        const result = await whisperRes.json();
        console.log('Whisper status:', whisperRes.status, result);

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