import TopNavbar from "@/components/TopNavbar";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <TopNavbar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
