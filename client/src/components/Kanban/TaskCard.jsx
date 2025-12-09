import axiosInstance from "../../axios";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Check, X, AlertTriangle, Target } from "lucide-react";
import AlertModal from "../modals/AlertModal";
import TaskDetailModal from "../modals/TaskDetailModal";

const priorities = ["low", "medium", "high"];

const ConflictModal = ({ serverTask, clientTask, onMerge, onOverwrite, onCancel, members = [] }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Helper to get user name from ID or object
  const getAssignedUserName = (assignedUser) => {
    if (!assignedUser) return 'Unassigned';
    if (typeof assignedUser === 'object' && assignedUser.name) return assignedUser.name;
    // If it's an ID string, look up in members
    const member = members.find(m => m._id === assignedUser);
    return member?.name || 'Unassigned';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4">
      <div className="bg-gray-900 border border-blue-600/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-500" />
          Conflict Detected!
        </h3>
        <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">Another user has modified this task. Choose how to resolve:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-blue-500/30">
            <h4 className="font-semibold text-blue-400 mb-2 sm:mb-3 text-sm sm:text-base">Your Changes:</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <p><span className="text-gray-400">Title:</span> <span className="text-white">{clientTask.title}</span></p>
              <p><span className="text-gray-400">Description:</span> <span className="text-white">{clientTask.description}</span></p>
              <p><span className="text-gray-400">Assigned:</span> <span className="text-white">{getAssignedUserName(clientTask.assignedUser)}</span></p>
              <p><span className="text-gray-400">Priority:</span> <span className="text-white">{clientTask.priority}</span></p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-orange-500/30">
            <h4 className="font-semibold text-orange-400 mb-2 sm:mb-3 text-sm sm:text-base">Server Version:</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <p><span className="text-gray-400">Title:</span> <span className="text-white">{serverTask.title}</span></p>
              <p><span className="text-gray-400">Description:</span> <span className="text-white">{serverTask.description}</span></p>
              <p><span className="text-gray-400">Assigned:</span> <span className="text-white">{getAssignedUserName(serverTask.assignedUser)}</span></p>
              <p><span className="text-gray-400">Priority:</span> <span className="text-white">{serverTask.priority}</span></p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button 
            onClick={onCancel}
            className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer text-sm sm:text-base order-3 sm:order-1"
          >
            Cancel
          </button>
          <button 
            onClick={onMerge}
            className="px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer text-sm sm:text-base order-2"
          >
            Use Server Version
          </button>
          <button 
            onClick={onOverwrite}
            className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer text-sm sm:text-base order-1 sm:order-3"
          >
            Overwrite with Mine
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const TaskCard = ({ task, roomId, socketId, allTasks, onTaskUpdated, onTaskDeleted, members = [] }) => {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    onConfirm: null
  });

  const showAlert = (message, type = "info", title = "", showCancel = false, onConfirm = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      showCancel,
      onConfirm
    });
  };

  const closeAlert = () => {
    setAlertModal({
      isOpen: false,
      title: "",
      message: "",
      type: "info",
      showCancel: false,
      onConfirm: null
    });
  };

  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setConflictData(null);
    cancelEdit();
  };

  const handleConflictOverwrite = async () => {
    if (!conflictData) return;
    setShowConflictModal(false);
    setUpdating(true);
    try {
      const updateData = { 
        ...conflictData.clientTask, 
        force: true 
      };
      
      const res = await axiosInstance.patch(`/task/update/${task._id}`, updateData, {
        headers: {
          roomid: roomId,
          socketid: socketId,
        },
        withCredentials: true,
      });
      const data = res.data;
      onTaskUpdated(task._id, data.changes, data.log);
      cancelEdit();
      showAlert("Task updated successfully!", "success");
    } catch (error) {
      console.error("Error overwriting task:", error);
      showAlert("Failed to overwrite task", "error", "Overwrite Failed");
    } finally {
      setUpdating(false);
      setConflictData(null);
    }
  };

  const handleConflictMerge = () => {
    setShowConflictModal(false);
    // Extract only relevant task fields from serverTask
    const { title, description, assignedUser, priority, status, version } = conflictData.serverTask;
    onTaskUpdated(task._id, { title, description, assignedUser, priority, status, version }, null);
    cancelEdit();
    setConflictData(null);
    showAlert("Task updated successfully!", "success");
  };

  const handleDelete = async () => {
    showAlert(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      "error",
      "Delete Task",
      true,
      async () => {
        setDeleting(true);
        try {
          const res = await axiosInstance.delete(`/task/delete/${task._id}`, {
            headers: {
              roomid: roomId,
              socketid: socketId,
            },
            withCredentials: true,
          });
          const data = res.data;
          onTaskDeleted(task._id, data.log);
          showAlert("Task deleted successfully", "success");
        } catch (error) {
          console.error("Error deleting task:", error);
          showAlert("Failed to delete task", "error", "Delete Failed");
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  const startEdit = (field, value) => {
    setEditField(field);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditField(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editValue.trim() && editField !== "assignedUser") {
      showAlert("Please enter a value", "warning", "Input Required");
      return;
    }
    
    console.log("🔄 Starting edit:", { field: editField, value: editValue, taskId: task._id });
    
    const optimisticChanges = { 
      [editField]: editField === "assignedUser" ? (editValue || null) : editValue 
    };
    console.log("⚡ Applying optimistic update:", optimisticChanges);
    onTaskUpdated(task._id, optimisticChanges, null);
    
    setUpdating(true);
    try {
      const updateData = { version: task.version };
      updateData[editField] = editField === "assignedUser" ? (editValue || null) : editValue;
      
      console.log("📤 Sending to server:", updateData);
      
      const res = await axiosInstance.patch(`/task/update/${task._id}`, updateData, {
        headers: {
          roomid: roomId,
          socketid: socketId,
        },
        withCredentials: true,
      });
      const data = res.data;
      
      console.log("📥 Server response:", data);
      
      if (data.changes) {
        console.log("✅ Success - Server changes:", data.changes);
        console.log("📝 Server log:", data.log);
        
        onTaskUpdated(task._id, data.changes, data.log);
        cancelEdit();
        showAlert("Task updated successfully!", "success");
      } else {
        console.warn("⚠️ No changes returned from server");
        cancelEdit();
      }
    } catch (error) {
      console.error("❌ Error updating task:", error);
      
      // Revert optimistic update
      const revertChanges = { [editField]: task[editField] };
      onTaskUpdated(task._id, revertChanges, null);
      
      // Check if it's a conflict (409)
      if (error.response?.status === 409) {
        const { serverTask, clientTask } = error.response.data;
        // Store conflict data and show modal
        setConflictData({
          serverTask,
          clientTask: {
            ...clientTask,
            [editField]: editValue  // Include the field user was editing
          }
        });
        setShowConflictModal(true);
        // Don't cancelEdit() - let user decide in modal
      } else {
        // Other errors - show alert
        const message = error.response?.data?.message || "Failed to update task";
        showAlert(message, "error", "Update Failed");
        cancelEdit();
      }
    } finally {
      setUpdating(false);
    }
  };

  const smartAssign = async () => {
    if (task.assignedUser) return;
    
    const memberTaskCounts = members.map(member => {
      const activeTaskCount = allTasks.filter(t => 
        t.assignedUser?._id === member._id && t.status !== 'done'
      ).length;
      return { member, count: activeTaskCount };
    });
    
    if (memberTaskCounts.length === 0) {
      showAlert("No team members available for assignment", "warning", "Assignment Not Possible");
      return;
    }
    
    const memberWithFewestTasks = memberTaskCounts.reduce((min, current) => 
      current.count < min.count ? current : min
    );
    
    console.log("🎯 Smart assigning to:", memberWithFewestTasks.member.name);
    
    const optimisticChanges = { assignedUser: memberWithFewestTasks.member };
    onTaskUpdated(task._id, optimisticChanges, null);
    
    setUpdating(true);
    try {
      const res = await axiosInstance.patch(`/task/update/${task._id}`, { 
        assignedUser: memberWithFewestTasks.member._id,
        version: task.version 
      }, {
        headers: {
          roomid: roomId,
          socketid: socketId,
        },
        withCredentials: true,
      });
      const data = res.data;
      
      if (data.changes) {
        console.log("✅ Smart assign success");
        // Preserve full member object instead of overwriting with ObjectId from server
        const finalChanges = { ...data.changes };
        if (finalChanges.assignedUser && typeof finalChanges.assignedUser === 'string') {
          const member = members.find(m => m._id === finalChanges.assignedUser);
          if (member) finalChanges.assignedUser = member;
        }
        onTaskUpdated(task._id, finalChanges, data.log);
        showAlert(`Task assigned to ${memberWithFewestTasks.member.name}`, "success", "Smart Assignment");
      } else {
        console.warn("⚠️ No changes returned from smart assign");
      }
    } catch (error) {
      console.error("❌ Error smart assigning:", error);
      
      // Revert optimistic update
      onTaskUpdated(task._id, { assignedUser: task.assignedUser }, null);
      
      // Check if it's a conflict (409)
      if (error.response?.status === 409) {
        const { serverTask, clientTask } = error.response.data;
        // Store conflict data with the member being assigned
        setConflictData({
          serverTask,
          clientTask: {
            ...clientTask,
            assignedUser: memberWithFewestTasks.member._id
          }
        });
        setShowConflictModal(true);
      } else {
        const message = error.response?.data?.message || "Failed to assign task";
        showAlert(message, "error", "Assignment Failed");
      }
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <>
      {/* COMPACT VIEW - Below xl (1280px), click to open modal */}
      <div 
        className="lg:hidden bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-lg p-2.5 hover:border-blue-600/40 transition-all duration-200 cursor-pointer group hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
        onClick={() => setShowDetailModal(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-white text-xs sm:text-sm leading-tight group-hover:text-blue-400 transition-colors truncate flex-1">
            {task.title}
          </h4>
          <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} title={`${task.priority} priority`}></div>
        </div>
        {task.assignedUser && (
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{task.assignedUser.name}</p>
        )}
      </div>

      {/* DESKTOP VIEW - xl+ (1280px+), full card with inline editing */}
      <div 
        className="hidden lg:block bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl p-4 hover:border-blue-600/40 transition-all duration-200 cursor-grab active:cursor-grabbing group hover:shadow-lg hover:shadow-blue-500/10"
        draggable
        onDragStart={e => e.dataTransfer.setData("task-id", task._id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {editField === "title" ? (
              <div className="space-y-2">
                <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1">{updating ? "..." : <><Check className="w-3 h-3" /> Save</>}</button>
                  <button onClick={cancelEdit} disabled={updating} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : (
              <h4 className="font-semibold text-white text-sm leading-tight mb-2 group-hover:text-blue-400 transition-colors cursor-pointer truncate" onClick={() => startEdit("title", task.title)} title="Click to edit title">{task.title}</h4>
            )}
          </div>
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 ml-2`} title={`${task.priority} priority`}></div>
        </div>

        <div className="mb-3">
          {editField === "description" ? (
            <div className="space-y-2">
              <textarea value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus rows="2" className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={updating} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1">{updating ? "..." : <><Check className="w-3 h-3" /> Save</>}</button>
                <button onClick={cancelEdit} disabled={updating} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-xs leading-relaxed cursor-pointer hover:text-gray-200 transition-colors line-clamp-2" onClick={() => startEdit("description", task.description)} title="Click to edit description">{task.description || "No description"}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">Assigned:</span>
            {editField === "assignedUser" ? (
              <div className="flex items-center gap-2 flex-1 justify-end">
                <select value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="">Unassigned</option>
                  {members.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
                </select>
                <button onClick={saveEdit} disabled={updating} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50 cursor-pointer flex items-center"><Check className="w-3 h-3" /></button>
                <button onClick={cancelEdit} disabled={updating} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer flex items-center"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <span className="text-xs text-white cursor-pointer hover:text-blue-400 transition-colors truncate" onClick={() => startEdit("assignedUser", task.assignedUser?._id || "")} title="Click to edit assignee">{task.assignedUser ? task.assignedUser.name : "Unassigned"}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">Priority:</span>
            {editField === "priority" ? (
              <div className="flex items-center gap-2 flex-1 justify-end">
                <select value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <button onClick={saveEdit} disabled={updating} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50 cursor-pointer flex items-center"><Check className="w-3 h-3" /></button>
                <button onClick={cancelEdit} disabled={updating} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer flex items-center"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <span className="text-xs text-white cursor-pointer hover:text-blue-400 transition-colors flex items-center" onClick={() => startEdit("priority", task.priority)} title="Click to edit priority">
                <span className="mr-1">{getPriorityIcon(task.priority)}</span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            )}
          </div>
        </div>

        {!task.assignedUser && members.length > 0 && (
          <div className="mt-3">
            <button onClick={smartAssign} disabled={updating} className="w-full py-1.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-all cursor-pointer flex items-center justify-center gap-2">{updating ? "Assigning..." : <><Target className="w-3 h-3" /> Smart Assign</>}</button>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button onClick={handleDelete} disabled={deleting || updating} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all disabled:opacity-50 cursor-pointer" title="Delete task">
            {deleting ? <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"></div> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Detail Modal */}
      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        task={task}
        roomId={roomId}
        socketId={socketId}
        members={members}
        allTasks={allTasks}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />

      {/* Alert Modal */}
      <AlertModal isOpen={alertModal.isOpen} onClose={closeAlert} title={alertModal.title} message={alertModal.message} type={alertModal.type} showCancel={alertModal.showCancel} onConfirm={alertModal.onConfirm} />

      {/* Conflict Modal */}
      {showConflictModal && conflictData && (
        <ConflictModal serverTask={conflictData.serverTask} clientTask={conflictData.clientTask} onMerge={handleConflictMerge} onOverwrite={handleConflictOverwrite} onCancel={handleConflictCancel} members={members} />
      )}
    </>
  );
};

export default TaskCard;
  