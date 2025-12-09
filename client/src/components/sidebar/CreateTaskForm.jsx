import { useState } from "react";
import { Plus } from "lucide-react";
import axiosInstance from "../../axios";

const CreateTaskForm = ({roomId, members, socketId, onTaskCreated}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedUser, setAssignedUser] = useState("");
    const [priority, setPriority] = useState("medium");
    const [status, setStatus] = useState("todo");
    const [loading, setLoading] = useState(false);

    const handleCreate = async() => {
        if(!title.trim()) return alert("Title is required");

        setLoading(true);
        try{
            const res = await axiosInstance.post("/task/add", {title, description, assignedUser: assignedUser || null, priority, status}, {
                headers: {
                    roomid: roomId,
                    socketid: socketId,
                },
                withCredentials: true,
            });
            const data = res.data;
            if(res.status === 201){
                setTitle("");
                setDescription("");
                setAssignedUser("");
                setPriority("medium");
                setStatus("todo");
                onTaskCreated(data.task);
            }
            else{
                alert(data.message || "Failed to create task");
            }
        }
        catch(error){
            console.error("Error creating task", error);
            const message = error.response?.data?.message || "Failed to create task";
            alert(message);
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-400" />
                Create New Task
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                    <input
                        type="text"
                        placeholder="Task title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength="200"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-sm"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                        placeholder="Task description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength="500"
                        rows="3"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-sm resize-none"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Assignee</label>
                        <select
                            value={assignedUser}
                            onChange={(e) => setAssignedUser(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-sm"
                        >
                            <option value="">Unassigned</option>
                            {(members || []).map((user) => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-sm"
                        >
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🔴 High</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-sm"
                    >
                        <option value="todo">📋 To Do</option>
                        <option value="inProgress">⚡ In Progress</option>
                        <option value="done">✅ Done</option>
                    </select>
                </div>
                
                <button 
                    onClick={handleCreate} 
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-800/25 disabled:cursor-not-allowed text-sm"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                        </div>
                    ) : (
                        "Create Task"
                    )}
                </button>
            </div>
        </div>
    )
};

export default CreateTaskForm;