import TaskCard from "./TaskCard";

const Column = ({ 
  title, 
  status, 
  color, 
  bgColor, 
  borderColor, 
  icon, 
  tasks, 
  allTasks, 
  onTaskUpdated, 
  roomId, 
  socketId, 
  ...props 
}) => {
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* Column Header - Fixed */}
      <div className={`${bgColor} ${borderColor} border-2 rounded-t-xl p-4 backdrop-blur-sm flex-shrink-0`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-semibold text-white flex items-center bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            <span className="text-xl mr-2">{icon}</span>
            {title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium bg-gradient-to-r ${color} text-white rounded-full`}>
            {tasks.length}
          </span>
        </div>
        <div className={`h-1 bg-gradient-to-r ${color} rounded-full`}></div>
      </div>

      {/* Column Content - Scrollable */}
      <div 
        className={`${bgColor} ${borderColor} border-2 border-t-0 rounded-b-xl flex-1 p-4 min-h-0 backdrop-blur-sm overflow-hidden`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="h-full overflow-y-auto space-y-3 pr-2 column-scroll">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <div className="text-3xl mb-2 opacity-50">{icon}</div>
              <p className="text-sm text-center">
                {status === 'todo' ? 'No tasks yet' : 
                 status === 'inProgress' ? 'Nothing in progress' : 
                 'No completed tasks'}
              </p>
              <p className="text-xs text-center mt-1 opacity-75">
                Drag tasks here or create new ones
              </p>
            </div>
          ) : (
            tasks.map(task => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Column;
