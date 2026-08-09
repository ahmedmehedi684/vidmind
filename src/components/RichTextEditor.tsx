import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link as LinkIcon, ImageIcon, Table as TableIcon,
  Undo, Redo, Upload, Loader2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

const ImageDialog = ({ open, onOpenChange, onInsert }: { open: boolean; onOpenChange: (v: boolean) => void; onInsert: (url: string) => void }) => {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertUrl = () => {
    if (!url.trim()) return;
    onInsert(url.trim());
    setUrl("");
    onOpenChange(false);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("not signed in");
      const ext = file.name.split(".").pop() || "png";
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("note-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: signed, error: signErr } = await supabase.storage.from("note-images").createSignedUrl(path, TEN_YEARS);
      if (signErr || !signed) throw signErr;
      onInsert(signed.signedUrl);
      onOpenChange(false);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>Paste an image link or upload an image from your device.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="link">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="link">Image Link</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="space-y-3 pt-3">
            <Label className="text-xs">Image URL</Label>
            <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            {url.trim() && (
              <img src={url} alt="Preview" className="w-full rounded-md border max-h-48 object-contain bg-muted/20" />
            )}
            <Button onClick={insertUrl} disabled={!url.trim()} className="w-full">Insert</Button>
          </TabsContent>
          <TabsContent value="upload" className="space-y-3 pt-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            <Button variant="outline" className="w-full gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Choose image"}
            </Button>
            <p className="text-xs text-muted-foreground">The image is saved securely in your own storage.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const MenuBar = ({ editor }: { editor: any }) => {
  const [imageOpen, setImageOpen] = useState(false);
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };


  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), title: "Bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), title: "Italic" },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), title: "Underline" },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), title: "Strikethrough" },
    "sep",
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), title: "H1" },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), title: "H2" },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }), title: "H3" },
    "sep",
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), title: "Bullet List" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), title: "Ordered List" },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), title: "Quote" },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock"), title: "Code Block" },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, title: "Divider" },
    "sep",
    { icon: LinkIcon, action: addLink, active: editor.isActive("link"), title: "Link" },
    { icon: ImageIcon, action: () => setImageOpen(true), active: false, title: "Image" },
    { icon: TableIcon, action: addTable, active: false, title: "Table" },
    "sep",
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, title: "Undo" },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, title: "Redo" },
  ];

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b p-1.5 bg-muted/30">
      {tools.map((tool, i) => {
        if (tool === "sep") return <Separator key={i} orientation="vertical" className="h-6 mx-0.5" />;
        const { icon: Icon, action, active, title } = tool as any;
        return (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              action();
            }}
            className={`h-8 w-8 p-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground ${active ? 'bg-accent text-accent-foreground' : 'bg-transparent'}`}
            title={title}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
      <ImageDialog
        open={imageOpen}
        onOpenChange={setImageOpen}
        onInsert={(src) => editor.chain().focus().setImage({ src }).run()}
      />
    </div>
  );

};

const RichTextEditor = ({ value, onChange, placeholder = "Write your note here..." }: RichTextEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      } as any),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3 rich-content",
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false } as any);
    }
  }, [value, editor]);

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
