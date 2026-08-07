import { FileText, Clock, Settings, Youtube, User, LogOut, StickyNote, LayoutDashboard, ListChecks, Target, DollarSign, CreditCard, HeadphonesIcon, Link2, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Summarizer", url: "/app-summarizer", icon: FileText },
  { title: "Tasks", url: "/app-tasks", icon: ListChecks },
  { title: "Goals", url: "/app-goals", icon: Target },
  { title: "Money", url: "/app-money", icon: DollarSign },
  { title: "My Notes", url: "/app-notes", icon: StickyNote },
  { title: "Channels", url: "/app-channels", icon: Youtube },
  { title: "Important Links", url: "/app-links", icon: Link2 },
  { title: "My Books", url: "/app-books", icon: BookOpen },

  { title: "History", url: "/app-history", icon: Clock },
  { title: "Subscription", url: "/app-subscription", icon: CreditCard },
  { title: "Support", url: "/app-support", icon: HeadphonesIcon },
  { title: "Profile", url: "/app-profile", icon: User },
  { title: "Settings", url: "/app-settings", icon: Settings },
];

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-primary font-bold text-base mb-2">
              VidMind
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50 flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-1">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full gap-2 text-muted-foreground hover:text-destructive justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
