import {
  FileText, Users, MessageSquare, Clock, Youtube,
  StickyNote, Settings, Shield, LogOut, User, LayoutGrid, Home,
  ListChecks, Target, DollarSign, CreditCard, HeadphonesIcon,
  BarChart3, UserCog, Bell
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
  { title: "Dashboard", path: "/admin-dashboard", icon: Home },
  { title: "Analytics", path: "/admin-analytics", icon: BarChart3 },
  { title: "User Mgmt", path: "/admin-user-mgmt", icon: UserCog },
  { title: "Notifications", path: "/admin-notifications", icon: Bell },
  { title: "Tasks", path: "/admin-tasks", icon: ListChecks },
  { title: "Goals", path: "/admin-goals", icon: Target },
  { title: "Money", path: "/admin-money", icon: DollarSign },
  { title: "Summarize", path: "/admin-summarize", icon: FileText },
  { title: "Users", path: "/admin-users", icon: Users },
  { title: "Summaries", path: "/admin-summaries", icon: MessageSquare },
  { title: "History", path: "/admin-history", icon: Clock },
  { title: "Channels", path: "/admin-channels", icon: Youtube },
  { title: "Notes", path: "/admin-notes", icon: StickyNote },
  { title: "Showcase", path: "/admin-showcase", icon: LayoutGrid },
  { title: "Payments", path: "/admin-payments", icon: CreditCard },
  { title: "Subscription", path: "/admin-subscription-plans", icon: CreditCard },
  { title: "Pay Methods", path: "/admin-payment-methods", icon: CreditCard },
  { title: "Support", path: "/admin-support", icon: HeadphonesIcon },
  { title: "Profile", path: "/admin-profile", icon: User },
  { title: "Settings", path: "/admin-settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin-login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-primary font-bold text-base mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Admin
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-muted/50 ${
                      location.pathname === item.path ? "bg-muted text-primary font-medium" : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
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
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
