import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";
import UserNotificationBell from "@/components/UserNotificationBell";
import { useStudyReminder } from "@/hooks/use-study-reminder";
import { useBookReminders } from "@/hooks/use-book-reminders";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isTaskPage = location.pathname === "/app-tasks";
  useStudyReminder();
  useBookReminders();



  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <UserSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b px-4 bg-background shrink-0">
            <SidebarTrigger />
            <UserNotificationBell />
          </header>
          <main className={isTaskPage ? "flex-1 min-h-0 overflow-hidden" : "flex-1 overflow-auto"}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserLayout;
