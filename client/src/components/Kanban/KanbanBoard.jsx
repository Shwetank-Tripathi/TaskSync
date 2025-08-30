import Column from "./Column";

const KanbanBoard = ({ tasks, roomId, socketId, userId, members, onTaskUpdated, onTaskDeleted }) => {
  const columns = [
    { 
      status: "todo", 
      title: "To-Do", 
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      icon: "📋"
    },
    { 
      status: "inProgress", 
      title: "In Progress", 
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-orange-500/10", 
      borderColor: "border-orange-500/30",
      icon: "⚡"
    },
    { 
      status: "done", 
      title: "Done", 
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30", 
      icon: "✅"
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <svg className="w-6 h-6 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          Task Board
        </h2>
        <p className="text-slate-400">Manage and track your project tasks</p>
      </div>
      
      <div className="flex-1 flex gap-6 min-h-0">
        {columns.map(col => (
          <Column
            key={col.status}
            title={col.title}
            status={col.status}
            color={col.color}
            bgColor={col.bgColor}
            borderColor={col.borderColor}
            icon={col.icon}
            tasks={tasks.filter(task => task.status === col.status)}
            allTasks={tasks}
            roomId={roomId}
            socketId={socketId}
            userId={userId}
            members={members}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskDeleted}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
