import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function decodeHtml(text: string) {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function pickMeta(html: string, prop: string): string | null {
  // Match both property="og:image" and name="twitter:image"
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*?content=["']([^"']+)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*?(?:property|name)=["']${prop}["']`,
    "i"
  );
  const m = html.match(re) || html.match(alt);
  return m ? decodeHtml(m[1].trim()) : null;
}

function absoluteUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!pageRes.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch (${pageRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageRes.text();
    const finalUrl = pageRes.url;

    const image =
      pickMeta(html, "og:image") ||
      pickMeta(html, "og:image:secure_url") ||
      pickMeta(html, "twitter:image") ||
      pickMeta(html, "twitter:image:src");

    const title =
      pickMeta(html, "og:title") ||
      pickMeta(html, "twitter:title") ||
      (() => {
        const t = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return t ? decodeHtml(t[1].trim()) : null;
      })();

    const description =
      pickMeta(html, "og:description") ||
      pickMeta(html, "twitter:description") ||
      pickMeta(html, "description");

    return new Response(
      JSON.stringify({
        image: image ? absoluteUrl(image, finalUrl) : null,
        title: title || null,
        description: description || null,
        url: finalUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
