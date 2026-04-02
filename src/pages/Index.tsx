import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, RefreshCw, Link2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { addToHistory, updateHistoryConversation } from "@/lib/history";
import { getSettings, syncSettingsFromDb, hasAnyKey } from "@/lib/settings";
import { useAuth } from "@/contexts/AuthContext";
import FollowUpSection from "@/components/FollowUpSection";

interface HowToApplyItem { title: string; detail: string; }
interface SummaryResult { mainStory: string; bulletPoints: string[]; howToApply: HowToApplyItem[]; }

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

async function fetchTranscriptClientSide(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Fetch the YouTube watch page via a CORS proxy or directly
  // We use the YouTube page to extract caption track URLs
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Use a proxy approach - fetch through our edge function which just proxies the HTML
  const { data, error } = await supabase.functions.invoke("get-transcript", {
    body: { url: videoUrl },
  });

  if (error) throw new Error("Could not contact transcript service");

  if (data?.available && data?.transcript) {
    return data.transcript;
  }

  // If server-side extraction failed, throw with helpful message
  throw new Error(data?.message || "Could not extract transcript automatically");
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<"link" | "transcript">("link");
  const [linkValue, setLinkValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [transcriptReady, setTranscriptReady] = useState(false);
  const [initialConversation, setInitialConversation] = useState<{ role: "user" | "assistant"; content: string }[] | undefined>();

  useEffect(() => {
    const checkKeys = async () => {
      if (hasAnyKey()) return;
      if (user) {
        const synced = await syncSettingsFromDb();
        if (synced) return;
      }
      navigate("/app-settings?setup=true", { replace: true });
    };
    checkKeys();
  }, [navigate, user]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.fromHistory) {
      setInputValue(state.inputValue || "");
      setResult({ mainStory: state.mainStory, bulletPoints: state.bulletPoints || [], howToApply: state.howToApply || [] });
      setDone(true);
      setHistoryId(state.historyId);
      setInitialConversation(state.conversation || []);
      navigate("/app-summarizer", { replace: true, state: null });
    }
  }, []);

  const handleFetchTranscript = async () => {
    setError("");
    if (!linkValue.trim()) { setError("Please paste a YouTube URL"); return; }

    const videoId = extractVideoId(linkValue);
    if (!videoId) { setError("Invalid YouTube URL. Please use a valid youtube.com or youtu.be link."); return; }

    setIsFetchingTranscript(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-transcript", {
        body: { url: linkValue },
      });

      if (fnError) {
        throw new Error("Could not contact the transcript service. Please try again.");
      }

      if (data?.available && data?.transcript) {
        setInputValue(data.transcript);
        setTranscriptReady(true);
        return;
      }

      // Server couldn't get transcript — show manual paste UI with the link pre-filled
      setMode("transcript");
      setError("Automatic transcript extraction is currently unavailable for this video. Please paste the transcript manually — go to YouTube → click '...more' below the video → 'Show transcript' → copy all text.");
    } catch (e) {
      setMode("transcript");
      setError(e instanceof Error ? e.message : "Failed to fetch transcript. Please paste manually.");
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  const handleSubmit = async () => {
    setError(""); setResult(null); setDone(false);
    if (!inputValue.trim()) { setError("Please paste a transcript"); return; }
    setIsLoading(true);
    try {
      const aiSettings = getSettings();
      const { data, error: fnError } = await supabase.functions.invoke("summarize", {
        body: { content: inputValue, provider: aiSettings.provider, model: aiSettings.model, apiKey: aiSettings.apiKey },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const summary = data as SummaryResult;
      setResult(summary); setDone(true);
      if (user) {
        const id = await addToHistory({ inputType: mode, inputValue, mainStory: summary.mainStory, bulletPoints: summary.bulletPoints || [], howToApply: summary.howToApply || [] }, user.id);
        setHistoryId(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setIsLoading(false); }
  };

  const handleReset = () => {
    setInputValue(""); setLinkValue(""); setResult(null); setError(""); setDone(false); setHistoryId(null); setTranscriptReady(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          <span className="text-primary">Summarizer</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-base">Paste a YouTube video link or transcript to get a summary</p>
      </div>

      {!done && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => { setMode("link"); setError(""); setTranscriptReady(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mode === "link" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
              >
                <Link2 className="h-4 w-4" /> YouTube Link
              </button>
              <button
                onClick={() => { setMode("transcript"); setError(""); setTranscriptReady(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mode === "transcript" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
              >
                <FileText className="h-4 w-4" /> Transcript
              </button>
            </div>

            {mode === "link" && !transcriptReady && (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Paste a YouTube video link — we'll automatically try to extract the transcript
                </p>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  className="h-12"
                />
                <Button className="w-full text-base font-semibold h-12" onClick={handleFetchTranscript} disabled={isFetchingTranscript}>
                  {isFetchingTranscript ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Extracting transcript...</span>
                  ) : (
                    <span className="flex items-center gap-1">Get Transcript <ChevronRight className="h-5 w-5" /></span>
                  )}
                </Button>
              </>
            )}

            {mode === "link" && transcriptReady && (
              <>
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertDescription className="text-sm text-primary font-medium">
                    ✅ Transcript successfully extracted! Ready to summarize.
                  </AlertDescription>
                </Alert>
                <div className="max-h-40 overflow-y-auto rounded-md border border-border p-3 text-xs text-muted-foreground bg-muted/20">
                  {inputValue.slice(0, 500)}{inputValue.length > 500 ? "..." : ""}
                </div>
                <Button className="w-full text-base font-semibold h-12" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> AI is analyzing...</span>
                  ) : (
                    <span className="flex items-center gap-1">Summarize <ChevronRight className="h-5 w-5" /></span>
                  )}
                </Button>
              </>
            )}

            {mode === "transcript" && (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Paste the YouTube video transcript. On YouTube, click "...more" below the video → "Show transcript" → copy all text.
                </p>
                <Textarea placeholder="Paste transcript here..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={6} />
                <Button className="w-full text-base font-semibold h-12" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> AI is analyzing...</span>
                  ) : (
                    <span className="flex items-center gap-1">Summarize <ChevronRight className="h-5 w-5" /></span>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {done && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> New Summary
          </Button>
        </div>
      )}

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {result && (
        <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader><CardTitle className="text-xl text-primary">Main Story</CardTitle></CardHeader>
            <CardContent><p className="text-secondary-foreground leading-relaxed">{result.mainStory}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-xl text-primary">Key Points</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(result.bulletPoints || []).map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-secondary-foreground">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />{point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-xl text-primary">এই ভিডিও থেকে কী শিখলাম / কী করবো?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(result.howToApply || []).map((item, i) => (
                <div key={i} className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-muted-foreground text-sm mt-1">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {result && done && (
        <FollowUpSection
          transcript={inputValue}
          summary={result}
          initialConversation={initialConversation}
          onConversationUpdate={(conv) => { if (historyId) updateHistoryConversation(historyId, conv); }}
        />
      )}
    </div>
  );
};

export default Index;
