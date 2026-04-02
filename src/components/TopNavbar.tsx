import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Dashboard", path: "/app" },
  { label: "Summarizer", path: "/app-summarizer" },
  { label: "Tasks", path: "/app-tasks" },
  { label: "Goals", path: "/app-goals" },
  { label: "Money", path: "/app-money" },
  { label: "Notes", path: "/app-notes" },
  { label: "History", path: "/app-history" },
];

export default function TopNavbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        <Link to="/app" className="flex items-center gap-2 shrink-0">
          <img src="/favicon.ico" alt="VidMind" className="h-7 w-7" />
          <span className="text-xl font-bold text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>VidMind</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${location.pathname === link.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}>{link.label}</Link>
          ))}
        </div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted/50 transition-colors">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback></Avatar>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover shadow-lg py-1 z-50">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-destructive hover:text-destructive px-3 h-9" onClick={() => { setDropdownOpen(false); signOut(); }}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {navLinks.map((link) => (
          <Link key={link.path} to={link.path}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${location.pathname === link.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{link.label}</Link>
        ))}
      </div>
    </nav>
  );
}
