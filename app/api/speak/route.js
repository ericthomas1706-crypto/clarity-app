export async function POST(req) {
  try {
    const { text } = await req.json();
    const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah - voix chaleureuse ElevenLabs
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }
      })
    });
    if (!res.ok) return new Response("Error", { status: 500 });
    const audio = await res.arrayBuffer();
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg" } });
  } catch(e) {
    return new Response("Error", { status: 500 });
  }
}
