import { useState } from "react";

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
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-3 sm:p-4 shadow-lg hover:border-purple-500/30 transition-all duration-200">
            {/* Header */}
            <div className="mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center mb-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Join a Room
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400">Enter a room ID to join existing workspace</p>
            </div>
            
            {/* Form */}
            <div className="space-y-2 sm:space-y-3">
                <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1 sm:mb-1.5">
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
                        className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-700/50 border rounded-md text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            error 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-slate-600 focus:ring-purple-500'
                        }`}
                    />
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mt-1 sm:mt-1.5 flex items-start text-red-400">
                            <svg className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-[10px] sm:text-xs leading-tight">{error}</p>
                        </div>
                    )}
                    
                    {/* Helper Text */}
                    {!error && (
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                            Room ID: 24 hex characters
                        </p>
                    )}
                </div>
                
                <button 
                    onClick={handleJoin} 
                    disabled={loading || !roomId.trim() || error}
                    className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white text-xs sm:text-sm font-medium rounded-md transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center cursor-pointer"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Joining...
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Join
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default JoinRoomForm;