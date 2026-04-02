import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getProviderEndpoint(provider: string) {
  const openaiCompatible = (url: string) => ({
    url,
    headers: (key: string) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
    isAnthropic: false,
    buildBody: (model: string, messages: any[], temp: number, maxTok: number) => ({
      model, messages, temperature: temp, max_tokens: maxTok,
    }),
    extract: (d: any) => d.choices?.[0]?.message?.content,
  });

  switch (provider) {
    case "openrouter":
      return openaiCompatible("https://openrouter.ai/api/v1/chat/completions");
    case "openai":
      return openaiCompatible("https://api.openai.com/v1/chat/completions");
    case "gemini":
      return openaiCompatible("https://generativelanguage.googleapis.com/v1beta/chat/completions");
    case "deepseek":
      return openaiCompatible("https://api.deepseek.com/chat/completions");
    case "mistral":
      return openaiCompatible("https://api.mistral.ai/v1/chat/completions");
    case "together":
      return openaiCompatible("https://api.together.xyz/v1/chat/completions");
    case "fireworks":
      return openaiCompatible("https://api.fireworks.ai/inference/v1/chat/completions");
    case "perplexity":
      return openaiCompatible("https://api.perplexity.ai/chat/completions");
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/messages",
        headers: (key: string) => ({
          "x-api-key": key, "Content-Type": "application/json", "anthropic-version": "2023-06-01",
        }),
        isAnthropic: true,
        buildBody: (model: string, messages: any[], temp: number, maxTok: number) => {
          const sys = messages.find((m: any) => m.role === "system");
          const rest = messages.filter((m: any) => m.role !== "system");
          return { model, max_tokens: maxTok, temperature: temp, ...(sys ? { system: sys.content } : {}), messages: rest };
        },
        extract: (d: any) => d.content?.find((b: any) => b.type === "text")?.text || null,
      };
    case "groq":
    default:
      return openaiCompatible("https://api.groq.com/openai/v1/chat/completions");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, summary, conversationHistory, userMessage, provider = "groq", model = "llama-3.3-70b-versatile", apiKey } = await req.json();

    const effectiveKey = apiKey?.trim() || null;

    if (!effectiveKey) {
      return new Response(
        JSON.stringify({ error: `${provider} এর API Key দিন। Settings page-এ গিয়ে key সেট করুন।` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userMessage?.trim()) {
      return new Response(
        JSON.stringify({ error: "কমান্ড দিতে হবে" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const truncatedTranscript = transcript && transcript.length > 3000
      ? transcript.substring(0, 3000) + "\n...[truncated]"
      : transcript;

    const systemPrompt = `You are an expert content analyst assistant. You previously analyzed a video transcript and produced a summary. Now the user wants to ask follow-up questions or give commands about the same content.

ORIGINAL TRANSCRIPT (for reference):
${truncatedTranscript}

SUMMARY YOU PRODUCED:
Main Story: ${summary.mainStory}
Key Points: ${(summary.bulletPoints || []).join(", ")}
Takeaways: ${(summary.howToApply || []).map((h: any) => `${h.title}: ${h.detail}`).join("; ")}

RULES:
- Always respond in Bengali (বাংলা)
- Use the transcript and summary as context to answer
- Be helpful, concise, and actionable
- When giving recommendations, make them SPECIFIC to the video's topic
- Format your response clearly with proper structure`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: userMessage });

    const ep = getProviderEndpoint(provider);

    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 5000));

      res = await fetch(ep.url, {
        method: "POST",
        headers: ep.headers(effectiveKey),
        body: JSON.stringify(ep.buildBody(model, messages, 0.4, 1500)),
      });

      if (res.ok || res.status !== 429) break;
      console.log(`Rate limited, retrying attempt ${attempt + 1}...`);
    }

    if (!res || !res.ok) {
      const errText = res ? await res.text() : "No response";
      console.error(`${provider} API error:`, res?.status, errText);
      const status = res?.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({ error: status === 429 ? "Rate limit — কিছুক্ষণ পর চেষ্টা করুন" : `AI API error (${res?.status})` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const aiContent = ep.extract(data);

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ response: aiContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("follow-up error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
