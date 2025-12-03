import { useState } from "react";
import axiosInstance from "../../axios";

const CreateRoomForm = ({ onRoomCreated }) => {
    const [roomName, setRoomName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!roomName.trim()) {
            alert("Room name is required");
            return;
        }
        
        setLoading(true);
        try {
            const res = await axiosInstance.post("/rooms/create", { name: roomName }, {
                withCredentials: true,
            });
            const data = res.data;
            onRoomCreated(data.room._id);
            setRoomName(""); // Clear input after successful creation
        } catch (error) {
            console.error("Error Creating Room", error);
            const message = error.response?.data?.message || "Failed to create room";
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleCreate();
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4 shadow-lg hover:border-purple-500/30 transition-all duration-200">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-base font-semibold text-white flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create a New Room
                </h3>
                <p className="text-xs text-slate-400">Start collaborating with your team</p>
            </div>
            
            {/* Form */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Room Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter room name..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        required
                        maxLength="50"
                        disabled={loading}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">{roomName.length}/50 characters</p>
                </div>
                
                <button 
                    onClick={handleCreate} 
                    disabled={loading || !roomName.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white text-sm font-medium rounded-md transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Creating...
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateRoomForm;                                 