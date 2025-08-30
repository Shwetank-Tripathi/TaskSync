import { useState } from "react";
import axios from "../../axios";

const CreateTaskModal = ({ isOpen, onClose, roomId, members, socketId, onTaskCreated }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedUser, setAssignedUser] = useState("");
    const [priority, setPriority] = useState("medium");
    const [status, setStatus] = useState("todo");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setAssignedUser("");
        setPriority("medium");
        setStatus("todo");
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            alert("Title is required");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("/task/add", {
                title, 
                description, 
                assignedUser: assignedUser || null, 
                priority, 
                status
            }, {
                headers: {
                    roomid: roomId,
                    socketid: socketId,
                },
                withCredentials: true,
            });
            
            const data = res.data;
            if (res.status === 201) {
                onTaskCreated(data.task, data.log);
                resetForm();
                onClose();
            } else {
                alert(data.message || "Failed to create task");
            }
        } catch (error) {
            console.error("Error creating task", error);
            const message = error.response?.data?.message || "Failed to create task";
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-slate-800 border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create New Task
                    </h2>
                    <button 
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            placeholder="Enter task title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength="100"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            autoFocus
                        />
                        <p className="text-xs text-slate-400 mt-1">{title.length}/100 characters</p>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            placeholder="Enter task description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength="500"
                            rows="4"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">{description.length}/500 characters</p>
                    </div>
                    
                    {/* Assignee and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Assignee
                            </label>
                            <select
                                value={assignedUser}
                                onChange={(e) => setAssignedUser(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="">🤷 Unassigned</option>
                                {(members || []).map((user) => (
                                    <option key={user._id} value={user._id}>
                                        👤 {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="low">🟢 Low Priority</option>
                                <option value="medium">🟡 Medium Priority</option>
                                <option value="high">🔴 High Priority</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Initial Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="todo">📋 To Do</option>
                            <option value="inProgress">⚡ In Progress</option>
                            <option value="done">✅ Done</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-slate-600">
                        <button 
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCreate} 
                            disabled={loading || !title.trim()}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </div>
                            ) : (
                                "Create Task"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
