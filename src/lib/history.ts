import { supabase } from "@/integrations/supabase/client";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  inputType: "link" | "transcript";
  inputValue: string;
  mainStory: string;
  bulletPoints: string[];
  howToApply: { title: string; detail: string }[];
  conversation?: ConversationMessage[];
}

const LOCAL_KEY = "yt_summary_history";

// --- Local helpers ---
function getLocal(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: HistoryItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

// --- DB helpers ---
async function getDbHistory(): Promise<HistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from("summaries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      date: row.created_at,
      inputType: (row.input_type as "link" | "transcript") || "transcript",
      inputValue: row.input_value,
      mainStory: row.main_story,
      bulletPoints: (row.bullet_points as string[]) || [],
      howToApply: (row.how_to_apply as { title: string; detail: string }[]) || [],
      conversation: (row.conversation as unknown as ConversationMessage[]) || [],
    }));
  } catch {
    return [];
  }
}

// --- Public API (dual: local + DB) ---

export async function getHistory(): Promise<HistoryItem[]> {
  const [dbItems, localItems] = await Promise.all([
    getDbHistory(),
    Promise.resolve(getLocal()),
  ]);

  // Merge: DB is source of truth, append local-only items
  const dbIds = new Set(dbItems.map((i) => i.id));
  const localOnly = localItems.filter((i) => !dbIds.has(i.id));
  const all = [...dbItems, ...localOnly];
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addToHistory(
  item: Omit<HistoryItem, "id" | "date">,
  userId: string
): Promise<string | null> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const entry: HistoryItem = {
    id,
    date: now,
    inputType: item.inputType || "transcript",
    inputValue: item.inputValue,
    mainStory: item.mainStory,
    bulletPoints: item.bulletPoints || [],
    howToApply: item.howToApply || [],
    conversation: [],
  };

  // Save to localStorage
  const locals = getLocal();
  locals.unshift(entry);
  saveLocal(locals);

  // Save to DB
  try {
    const { error } = await supabase.from("summaries").insert({
      id,
      user_id: userId,
      input_type: entry.inputType,
      input_value: entry.inputValue,
      main_story: entry.mainStory,
      bullet_points: entry.bulletPoints as any,
      how_to_apply: entry.howToApply as any,
      conversation: [] as any,
      created_at: now,
    });
    if (error) console.error("DB insert error:", error.message);
  } catch (e) {
    console.error("DB insert failed:", e);
  }

  return id;
}

export async function updateHistoryConversation(
  id: string,
  conversation: ConversationMessage[]
): Promise<void> {
  // Update localStorage
  const items = getLocal();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx].conversation = conversation;
    saveLocal(items);
  }

  // Update DB
  try {
    await supabase
      .from("summaries")
      .update({ conversation: conversation as any })
      .eq("id", id);
  } catch (e) {
    console.error("DB update conversation failed:", e);
  }
}

export async function deleteFromHistory(id: string): Promise<void> {
  // Delete from localStorage
  saveLocal(getLocal().filter((i) => i.id !== id));

  // Delete from DB
  try {
    await supabase.from("summaries").delete().eq("id", id);
  } catch (e) {
    console.error("DB delete failed:", e);
  }
}

export async function clearHistory(userId: string): Promise<void> {
  // Clear localStorage
  localStorage.removeItem(LOCAL_KEY);

  // Clear from DB
  try {
    await supabase.from("summaries").delete().eq("user_id", userId);
  } catch (e) {
    console.error("DB clear failed:", e);
  }
}
