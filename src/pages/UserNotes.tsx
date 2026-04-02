import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Pencil, Check, Search, Youtube, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RichTextEditor from "@/components/RichTextEditor";

interface Channel { id: string; name: string; url: string; user_id: string; created_at: string; }
interface Note {
  id: string; user_id: string; title: string; text: string;
  channel_id: string | null; video_url: string; created_at: string;
}

const UserNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // New note
  const [newNote, setNewNote] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteChannelId, setNewNoteChannelId] = useState("all");
  const [newNoteVideoUrl, setNewNoteVideoUrl] = useState("");

  // Filter
  const [filterChannel, setFilterChannel] = useState("all");
  const [search, setSearch] = useState("");

  // Dialog
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editChannelId, setEditChannelId] = useState("all");
  const [editVideoUrl, setEditVideoUrl] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [notesRes, channelsRes] = await Promise.all([
      supabase.from("admin_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("channels").select("*").order("created_at", { ascending: false }),
    ]);
    if (notesRes.data) setNotes(notesRes.data as unknown as Note[]);
    if (channelsRes.data) setChannels(channelsRes.data as unknown as Channel[]);
    setLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    const insertData: any = { text: newNote.trim(), title: newNoteTitle.trim(), user_id: user.id, video_url: newNoteVideoUrl.trim() };
    if (newNoteChannelId !== "all") insertData.channel_id = newNoteChannelId;
    const { data, error } = await supabase.from("admin_notes").insert(insertData).select().single();
    if (error) { toast.error("Failed to save note"); return; }
    if (data) setNotes([data as unknown as Note, ...notes]);
    setNewNote(""); setNewNoteTitle(""); setNewNoteChannelId("all"); setNewNoteVideoUrl("");
    toast.success("Note added");
  };

  const deleteNote = async (id: string) => {
    await supabase.from("admin_notes").delete().eq("id", id);
    setNotes(notes.filter(n => n.id !== id));
    setDialogOpen(false);
    toast.success("Note মুছে ফেলা হয়েছে");
  };

  const saveEdit = async () => {
    if (!selectedNote || !editText.trim()) return;
    const updateData: any = { text: editText.trim(), title: editTitle.trim(), video_url: editVideoUrl.trim() };
    updateData.channel_id = editChannelId === "all" ? null : editChannelId;
    const { error } = await supabase.from("admin_notes").update(updateData).eq("id", selectedNote.id);
    if (error) { toast.error("আপডেট করতে সমস্যা হয়েছে"); return; }
    const updated = { ...selectedNote, ...updateData };
    setNotes(notes.map(n => n.id === selectedNote.id ? updated : n));
    setSelectedNote(updated);
    setEditing(false);
    toast.success("Note আপডেট হয়েছে");
  };

  const openDialog = (note: Note) => {
    setSelectedNote(note);
    setEditing(false);
    setEditText(note.text);
    setEditTitle(note.title || "");
    setEditChannelId(note.channel_id || "all");
    setEditVideoUrl(note.video_url || "");
    setDialogOpen(true);
  };

  const getChannelName = (id: string | null) => id ? channels.find(c => c.id === id)?.name || null : null;

  const filtered = notes.filter(n => {
    const matchCh = filterChannel === "all" || n.channel_id === filterChannel;
    const matchSearch = !search.trim() || n.title.toLowerCase().includes(search.toLowerCase()) || n.text.toLowerCase().includes(search.toLowerCase());
    return matchCh && matchSearch;
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Notes</h1>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Channels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব Channels</SelectItem>
            {channels.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* New Note */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Input placeholder="Note title..." value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} className="font-semibold" />
          <Select value={newNoteChannelId} onValueChange={setNewNoteChannelId}>
            <SelectTrigger><SelectValue placeholder="Channel select করুন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">কোনো Channel নেই</SelectItem>
              {channels.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input placeholder="Video URL (optional)..." value={newNoteVideoUrl} onChange={e => setNewNoteVideoUrl(e.target.value)} />
          </div>
          <RichTextEditor value={newNote} onChange={setNewNote} />
          <Button onClick={addNote} disabled={!newNote.trim()} className="gap-2"><Plus className="h-4 w-4" /> Note যোগ করুন</Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">কোনো note পাওয়া যায়নি।</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(note => (
            <Card key={note.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openDialog(note)}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getChannelName(note.channel_id) && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      <Youtube className="h-3 w-3 text-destructive" /> {getChannelName(note.channel_id)}
                    </Badge>
                  )}
                  <span className="font-medium text-foreground truncate">{note.title || "Untitled"}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(note.created_at)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Note Edit করুন" : (selectedNote?.title || "Untitled")}</DialogTitle>
            <DialogDescription className="sr-only">Note details</DialogDescription>
          </DialogHeader>

          {selectedNote && !editing && (
            <div className="space-y-4">
              {getChannelName(selectedNote.channel_id) && (
                <Badge variant="secondary" className="gap-1 text-xs"><Youtube className="h-3 w-3 text-destructive" /> {getChannelName(selectedNote.channel_id)}</Badge>
              )}
              {selectedNote.video_url && (
                <a href={selectedNote.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <LinkIcon className="h-4 w-4" /> Video দেখুন
                </a>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 bg-muted/20"
                dangerouslySetInnerHTML={{ __html: selectedNote.text }} />
            </div>
          )}

          {selectedNote && editing && (
            <div className="space-y-3">
              <Input placeholder="Note title..." value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-semibold" />
              <Select value={editChannelId} onValueChange={setEditChannelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">কোনো Channel নেই</SelectItem>
                  {channels.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input placeholder="Video URL..." value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} />
              </div>
              <RichTextEditor value={editText} onChange={setEditText} />
            </div>
          )}

          <DialogFooter>
            {selectedNote && !editing && (
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</Button>
                <Button variant="destructive" className="gap-2" onClick={() => deleteNote(selectedNote.id)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            )}
            {selectedNote && editing && (
              <div className="flex gap-2 w-full">
                <Button className="gap-2" onClick={saveEdit} disabled={!editText.trim()}><Check className="h-4 w-4" /> Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>বাতিল</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserNotes;
