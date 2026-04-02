import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold, Italic, List, Link, ImageIcon, Eye, EyeOff,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface MarkdownNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const MarkdownNoteEditor = ({ value, onChange, placeholder = "নতুন note লিখুন...", rows = 4 }: MarkdownNoteEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "", newLine = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const prefix = newLine && start > 0 && value[start - 1] !== "\n" ? "\n" : "";
    const newText = value.slice(0, start) + prefix + before + (selected || "text") + after + value.slice(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const cursorStart = start + prefix.length + before.length;
      const cursorEnd = cursorStart + (selected ? selected.length : 4);
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 10);
  };

  const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap border rounded-md p-1.5 bg-muted/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-medium">
              <Heading1 className="h-4 w-4" /> Heading
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {[1, 2, 3, 4, 5, 6].map((level) => {
              const Icon = headingIcons[level - 1];
              return (
                <DropdownMenuItem key={level} onClick={() => insertMarkdown("#".repeat(level) + " ", "\n", true)}>
                  <Icon className="h-4 w-4 mr-2" /> Heading {level}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-0.5" />

        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insertMarkdown("**", "**")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insertMarkdown("*", "*")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-0.5" />

        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insertMarkdown("- ", "\n", true)} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insertMarkdown("[", "](https://)")} title="Link">
          <Link className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insertMarkdown("![image](", ")")} title="Image">
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="ml-auto">
          <Toggle pressed={showPreview} onPressedChange={setShowPreview} size="sm" className="h-8 px-2 gap-1 text-xs">
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Preview
          </Toggle>
        </div>
      </div>

      <div className={showPreview ? "grid grid-cols-2 gap-3" : ""}>
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="font-mono text-sm"
        />
        {showPreview && (
          <div className="border rounded-md p-3 min-h-[100px] prose prose-sm dark:prose-invert max-w-none overflow-auto bg-muted/30">
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground text-sm italic">Preview এখানে দেখা যাবে...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownNoteEditor;
