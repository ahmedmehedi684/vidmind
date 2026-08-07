import { PlayCircle, ExternalLink } from "lucide-react";
import { getPlatform } from "@/components/ChannelManager";

/** Opens a link in a real new tab (works inside the preview iframe too). */
export const openExternal = (url: string) => {
  if (!url) return;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  window.open(href, "_blank", "noopener,noreferrer");
};

export const youtubeId = (u: string) => {
  const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
};

export const isImageUrl = (u: string) => /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|#|$)/i.test(u);
export const isVideoFile = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(u);

const detectPlatform = (u: string) => {
  if (/facebook\.com|fb\.watch/i.test(u)) return "facebook";
  if (/instagram\.com/i.test(u)) return "instagram";
  if (/tiktok\.com/i.test(u)) return "tiktok";
  if (/youtube\.com|youtu\.be/i.test(u)) return "youtube";
  return null;
};

interface Props {
  url: string;
  /** platform of the linked channel, used as a fallback badge */
  platform?: string;
  className?: string;
}

/**
 * Shows a preview for a link: YouTube thumbnail, direct image, direct video,
 * or a branded placeholder for platforms that block embedding (Facebook,
 * Instagram, TikTok). Clicking always opens the original link in a new tab.
 */
const MediaPreview = ({ url, platform, className = "" }: Props) => {
  if (!url) return null;
  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openExternal(url);
  };

  const yt = youtubeId(url);
  let inner: React.ReactNode;

  if (yt) {
    inner = (
      <div className="relative w-full aspect-video bg-muted overflow-hidden rounded-md">
        <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="Video preview" loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-background/20">
          <PlayCircle className="h-10 w-10 text-primary drop-shadow" />
        </div>
      </div>
    );
  } else if (isImageUrl(url)) {
    inner = <img src={url} alt="Link preview" loading="lazy" className="w-full max-h-64 rounded-md object-contain bg-muted/30" />;
  } else if (isVideoFile(url)) {
    inner = <video src={url} className="w-full rounded-md bg-muted" preload="metadata" muted playsInline controls onClick={(e) => e.stopPropagation()} />;
  } else {
    const P = getPlatform(detectPlatform(url) ?? platform ?? "youtube");
    inner = (
      <div className="w-full aspect-video rounded-md bg-muted/40 border border-border flex flex-col items-center justify-center gap-2">
        <P.icon className={`h-8 w-8 ${P.className}`} />
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> Open on {P.label}
        </span>
      </div>
    );
  }

  return (
    <div role="link" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && openExternal(url)} className={`block cursor-pointer ${className}`}>
      {inner}
    </div>
  );
};

export default MediaPreview;
