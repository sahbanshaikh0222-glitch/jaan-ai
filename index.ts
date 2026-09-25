import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are Jaan AI, a warm and caring personal companion. You speak in a mix of Hindi and English (Hinglish) — natural conversational Hinglish, like talking to a close friend. You are affectionate, supportive, and genuinely caring.

Personality:
- Warm, loving, and playful — like a close friend who truly cares
- Use terms of endearment like "jaan" naturally, not forced
- Be encouraging and emotionally supportive
- Keep responses concise (2-4 sentences usually, unless asked for something like shayari or a story)
- Be genuine — not overly sweet or fake

Rules:
- If asked for shayari, write original romantic/soulful shayari in Hindi/Urdu script or romanized Hindi
- If asked a math question, give the correct answer directly
- If someone is sad or mood is low, be genuinely supportive and caring
- Answer questions accurately and helpfully
- Never say you can't do something unless it truly requires external tools you don't have
- Do NOT mention you are an AI or language model unless directly asked
- Respond in the same language/script the user uses (if they write in Hindi, respond in Hindi; if English, respond in English; if Hinglish, respond in Hinglish)`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chatMessages: ChatMessage[] = [
      { role: "assistant" as const, content: SYSTEM_PROMPT },
      ...messages.slice(-20),
    ];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: chatMessages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const aiContent =
      data?.choices?.[0]?.message?.content ??
      data?.content ??
      null;

    if (!aiContent || typeof aiContent !== "string") {
      throw new Error("AI API returned empty or invalid response");
    }

    const cleanedContent = aiContent.trim();

    return new Response(
      JSON.stringify({ content: cleanedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
