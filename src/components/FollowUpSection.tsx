import { useState, useEffect, useRef } from "react";
import { Loader2, Send, MessageSquare, BookOpen, HelpCircle, ListChecks, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/settings";

interface SummaryResult {
  mainStory: string;
  bulletPoints: string[];
  howToApply: { title: string; detail: string }[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface FollowUpSectionProps {
  transcript: string;
  summary: SummaryResult;
  initialConversation?: ConversationMessage[];
  onConversationUpdate?: (conversation: ConversationMessage[]) => void;
}

const PRESET_COMMANDS = [
  { label: "আরো বিস্তারিত বলো", icon: BookOpen, command: "এই ভিডিওর মূল বিষয়টি আরো বিস্তারিতভাবে ব্যাখ্যা করো" },
  { label: "সহজ ভাষায় বলো", icon: Languages, command: "পুরো summary টা খুব সহজ ভাষায় বুঝিয়ে বলো যাতে একজন beginner ও বুঝতে পারে" },
  { label: "Quiz বানাও", icon: HelpCircle, command: "এই ভিডিওর content থেকে ৫টি multiple choice quiz question বানাও উত্তরসহ" },
  { label: "Action Plan দাও", icon: ListChecks, command: "এই ভিডিও থেকে শেখা জিনিসগুলো implement করার জন্য একটি step-by-step action plan দাও" },
];

const FollowUpSection = ({ transcript, summary, initialConversation, onConversationUpdate }: FollowUpSectionProps) => {
  const [customCommand, setCustomCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>(initialConversation || []);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(!initialConversation?.length);
  const hasFetchedRecs = useRef(!!initialConversation?.length);

  // Auto-fetch content-specific recommendations on mount
  useEffect(() => {
    if (hasFetchedRecs.current) return;
    hasFetchedRecs.current = true;

    const fetchRecommendations = async () => {
      try {
        const aiSettings = getSettings();
        const { data, error } = await supabase.functions.invoke("follow-up", {
          body: {
            transcript,
            summary,
            conversationHistory: [],
            userMessage: `এই ভিডিওর content analyze করে আমাকে ৪-৫টি specific recommendation দাও যে আমি এই content নিয়ে কী কী করতে পারি। প্রতিটি recommendation এক লাইনে দাও, শুধু recommendation গুলো দাও, অন্য কিছু বলো না। প্রতিটি লাইন "•" দিয়ে শুরু করো।`,
            provider: aiSettings.provider,
            model: aiSettings.model,
            apiKey: aiSettings.apiKey,
          },
        });

        if (!error && data?.response) {
          const lines = data.response
            .split("\n")
            .map((l: string) => l.replace(/^[•\-\*]\s*/, "").trim())
            .filter((l: string) => l.length > 5);
          setRecommendations(lines.slice(0, 5));
        }
      } catch {
        // silently fail, presets will still work
      } finally {
        setIsLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [transcript, summary]);

  const sendFollowUp = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ConversationMessage = { role: "user", content: message };
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    setCustomCommand("");
    setIsLoading(true);

    try {
      const aiSettings = getSettings();
      const { data, error } = await supabase.functions.invoke("follow-up", {
        body: {
          transcript,
          summary,
          conversationHistory: conversation,
          userMessage: message,
          provider: aiSettings.provider,
          model: aiSettings.model,
          apiKey: aiSettings.apiKey,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: data.response,
      };
      const newConv = [...updatedConversation, assistantMsg];
      setConversation(newConv);
      onConversationUpdate?.(newConv);
    } catch {
      const errorMsg: ConversationMessage = {
        role: "assistant",
        content: "দুঃখিত, AI এখন ব্যস্ত আছে। অনুগ্রহ করে ১০-১৫ সেকেন্ড পর আবার চেষ্টা করুন।",
      };
      setConversation([...updatedConversation, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          আরো জানতে চান?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI-generated recommendations */}
        {conversation.length === 0 && (
          <div className="space-y-3">
            {isLoadingRecs ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-secondary rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  আপনার content অনুযায়ী recommendation তৈরি করছে...
                </span>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <Sparkles className="h-3 w-3" />
                  আপনার content অনুযায়ী AI Recommendations
                </p>
                <div className="grid gap-2">
                  {recommendations.map((rec, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="h-auto py-2.5 px-4 text-left justify-start text-sm whitespace-normal leading-relaxed border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => sendFollowUp(rec)}
                      disabled={isLoading}
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary mr-2" />
                      <span>{rec}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Generic preset buttons */}
            <div className="grid grid-cols-2 gap-2">
              {PRESET_COMMANDS.map((preset, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto py-3 px-4 text-left justify-start gap-2 text-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  onClick={() => sendFollowUp(preset.command)}
                  disabled={isLoading}
                >
                  <preset.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span>{preset.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation history */}
        {conversation.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground ml-8"
                    : "bg-secondary text-secondary-foreground mr-4"
                }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <p className="text-xs font-semibold mb-1 text-muted-foreground">
                  {msg.role === "user" ? "আপনি" : "AI"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-secondary rounded-lg p-3 mr-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                চিন্তা করছে...
              </div>
            )}
          </div>
        )}

        {/* Preset buttons after conversation */}
        {conversation.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2">
            {PRESET_COMMANDS.map((preset, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="text-xs h-8 gap-1 text-muted-foreground hover:text-primary"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => sendFollowUp(preset.command)}
                disabled={isLoading}
              >
                <preset.icon className="h-3 w-3" />
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Custom input */}
        <div className="flex gap-2">
          <Input
            placeholder="নিজের command লিখুন..."
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendFollowUp(customCommand)}
            disabled={isLoading}
            className="flex-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          <Button
            size="icon"
            onClick={() => sendFollowUp(customCommand)}
            disabled={isLoading || !customCommand.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUpSection;
