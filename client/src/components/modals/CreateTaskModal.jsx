import { useState } from "react";
import { Plus, X } from "lucide-react";
import axiosInstance from "../../axios";

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
            const res = await axiosInstance.post("/task/add", {
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-gray-900 border border-blue-600/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-lg sm:max-w-xl lg:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-400" />
                        Create New Task
                    </h2>
                    <button 
                        onClick={handleClose}
                        disabled={loading}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            placeholder="Enter task title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength="200"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                            autoFocus
                        />
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{title.length}/200 characters</p>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                            Description
                        </label>
                        <textarea
                            placeholder="Enter task description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength="500"
                            rows="3"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{description.length}/500 characters</p>
                    </div>
                    
                    {/* Assignee and Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                Assignee
                            </label>
                            <select
                                value={assignedUser}
                                onChange={(e) => setAssignedUser(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 cursor-pointer"
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
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 cursor-pointer"
                            >
                                <option value="low">🟢 Low Priority</option>
                                <option value="medium">🟡 Medium Priority</option>
                                <option value="high">🔴 High Priority</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Status */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                            Initial Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 cursor-pointer"
                        >
                            <option value="todo">📋 To Do</option>
                            <option value="inProgress">⚡ In Progress</option>
                            <option value="done">✅ Done</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-700">
                        <button 
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 py-2.5 sm:py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 cursor-pointer text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCreate} 
                            disabled={loading || !title.trim()}
                            className="flex-1 py-2.5 sm:py-3 px-4 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-800/25 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
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
