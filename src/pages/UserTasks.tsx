import TaskManager from "@/components/TaskManager";

const UserTasks = () => (
  <div className="max-w-4xl mx-auto px-4 py-4 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
      <TaskManager />
    </div>
  </div>
);
export default UserTasks;
