import { useState } from "react";
import { LogIn, AlertTriangle } from "lucide-react";

const JoinRoomForm = ({ onRoomJoined }) => {
    const [roomId, setRoomId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateObjectId = (id) => {
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        return objectIdPattern.test(id);
    };

    const handleJoin = () => {
        setError("");
        if (!roomId.trim()) {
            setError("Room ID is required");
            return;
        }
        
        if (!validateObjectId(roomId.trim())) {
            setError("Invalid Room ID format");
            return;
        }
        
        setLoading(true);
        onRoomJoined(roomId.trim());
        setRoomId(""); // Clear input after joining
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleJoin();
        }
    };

    const handleInputChange = (e) => {
        setRoomId(e.target.value);
        setError(""); // Clear error when user types
    };

    return (
        <div className="bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg p-3 sm:p-4 shadow-lg hover:border-blue-600 transition-all duration-200">
            {/* Header */}
            <div className="mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center mb-1">
                    <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-blue-400" />
                    Join a Room
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400">Enter a room ID to join existing workspace</p>
            </div>
            
            {/* Form */}
            <div className="space-y-2 sm:space-y-3">
                <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-1 sm:mb-1.5">
                        Room ID
                    </label>
                    <input
                        type="text"
                        placeholder="Enter 24-character room ID..."
                        value={roomId}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        required
                        pattern="[0-9a-fA-F]{24}"
                        title="Please enter a valid Room ID"
                        disabled={loading}
                        className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border rounded-md text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            error 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-600 focus:ring-blue-600'
                        }`}
                    />
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mt-1 sm:mt-1.5 flex items-start text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] sm:text-xs leading-tight">{error}</p>
                        </div>
                    )}
                    
                    {/* Helper Text */}
                    {!error && (
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                            Room ID: 24 hex characters
                        </p>
                    )}
                </div>
                
                <button 
                    onClick={handleJoin} 
                    disabled={loading || !roomId.trim() || error}
                    className="w-full py-2 sm:py-2.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-md transition-all duration-200 shadow-lg hover:shadow-blue-800/25 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center cursor-pointer"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Joining...
                        </>
                    ) : (
                        <>
                            <LogIn className="w-3 h-3 mr-1.5 sm:mr-2" />
                            Join
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default JoinRoomForm;