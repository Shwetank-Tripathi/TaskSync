import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Target, Check, AlertTriangle } from "lucide-react";
import axiosInstance from "../../axios";
import AlertModal from "./AlertModal";

const priorities = ["low", "medium", "high"];

// Conflict Modal Component
const ConflictModal = ({ serverTask, clientTask, onMerge, onOverwrite, onCancel, members = [] }) => {
  // Helper to get user name from ID or object
  const getAssignedUserName = (assignedUser) => {
    if (!assignedUser) return 'Unassigned';
    if (typeof assignedUser === 'object' && assignedUser.name) return assignedUser.name;
    // If it's an ID string, look up in members
    const member = members.find(m => m._id === assignedUser);
    return member?.name || 'Unassigned';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-2 sm:p-4">
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
              <p><span className="text-gray-400">Status:</span> <span className="text-white">{clientTask.status}</span></p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-orange-500/30">
            <h4 className="font-semibold text-orange-400 mb-2 sm:mb-3 text-sm sm:text-base">Server Version:</h4>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <p><span className="text-gray-400">Title:</span> <span className="text-white">{serverTask.title}</span></p>
              <p><span className="text-gray-400">Description:</span> <span className="text-white">{serverTask.description}</span></p>
              <p><span className="text-gray-400">Assigned:</span> <span className="text-white">{getAssignedUserName(serverTask.assignedUser)}</span></p>
              <p><span className="text-gray-400">Priority:</span> <span className="text-white">{serverTask.priority}</span></p>
              <p><span className="text-gray-400">Status:</span> <span className="text-white">{serverTask.status}</span></p>
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

const TaskDetailModal = ({ isOpen, onClose, task, roomId, socketId, members = [], allTasks = [], onTaskUpdated, onTaskDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "info", showCancel: false, onConfirm: null });
  const [mounted, setMounted] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen || !task) return null;

  const showAlert = (message, type = "info", title = "", showCancel = false, onConfirm = null) => {
    setAlertModal({ isOpen: true, title, message, type, showCancel, onConfirm });
  };
  const closeAlert = () => setAlertModal({ isOpen: false, title: "", message: "", type: "info", showCancel: false, onConfirm: null });
  const startEdit = (field, value) => { setEditField(field); setEditValue(value); };
  const cancelEdit = () => { setEditField(null); setEditValue(""); };

  // Conflict handlers
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
        headers: { roomid: roomId, socketid: socketId },
        withCredentials: true,
      });
      onTaskUpdated(task._id, res.data.changes, res.data.log);
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
    showAlert("Task updated with server version!", "success");
  };

  const saveEdit = async () => {
    if (!editValue.trim() && editField !== "assignedUser") { showAlert("Please enter a value", "warning"); return; }
    onTaskUpdated(task._id, { [editField]: editField === "assignedUser" ? (editValue || null) : editValue }, null);
    setUpdating(true);
    try {
      const updateData = { version: task.version, [editField]: editField === "assignedUser" ? (editValue || null) : editValue };
      const res = await axiosInstance.patch(`/task/update/${task._id}`, updateData, { headers: { roomid: roomId, socketid: socketId }, withCredentials: true });
      if (res.data.changes) onTaskUpdated(task._id, res.data.changes, res.data.log);
      cancelEdit();
    } catch (error) {
      // Revert optimistic update
      onTaskUpdated(task._id, { [editField]: task[editField] }, null);
      
      // Check if it's a conflict (409)
      if (error.response?.status === 409) {
        const { serverTask, clientTask } = error.response.data;
        setConflictData({
          serverTask,
          clientTask: {
            ...clientTask,
            [editField]: editValue
          }
        });
        setShowConflictModal(true);
        // Don't cancelEdit() - let user decide in modal
      } else {
        showAlert(error.response?.data?.message || "Failed to update", "error", "Update Failed");
        cancelEdit();
      }
    } finally { setUpdating(false); }
  };

  const handleDelete = () => {
    showAlert(`Delete "${task.title}"?`, "error", "Delete Task", true, async () => {
      setDeleting(true);
      try {
        const res = await axiosInstance.delete(`/task/delete/${task._id}`, { headers: { roomid: roomId, socketid: socketId }, withCredentials: true });
        onTaskDeleted(task._id, res.data.log);
        onClose();
      } catch { showAlert("Failed to delete", "error"); }
      finally { setDeleting(false); }
    });
  };

  const smartAssign = async () => {
    if (task.assignedUser || members.length === 0) return;
    const best = members.map(m => ({ member: m, count: allTasks.filter(t => t.assignedUser?._id === m._id && t.status !== 'done').length })).reduce((a, b) => b.count < a.count ? b : a);
    onTaskUpdated(task._id, { assignedUser: best.member }, null);
    setUpdating(true);
    try {
      const res = await axiosInstance.patch(`/task/update/${task._id}`, { assignedUser: best.member._id, version: task.version }, { headers: { roomid: roomId, socketid: socketId }, withCredentials: true });
      if (res.data.changes) {
        // Preserve full member object instead of overwriting with ObjectId from server
        const finalChanges = { ...res.data.changes };
        if (finalChanges.assignedUser && typeof finalChanges.assignedUser === 'string') {
          const member = members.find(m => m._id === finalChanges.assignedUser);
          if (member) finalChanges.assignedUser = member;
        }
        onTaskUpdated(task._id, finalChanges, res.data.log);
      }
    } catch (error) {
      // Revert optimistic update
      onTaskUpdated(task._id, { assignedUser: task.assignedUser }, null);
      
      // Check if it's a conflict (409)
      if (error.response?.status === 409) {
        const { serverTask, clientTask } = error.response.data;
        setConflictData({
          serverTask,
          clientTask: {
            ...clientTask,
            assignedUser: best.member._id
          }
        });
        setShowConflictModal(true);
      } else {
        showAlert(error.response?.data?.message || "Failed to assign", "error", "Assignment Failed");
      }
    }
    finally { setUpdating(false); }
  };

  const quickUpdateStatus = async (newStatus) => {
    if (task.status === newStatus) return;
    onTaskUpdated(task._id, { status: newStatus }, null);
    setUpdating(true);
    try {
      const res = await axiosInstance.patch(`/task/update/${task._id}`, { status: newStatus, version: task.version }, { headers: { roomid: roomId, socketid: socketId }, withCredentials: true });
      if (res.data.changes) onTaskUpdated(task._id, res.data.changes, res.data.log);
    } catch (error) {
      // Revert optimistic update
      onTaskUpdated(task._id, { status: task.status }, null);
      
      // Check if it's a conflict (409)
      if (error.response?.status === 409) {
        const { serverTask, clientTask } = error.response.data;
        setConflictData({
          serverTask,
          clientTask: {
            ...clientTask,
            status: newStatus
          }
        });
        setShowConflictModal(true);
      } else {
        showAlert("Failed to move task", "error");
      }
    }
    finally { setUpdating(false); }
  };

  const getPriorityColor = (p) => p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
  const getPriorityIcon = (p) => p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢';

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]" onClick={e => e.target === e.currentTarget && !updating && !deleting && onClose()}>
      <div className="bg-gray-900 border-t sm:border border-blue-600/30 sm:rounded-xl w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <span className="text-sm text-gray-400">{task.status === 'todo' ? 'To Do' : task.status === 'inProgress' ? 'In Progress' : 'Done'}</span>
          </div>
          <button onClick={onClose} disabled={updating || deleting} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            {editField === "title" ? (
              <div className="space-y-2">
                <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-600" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><Check className="w-3 h-3" /> {updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : <p className="text-white font-medium cursor-pointer hover:text-blue-400 p-2 rounded-lg hover:bg-gray-800" onClick={() => startEdit("title", task.title)}>{task.title}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            {editField === "description" ? (
              <div className="space-y-2">
                <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows="3" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-blue-600" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><Check className="w-3 h-3" /> {updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : <p className="text-gray-300 text-sm cursor-pointer hover:text-gray-200 p-2 rounded-lg hover:bg-gray-800" onClick={() => startEdit("description", task.description || "")}>{task.description || "Tap to add description"}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Assigned To</label>
            {editField === "assignedUser" ? (
              <div className="space-y-2">
                <select value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><Check className="w-3 h-3" /> {updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-white text-sm cursor-pointer hover:text-blue-400 p-2 rounded-lg hover:bg-gray-800" onClick={() => startEdit("assignedUser", task.assignedUser?._id || "")}>{task.assignedUser?.name || "Unassigned"}</p>
                {!task.assignedUser && members.length > 0 && <button onClick={smartAssign} disabled={updating} className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs rounded-lg cursor-pointer flex items-center gap-1"><Target className="w-3 h-3" /> Smart</button>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Priority</label>
            {editField === "priority" ? (
              <div className="space-y-2">
                <select value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                  {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><Check className="w-3 h-3" /> {updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              </div>
            ) : <p className="text-white text-sm cursor-pointer hover:text-blue-400 p-2 rounded-lg hover:bg-gray-800 flex items-center" onClick={() => startEdit("priority", task.priority)}><span className="mr-2">{getPriorityIcon(task.priority)}</span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>}
          </div>

          {/* Status - Move between columns */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Move to</label>
            <div className="flex gap-2">
              {task.status !== 'todo' && (
                <button onClick={() => quickUpdateStatus("todo")} disabled={updating} className="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs cursor-pointer disabled:opacity-50">📋 To Do</button>
              )}
              {task.status !== 'inProgress' && (
                <button onClick={() => quickUpdateStatus("inProgress")} disabled={updating} className="flex-1 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-xs cursor-pointer disabled:opacity-50">⚡ Progress</button>
              )}
              {task.status !== 'done' && (
                <button onClick={() => quickUpdateStatus("done")} disabled={updating} className="flex-1 py-2 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 rounded-lg text-xs cursor-pointer disabled:opacity-50">✅ Done</button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0 bg-gray-900">
          <button onClick={handleDelete} disabled={deleting || updating} className="w-full py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg cursor-pointer flex items-center justify-center gap-2">
            {deleting ? "Deleting..." : <><Trash2 className="w-4 h-4" />Delete Task</>}
          </button>
        </div>
      </div>
      <AlertModal isOpen={alertModal.isOpen} onClose={closeAlert} title={alertModal.title} message={alertModal.message} type={alertModal.type} showCancel={alertModal.showCancel} onConfirm={alertModal.onConfirm} />
      
      {/* Conflict Modal */}
      {showConflictModal && conflictData && (
        <ConflictModal 
          serverTask={conflictData.serverTask} 
          clientTask={conflictData.clientTask} 
          onMerge={handleConflictMerge} 
          onOverwrite={handleConflictOverwrite} 
          onCancel={handleConflictCancel}
          members={members}
        />
      )}
    </div>,
    document.body
  );
};

export default TaskDetailModal;
