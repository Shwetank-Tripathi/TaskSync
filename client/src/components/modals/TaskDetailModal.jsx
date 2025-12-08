import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../axios";
import AlertModal from "./AlertModal";

const priorities = ["low", "medium", "high"];

const TaskDetailModal = ({ isOpen, onClose, task, roomId, socketId, members = [], allTasks = [], onTaskUpdated, onTaskDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "info", showCancel: false, onConfirm: null });
  const [mounted, setMounted] = useState(false);

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
      onTaskUpdated(task._id, { [editField]: task[editField] }, null);
      showAlert(error.response?.data?.message || "Failed to update", "error", "Update Failed");
      cancelEdit();
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
    } catch { onTaskUpdated(task._id, { assignedUser: task.assignedUser }, null); }
    finally { setUpdating(false); }
  };

  const quickUpdateStatus = async (newStatus) => {
    if (task.status === newStatus) return;
    onTaskUpdated(task._id, { status: newStatus }, null);
    setUpdating(true);
    try {
      const res = await axiosInstance.patch(`/task/update/${task._id}`, { status: newStatus, version: task.version }, { headers: { roomid: roomId, socketid: socketId }, withCredentials: true });
      if (res.data.changes) onTaskUpdated(task._id, res.data.changes, res.data.log);
    } catch { onTaskUpdated(task._id, { status: task.status }, null); showAlert("Failed to move task", "error"); }
    finally { setUpdating(false); }
  };

  const getPriorityColor = (p) => p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
  const getPriorityIcon = (p) => p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢';

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]" onClick={e => e.target === e.currentTarget && !updating && !deleting && onClose()}>
      <div className="bg-slate-800 border-t sm:border border-purple-500/30 sm:rounded-xl w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="bg-slate-800 border-b border-purple-500/20 p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <span className="text-sm text-slate-400">{task.status === 'todo' ? 'To Do' : task.status === 'inProgress' ? 'In Progress' : 'Done'}</span>
          </div>
          <button onClick={onClose} disabled={updating || deleting} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title</label>
            {editField === "title" ? (
              <div className="space-y-2">
                <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer">{updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : <p className="text-white font-medium cursor-pointer hover:text-purple-300 p-2 rounded-lg hover:bg-slate-700/50" onClick={() => startEdit("title", task.title)}>{task.title}</p>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            {editField === "description" ? (
              <div className="space-y-2">
                <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows="3" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-purple-500" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer">{updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : <p className="text-slate-300 text-sm cursor-pointer hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700/50" onClick={() => startEdit("description", task.description || "")}>{task.description || "Tap to add description"}</p>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Assigned To</label>
            {editField === "assignedUser" ? (
              <div className="space-y-2">
                <select value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer">{updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-white text-sm cursor-pointer hover:text-purple-300 p-2 rounded-lg hover:bg-slate-700/50" onClick={() => startEdit("assignedUser", task.assignedUser?._id || "")}>{task.assignedUser?.name || "Unassigned"}</p>
                {!task.assignedUser && members.length > 0 && <button onClick={smartAssign} disabled={updating} className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg cursor-pointer">🎯 Smart</button>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Priority</label>
            {editField === "priority" ? (
              <div className="space-y-2">
                <select value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                  {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={updating} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs cursor-pointer">{updating ? "..." : "Save"}</button>
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : <p className="text-white text-sm cursor-pointer hover:text-purple-300 p-2 rounded-lg hover:bg-slate-700/50 flex items-center" onClick={() => startEdit("priority", task.priority)}><span className="mr-2">{getPriorityIcon(task.priority)}</span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>}
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
        <div className="p-4 border-t border-purple-500/20 flex-shrink-0 bg-slate-800">
          <button onClick={handleDelete} disabled={deleting || updating} className="w-full py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg cursor-pointer flex items-center justify-center gap-2">
            {deleting ? "Deleting..." : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Delete Task</>}
          </button>
        </div>
      </div>
      <AlertModal isOpen={alertModal.isOpen} onClose={closeAlert} title={alertModal.title} message={alertModal.message} type={alertModal.type} showCancel={alertModal.showCancel} onConfirm={alertModal.onConfirm} />
    </div>,
    document.body
  );
};

export default TaskDetailModal;
