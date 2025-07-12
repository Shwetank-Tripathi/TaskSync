import Column from "./Column";

const KanbanBoard = ({ tasks, roomId, socketId, userId, members, onTaskUpdated, onTaskDeleted }) => {
  const columns = [
    { status: "todo", title: "To-Do" },
    { status: "inProgress", title: "In Progress" },
    { status: "done", title: "Done" }
  ];

  return (
    <div className="kanban-board">
      {columns.map(col => (
        <Column
          key={col.status}
          title={col.title}
          status={col.status}
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
  );
};

export default KanbanBoard;
