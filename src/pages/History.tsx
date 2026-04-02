import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Clock, ExternalLink, FileText, MessageSquare, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getHistory, deleteFromHistory, clearHistory, type HistoryItem } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { setLoading(true); setItems(await getHistory()); setLoading(false); };
  const handleDelete = async (id: string) => { await deleteFromHistory(id); setItems(prev => prev.filter(i => i.id !== id)); };
  const handleClearAll = async () => { if (user) { await clearHistory(user.id); setItems([]); } };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> History
        </h1>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm">সব মুছুন</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>সব history মুছে ফেলবেন?</AlertDialogTitle>
                <AlertDialogDescription>এটি আর undo করা যাবে না।</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>মুছে ফেলুন</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">এখনো কোনো summary করা হয়নি।</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{formatDate(item.date)}</p>
                  <CardTitle className="text-base mt-1 line-clamp-2">{item.mainStory}</CardTitle>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="gap-1">
                    {item.inputType === "link" ? <><ExternalLink className="h-3 w-3" /> Link</> : <><FileText className="h-3 w-3" /> Transcript</>}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {expanded === item.id && (
              <CardContent className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Input:</p>
                  <p className="text-sm text-foreground line-clamp-3 break-all">{item.inputValue}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary text-sm mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {(item.bulletPoints || []).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
                {item.conversation && item.conversation.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary text-sm mb-2 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> চ্যাট ({item.conversation.length} messages)
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {item.conversation.map((msg, i) => (
                        <div key={i} className={`rounded-lg p-2.5 text-xs ${msg.role === "user" ? "bg-primary/10 text-foreground ml-6" : "bg-secondary text-secondary-foreground mr-4"}`}>
                          <p className="font-semibold text-muted-foreground mb-0.5">{msg.role === "user" ? "আপনি" : "AI"}</p>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button className="w-full gap-2" onClick={(e) => {
                  e.stopPropagation();
                  navigate("/app", { state: { fromHistory: true, historyId: item.id, inputValue: item.inputValue, mainStory: item.mainStory, bulletPoints: item.bulletPoints, howToApply: item.howToApply, conversation: item.conversation || [] } });
                }}>
                  <MessageCircle className="h-4 w-4" /> চ্যাট Continue করুন
                </Button>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
};

export default History;
