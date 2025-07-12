import { useState } from "react";
import axios from "../../axios";

const CreateTaskForm = ({roomId, members, socketId, onTaskCreated}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedUser, setAssignedUser] = useState("");
    const [priority, setPriority] = useState("medium");
    const [status, setStatus] = useState("todo");
    const [loading, setLoading] = useState(false);

    const handleCreate = async() =>{
        if(!title.trim()) return alert("Title is required");

        setLoading(true);
        try{
            const res = await axios.post("/task/add", {title, description, assignedUser: assignedUser || null, priority, status}, {
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
        <div className="dialog-box">
            <h3>Create a New Task</h3>
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength="100"
            />
            <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength="500"
            />
            <select
                value={assignedUser}
                onChange={(e) => setAssignedUser(e.target.value)}
            >
                <option value="">Select Member</option>
                {(members || []).map((user) => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                ))}
            </select>
            <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
            >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
            >
                <option value="todo">To Do</option>
                <option value="inProgress">In Progress</option>
                <option value="done">Done</option>
            </select>
            <button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
            </button>
        </div>
    )
};

export default CreateTaskForm;