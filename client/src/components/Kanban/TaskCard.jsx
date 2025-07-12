import axios from "../../axios";
import { useState } from "react";

const priorities = ["low", "medium", "high"];

// Simple Conflict Modal Component
const ConflictModal = ({ serverTask, clientTask, onMerge, onOverwrite, onCancel }) => {
  return (
    <div>
      <div>
        <h3>Conflict Detected!</h3>
        <p>Another user has modified this task. Choose how to resolve:</p>
        
        <div>
          <h4>Your Changes:</h4>
          <div>
            <p><strong>Title:</strong> {clientTask.title}</p>
            <p><strong>Description:</strong> {clientTask.description}</p>
            <p><strong>Assigned:</strong> {clientTask.assignedUser || 'Unassigned'}</p>
            <p><strong>Priority:</strong> {clientTask.priority}</p>
          </div>
        </div>
        
        <div>
          <h4>Server Version:</h4>
          <div>
            <p><strong>Title:</strong> {serverTask.title}</p>
            <p><strong>Description:</strong> {serverTask.description}</p>
            <p><strong>Assigned:</strong> {serverTask.assignedUser?.name || 'Unassigned'}</p>
            <p><strong>Priority:</strong> {serverTask.priority}</p>
          </div>
        </div>
        
        <div>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onMerge}>Merge</button>
          <button onClick={onOverwrite}>Overwrite</button>
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, roomId, socketId, allTasks, onTaskUpdated, onTaskDeleted, members = [] }) => {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null); // 'title', 'description', 'assignedUser', 'priority'
  const [editValue, setEditValue] = useState("");
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setConflictData(null);
  };

  const handleConflictOverwrite = async () => {
    if (!conflictData) return;
    setShowConflictModal(false);
    setUpdating(true);
    try {
      const res = await axios.patch(`/task/update/${task._id}`, { 
        ...conflictData.clientTask, 
        force: true 
      }, {
        headers: {
          roomid: roomId,
          socketid: socketId,
        },
        withCredentials: true,
      });
      const data = res.data;
      onTaskUpdated(task._id, data.changes, data.log);
    } catch (error) {
      console.error("Error overwriting task:", error);
      alert("Failed to overwrite task");
    } finally {
      setUpdating(false);
      setConflictData(null);
    }
  };

  const handleConflictMerge = () => {
    // For now, just show the server version and let user edit
    setShowConflictModal(false);
    // Update the task with server version
    onTaskUpdated(task._id, conflictData.serverTask);
    setConflictData(null);
  };

  const smartAssign = async () => {
    if (task.assignedUser) return; // Already assigned
    
    // Find member with fewest active tasks
    const memberTaskCounts = members.map(member => {
      const activeTaskCount = allTasks.filter(t => 
        t.assignedUser?._id === member._id && t.status !== 'done'
      ).length;
      return { member, count: activeTaskCount };
    });
    
    if (memberTaskCounts.length === 0) return;
    
    const memberWithFewestTasks = memberTaskCounts.reduce((min, current) => 
      current.count < min.count ? current : min
    );
    
    // Assign the task to this member
    setUpdating(true);
    try {
      const res = await axios.patch(`/task/update/${task._id}`, { 
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
      if (data.message === "Conflict Detected") {
        setConflictData({ serverTask: data.serverTask, clientTask: data.clientTask });
        setShowConflictModal(true);
      } else {
        onTaskUpdated(task._id, data.changes, data.log);
      }
    } catch (error) {
      console.error("Error smart assigning task:", error);
      const message = error.response?.data?.message || "Failed to assign task";
      alert(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setDeleting(true);
    try {
      const res = await axios.delete(`/task/delete/${task._id}`, {
        headers: {
          roomid: roomId,
          socketid: socketId,
        },
        withCredentials: true,
      });
      const data = res.data;
      onTaskDeleted(task._id, data.log);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    } finally {
      setDeleting(false);
    }
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
    if (!editValue.trim()) return;
    
    setUpdating(true);
    try {
      const updateData = { version: task.version };
      updateData[editField] = editValue;
      
      const res = await axios.patch(`/task/update/${task._id}`, updateData, {
        headers: {
          roomid: roomId,
          socketid: socketId,
        },
        withCredentials: true,
      });
      const data = res.data;
      if (data.message === "Conflict Detected") {
        setConflictData({ serverTask: data.serverTask, clientTask: data.clientTask });
        setShowConflictModal(true);
      } else {
        onTaskUpdated(task._id, data.changes, data.log);
      }
      cancelEdit();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {/* Title */}
      <div>
        <span>Title: </span>
        {editField === "title" ? (
          <>
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
            />
            <button onClick={saveEdit} disabled={updating}>Save</button>
            <button onClick={cancelEdit} disabled={updating}>Cancel</button>
          </>
        ) : (
          <>
            <span>{task.title}</span>
            <button onClick={() => startEdit("title", task.title)} title="Edit title" disabled={updating}>✏️</button>
          </>
        )}
      </div>
      
      {/* Description */}
      <div>
        <span>Description: </span>
        {editField === "description" ? (
          <>
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
            />
            <button onClick={saveEdit} disabled={updating}>Save</button>
            <button onClick={cancelEdit} disabled={updating}>Cancel</button>
          </>
        ) : (
          <>
            <span>{task.description}</span>
            <button onClick={() => startEdit("description", task.description)} title="Edit description" disabled={updating}>✏️</button>
          </>
        )}
      </div>
      
      {/* Assigned User */}
      <div>
        <span>Assigned: </span>
        {editField === "assignedUser" ? (
          <>
            <select
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
            <button onClick={saveEdit} disabled={updating}>Save</button>
            <button onClick={cancelEdit} disabled={updating}>Cancel</button>
          </>
        ) : (
          <>
            <span>{task.assignedUser ? task.assignedUser.name : "Unassigned"}</span>
            <button onClick={() => startEdit("assignedUser", task.assignedUser?._id || "")} title="Edit assignee" disabled={updating}>✏️</button>
          </>
        )}
      </div>
      
      {/* Smart Assign Button - Only show when unassigned */}
      {!task.assignedUser && members.length > 0 && (
        <div>
          <button 
            onClick={smartAssign} 
            disabled={updating}
            title="Assign to member with fewest active tasks"
          >
            {updating ? "Assigning..." : "Smart Assign"}
          </button>
        </div>
      )}
      
      {/* Priority */}
      <div>
        <span>Priority: </span>
        {editField === "priority" ? (
          <>
            <select
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
            >
              {priorities.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <button onClick={saveEdit} disabled={updating}>Save</button>
            <button onClick={cancelEdit} disabled={updating}>Cancel</button>
          </>
        ) : (
          <>
            <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            <button onClick={() => startEdit("priority", task.priority)} title="Edit priority" disabled={updating}>✏️</button>
          </>
        )}
      </div>
      
      {/* Delete Button */}
      <button 
        onClick={handleDelete} 
        disabled={deleting || updating}
      >
        {deleting ? "🗑️ Deleting..." : "🗑️"}
      </button>
      
      {/* Conflict Modal */}
      {showConflictModal && conflictData && (
        <ConflictModal
          serverTask={conflictData.serverTask}
          clientTask={conflictData.clientTask}
          onMerge={handleConflictMerge}
          onOverwrite={handleConflictOverwrite}
          onCancel={handleConflictCancel}
        />
      )}
    </div>
  );
};

export default TaskCard;
  