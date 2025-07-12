import TaskCard from "./TaskCard";

const Column = ({ title, status, tasks, allTasks, onTaskUpdated, roomId, socketId, ...props }) => {
  // Handle drop on the column itself
  const handleDrop = async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("task-id");
    const droppedTask = allTasks.find(t => t._id === taskId);
    if (!droppedTask || droppedTask.status === status) return;
    // Prevent duplicate titles in the same column
    const duplicate = allTasks.find(
      t => t.status === status && t.title === droppedTask.title && t._id !== droppedTask._id
    );
    if (duplicate) return alert("Title must be unique in this column");
    // Call the update handler
    if (onTaskUpdated) {
      // Simulate the same update as in TaskCard
      try {
        const res = await (await import("../../axios")).default.patch(`/task/update/${droppedTask._id}`, { status, version: droppedTask.version }, {
          headers: {
            roomid: roomId,
            socketid: socketId,
          },
          withCredentials: true,
        });
        const data = res.data;
        if (data.message === "Conflict Detected") {
          // Optionally handle conflict modal here if needed
        } else {
          onTaskUpdated(droppedTask._id, data.changes, data.log);
        }
      } catch (error) {
        const message = error.response?.data?.message || "Failed to update task";
        alert(message);
      }
    }
  };

  return (
    <div
      className="kanban-column"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <h3>{title}</h3>
      {tasks.map(task => (
        <TaskCard 
          key={task._id} 
          task={task} 
          column={status} 
          allTasks={allTasks} 
          roomId={roomId}
          socketId={socketId}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={props.onTaskDeleted}
          members={props.members}
        />
      ))}
    </div>
  );
};

export default Column;
