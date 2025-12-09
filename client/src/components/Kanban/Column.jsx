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

  const handleDrop = async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("task-id");
    const droppedTask = allTasks.find(t => t._id === taskId);
    if (!droppedTask || droppedTask.status === status) return;
    
    const duplicate = allTasks.find(
      t => t.status === status && t.title === droppedTask.title && t._id !== droppedTask._id
    );
    if (duplicate) return alert("Title must be unique in this column");
    
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
    <div className="flex-shrink-0 lg:flex-1 flex flex-col min-h-[180px] sm:min-h-[220px] lg:min-h-0 w-full lg:w-auto lg:min-w-[280px]">
      {/* Column Header */}
      <div className={`${bgColor} ${borderColor} border-2 rounded-t-xl p-2.5 sm:p-3 xl:p-4 backdrop-blur-sm flex-shrink-0`}>
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h3 className={`text-sm sm:text-base xl:text-lg font-semibold text-white flex items-center`}>
            <span className="text-base sm:text-lg xl:text-xl mr-1.5 sm:mr-2">{icon}</span>
            {title}
          </h3>
          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-gradient-to-r ${color} text-white rounded-full`}>
            {tasks.length}
          </span>
        </div>
        <div className={`h-0.5 sm:h-1 bg-gradient-to-r ${color} rounded-full`}></div>
      </div>
      
      {/* Column Body */}
      <div 
        className={`${bgColor} ${borderColor} border-2 border-t-0 rounded-b-xl flex-1 p-2.5 sm:p-3 lg:p-4 min-h-0 backdrop-blur-sm overflow-hidden`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="h-full overflow-y-auto space-y-2 sm:space-y-3 pr-1 sm:pr-2 column-scroll">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 sm:h-28 text-gray-400">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-1.5 opacity-50">{icon}</div>
              <p className="text-xs sm:text-sm text-center">
                {status === 'todo' ? 'No tasks yet' : 
                 status === 'inProgress' ? 'Nothing in progress' : 
                 'No completed tasks'}
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
