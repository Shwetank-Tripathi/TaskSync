import { useState } from "react";
import axios from "../../axios";

const CreateRoomForm = ({onRoomCreated}) => {
    const [roomName, setRoomName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if(!roomName.trim())  return alert("Room name is required");
        
        setLoading(true);
        try{
            const res = await axios.post("/rooms/create", {name: roomName}, {
                withCredentials: true,
            });
            const data = res.data;
            onRoomCreated(data.room._id);
            setRoomName(""); // Clear input after successful creation
        }
        catch(error){
            console.error("Error Creating Room", error);
            const message = error.response?.data?.message || "Failed to create room";
            alert(message);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="dialog-box">
            <h3>Create a New Room</h3>
            <input
                type="text"
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
                maxLength="50"
                disabled={loading}
            />
            <button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create"}
            </button>
        </div>
    );
};

export default CreateRoomForm;                                 