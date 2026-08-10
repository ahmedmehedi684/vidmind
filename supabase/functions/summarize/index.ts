import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderEndpoint {
  url: string;
  headers: (apiKey: string) => Record<string, string>;
  isAnthropic?: boolean;
  extractContent: (data: any) => string | null;
}

function getProviderEndpoint(provider: string): ProviderEndpoint {
  const openaiCompatible = (url: string): ProviderEndpoint => ({
    url,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
    extractContent: (d) => d.choices?.[0]?.message?.content,
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
        headers: (key) => ({
          "x-api-key": key, "Content-Type": "application/json", "anthropic-version": "2023-06-01",
        }),
        isAnthropic: true,
        extractContent: (d) => d.content?.find((b: any) => b.type === "text")?.text || null,
      };
    case "groq":
    default:
      return openaiCompatible("https://api.groq.com/openai/v1/chat/completions");
  }
}

function buildBody(ep: ProviderEndpoint, model: string, messages: any[], temp: number, maxTok: number, jsonMode: boolean) {
  if (ep.isAnthropic) {
    const sys = messages.find((m: any) => m.role === "system");
    const rest = messages.filter((m: any) => m.role !== "system");
    return { model, max_tokens: maxTok, temperature: temp, ...(sys ? { system: sys.content } : {}), messages: rest };
  }
  return {
    model, messages, temperature: temp, max_tokens: maxTok,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  };
}

function buildSystemPrompt() {
  return `You are an expert content analyst who specializes in extracting key insights from video transcripts on any topic. Analyze the given transcript and return a JSON object with exactly this structure:

{
  "mainStory": "মূল বিষয়ের সারাংশ বাংলায়",
  "bulletPoints": ["পয়েন্ট ১", "পয়েন্ট ২", ...],
  "howToApply": [
    {"title": "শিরোনাম", "detail": "বিস্তারিত বর্ণনা"}
  ]
}

RULES:
- Return ONLY valid JSON, no markdown, no code blocks, no extra text
- All content MUST be in Bengali (বাংলা)
- bulletPoints: Include as many key points as the content naturally has (typically 5-10). Don't force a fixed number — extract what's important.
- howToApply should have 3-5 practical actionable takeaways from the video
- Keep mainStory concise but informative (2-3 sentences)
- Adapt your analysis to the video's topic`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, provider = "groq", model = "llama-3.3-70b-versatile", apiKey } = await req.json();

    // Fall back to the server-side Groq key when the user has not saved their own key
    const effectiveKey = apiKey?.trim() || (provider === "groq" ? Deno.env.get("GROQ_API_KEY") : null) || null;

    if (!effectiveKey) {
      return new Response(
        JSON.stringify({ error: `${provider} এর API Key দিন। Settings page-এ গিয়ে key সেট করুন।` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: "Transcript দিতে হবে" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Keep the transcript within the model context window (~roughly 4 chars per token)
    const MAX_CHARS = 40000;
    const safeContent = content.length > MAX_CHARS
      ? content.slice(0, MAX_CHARS) + "\n\n[transcript truncated]"
      : content;

    const ep = getProviderEndpoint(provider);
    const messages = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: `এই transcript টি বিশ্লেষণ করো:\n\n${safeContent}` },
    ];

    const jsonMode = !ep.isAnthropic;
    let res = await fetch(ep.url, {
      method: "POST",
      headers: ep.headers(effectiveKey),
      body: JSON.stringify(buildBody(ep, model, messages, 0.3, 2000, jsonMode)),
    });

    // Some models reject response_format json_object — retry once without it
    if (!res.ok && jsonMode && (res.status === 400 || res.status === 422)) {
      res = await fetch(ep.url, {
        method: "POST",
        headers: ep.headers(effectiveKey),
        body: JSON.stringify(buildBody(ep, model, messages, 0.3, 2000, false)),
      });
    }


    if (!res.ok) {
      const errText = await res.text();
      console.error(`${provider} API error:`, res.status, errText);
      const status = res.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({ error: status === 429 ? "Rate limit — কিছুক্ষণ পর চেষ্টা করুন" : `AI API error (${res.status})` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const aiContent = ep.extractContent(data);

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      let jsonStr = aiContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      return new Response(
        JSON.stringify({ error: "AI response parse error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
