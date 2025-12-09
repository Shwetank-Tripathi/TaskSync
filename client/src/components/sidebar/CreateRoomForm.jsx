import { useState } from "react";
import { Plus } from "lucide-react";
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
        <div className="bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg p-3 sm:p-4 shadow-lg hover:border-blue-600 transition-all duration-200">
            {/* Header */}
            <div className="mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center mb-1">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-blue-400" />
                    Create a New Room
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400">Start collaborating with your team</p>
            </div>
            
            {/* Form */}
            <div className="space-y-2 sm:space-y-3">
                <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-1 sm:mb-1.5">
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
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{roomName.length}/50 characters</p>
                </div>
                
                <button 
                    onClick={handleCreate} 
                    disabled={loading || !roomName.trim()}
                    className="w-full py-2 sm:py-2.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-md transition-all duration-200 shadow-lg hover:shadow-blue-800/25 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center cursor-pointer"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Creating...
                        </>
                    ) : (
                        <>
                            <Plus className="w-3 h-3 mr-1.5 sm:mr-2" />
                            Create
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateRoomForm;                                 