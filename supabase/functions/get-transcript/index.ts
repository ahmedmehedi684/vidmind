import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRANSCRIPT_SOURCE = "https://inv.nadeko.net";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function decodeHtml(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseTranscriptXml(xml: string): string {
  const textParts: string[] = [];
  const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const text = decodeHtml(match[1])
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (text) textParts.push(text);
  }

  return textParts.join(" ").trim();
}

async function fetchTranscript(videoId: string): Promise<string> {
  const captionsResponse = await fetch(`${TRANSCRIPT_SOURCE}/api/v1/captions/${videoId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!captionsResponse.ok) {
    throw new Error("Transcript source is temporarily unavailable.");
  }

  const captionsData = await captionsResponse.json();
  const captions = captionsData?.captions;

  if (!Array.isArray(captions) || captions.length === 0) {
    throw new Error("No captions available for this video.");
  }

  const preferredCaption =
    captions.find((caption: { languageCode?: string; label?: string }) => caption.languageCode === "en") ||
    captions.find((caption: { label?: string }) => caption.label?.toLowerCase().includes("english")) ||
    captions[0];

  const captionUrl = preferredCaption?.url;
  if (!captionUrl) {
    throw new Error("Caption URL is missing.");
  }

  const transcriptResponse = await fetch(`${TRANSCRIPT_SOURCE}${captionUrl}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!transcriptResponse.ok) {
    throw new Error("Transcript file could not be fetched.");
  }

  const transcriptText = await transcriptResponse.text();
  const contentType = transcriptResponse.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const transcriptJson = JSON.parse(transcriptText);
    const body = Array.isArray(transcriptJson?.transcript)
      ? transcriptJson.transcript.map((item: { text?: string }) => item.text || "").join(" ")
      : Array.isArray(transcriptJson)
        ? transcriptJson.map((item: { text?: string }) => item.text || "").join(" ")
        : "";

    if (body.trim()) return body.replace(/\s+/g, " ").trim();
  }

  if (transcriptText.includes("<text")) {
    const parsedXml = parseTranscriptXml(transcriptText);
    if (parsedXml) return parsedXml;
  }

  if (transcriptText.trim()) {
    return transcriptText.replace(/\s+/g, " ").trim();
  }

  throw new Error("Automatic transcript extraction is unavailable for this video right now.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "YouTube URL is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL. Please use a valid youtube.com or youtu.be link." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const transcript = await fetchTranscript(videoId);

      return new Response(JSON.stringify({
        available: true,
        needsManualTranscript: false,
        transcript,
        videoId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automatic transcript extraction is unavailable for this video right now.";

      return new Response(JSON.stringify({
        available: false,
        needsManualTranscript: true,
        transcript: "",
        videoId,
        message: `${message} Please switch to Transcript mode and paste the transcript manually.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({
      available: false,
      needsManualTranscript: true,
      transcript: "",
      message: "Automatic transcript extraction is unavailable right now. Please switch to Transcript mode and paste the transcript manually.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
