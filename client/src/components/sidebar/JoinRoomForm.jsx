import { useState } from "react";

const JoinRoomForm = ({onRoomJoined}) => {
    const [roomId, setRoomId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateObjectId = (id) => {
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        return objectIdPattern.test(id);
    };

    const handleJoin = () => {
        setError("");
        if(!roomId.trim()) {
            setError("Room ID is required");
            return;
        }
        
        if(!validateObjectId(roomId.trim())) {
            setError("Invalid Room ID format");
            return;
        }
        
        setLoading(true);
        onRoomJoined(roomId.trim());
        setRoomId(""); // Clear input after joining
        setLoading(false);
    };

    return (
        <div className="dialog-box">
            <h3>Join a Room</h3>
            <input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => {
                    setRoomId(e.target.value);
                    setError("");
                }}
                required
                pattern="[0-9a-fA-F]{24}"
                title="Please enter a valid Room ID"
                disabled={loading}
            />
            {error && <p>{error}</p>}
            <button onClick={handleJoin} disabled={loading}>
                {loading ? "Joining..." : "Join"}
            </button>
        </div>
    );
};

export default JoinRoomForm;