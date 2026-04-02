import TopNavbar from "@/components/TopNavbar";
import { useLocation } from "react-router-dom";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isTaskPage = location.pathname === "/app-tasks";

  return (
    <div className="min-h-screen flex flex-col w-full">
      <TopNavbar />
      <main className={isTaskPage ? "flex-1 min-h-0 overflow-hidden" : "flex-1 overflow-auto"}>
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
