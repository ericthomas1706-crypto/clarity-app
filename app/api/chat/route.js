export async function POST(req) {
  try {
    const { messages, system } = await req.json();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system,
        messages
      }),
    });
    const data = await res.json();
    if (data.error) return Response.json({ content: "Erreur: " + data.error.message });
    const content = data.content?.map(b => b.text || "").join("") || "Je suis là. 💙";
    return Response.json({ content });
  } catch(e) {
    return Response.json({ content: "Erreur de connexion. 🔄" });
  }
}
