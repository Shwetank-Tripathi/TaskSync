import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, X, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import CreateRoomForm from "../components/sidebar/CreateRoomForm";
import JoinRoomForm from "../components/sidebar/JoinRoomForm";
import CreateTaskButton from "../components/sidebar/CreateTaskButton";
import CreateTaskModal from "../components/modals/CreateTaskModal";
import LogsTable from "../components/sidebar/LogsTable";
import KanbanBoard from "../components/Kanban/KanbanBoard";
// import "../styles/dashboard.css";
import { socket } from "../socket";
import axiosInstance from "../axios";

const Dashboard = () => {
    const {user, socketId, logout} = useAuth();
    const navigate = useNavigate();
    const { roomId } = useParams();

    const [rooms, setRooms] = useState([]);
    const [loadingRoom, setLoadingRoom] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [logs, setLogs] = useState([]);
    const [members, setMembers] = useState([]);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar when navigating
    const closeSidebar = () => setSidebarOpen(false);

    const loadRooms = async () => {
        try {
            setLoadingRooms(true);
            console.log("🔄 Loading rooms...");
            const res = await axiosInstance.get("/rooms", {
                withCredentials: true,
            });
            const roomsData = res.data.rooms || [];
            console.log("📁 Rooms loaded:", roomsData.length, "rooms");
            setRooms(roomsData);
        } catch (error) {
            console.error("Error fetching rooms:", error);
            alert("Failed to load rooms");
        } finally {
            setLoadingRooms(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadRooms();
        }
    }, [user]);

    //2. Load room if URL has roomId
    useEffect(() => {
        if (!roomId || !user) return;
      
        const loadRoom = async (roomId) => {
          setLoadingRoom(true);
          try {
            console.log("🏠 Loading room:", roomId);
            const res = await axiosInstance.get(`/rooms/${roomId}`, {
              withCredentials: true,
            });
            const data = res.data;

            if(res.status !== 200){
                throw new Error(data.message || "Failed to load room");
            }

            console.log("📊 Room data received:", data.room);
            console.log("📝 Initial logs:", data.room.logs);

            setTasks(data.room.tasks || []);
            
            // Filter and process logs
            const roomLogs = data.room.logs || [];
            const validLogs = roomLogs.filter(log => 
              log && typeof log === 'object' && log.action && typeof log.action === 'string'
            );
            console.log("✅ Valid logs after filtering:", validLogs);
            
            setLogs(validLogs.slice(-20).reverse());
            setMembers(data.room.members || []);
            
            // Ensure socket is connected before joining room
            if (socket.connected) {
              socket.emit("joinRoom", { roomId });
            } else {
              socket.connect();
              const timeout = setTimeout(() => {
                console.error("Socket connection timeout");
                alert("Failed to connect to real-time updates");
              }, 5000);
              
              socket.once("connect", () => {
                clearTimeout(timeout);
                socket.emit("joinRoom", { roomId });
              });
              
              socket.once("connect_error", () => {
                clearTimeout(timeout);
                console.error("Socket connection failed");
                alert("Failed to connect to real-time updates");
              });
            }
          } catch (error) {
            alert(error.message || "An unexpected error occurred");
            console.error("Error Loading Room", error);
            navigate("/rooms");
          } finally {
            setLoadingRoom(false);
          }
        };
      
        loadRoom(roomId);
      }, [roomId, user, navigate]);
      
    
    //3. Setup Socket Listeners

    useEffect(() => {
        if (!roomId || !user) return;

        const handleTaskCreated = ({ task, log }) => {
          console.log("📥 Socket: task created", { task, log });
          setTasks(prev => [...prev, task]);
          if (log && log.action) {
            setLogs(prev => [log, ...prev.slice(0, 19)]);
          }
        };
        
        const handleTaskUpdated = ({ id, changes, log }) => {
          console.log("📥 Socket: task updated", { id, changes, log });
          setTasks(prev => prev.map(t => (t._id === id ? { ...t, ...changes } : t)));
          if (log && log.action) {
            setLogs(prev => [log, ...prev.slice(0, 19)]);
          }
        };
        
        const handleTaskDeleted = ({ id, log }) => {
          console.log("📥 Socket: task deleted", { id, log });
          setTasks(prev => prev.filter(t => t._id !== id));
          if (log && log.action) {
            setLogs(prev => [log, ...prev.slice(0, 19)]);
          }
        };

        const handleJoinRoomError = ({ message }) => {
          alert(`Failed to join room: ${message}`);
          navigate("/rooms");
        };

        socket.on("task:created", handleTaskCreated);
        socket.on("task:updated", handleTaskUpdated);
        socket.on("task:deleted", handleTaskDeleted);
        socket.on("joinRoomError", handleJoinRoomError);

        return () => {
          socket.off("task:created", handleTaskCreated);
          socket.off("task:updated", handleTaskUpdated);
          socket.off("task:deleted", handleTaskDeleted);
          socket.off("joinRoomError", handleJoinRoomError);
        };
      }, [roomId, user, navigate]);
    
      const handleBackToRooms = () => {
        socket.emit("leaveRoom", { roomId });
        navigate("/rooms");
        setTasks([]);
        setLogs([]);
        setMembers([]);
      };

    const handleEnterRoom = async (id) => {
        navigate(`/rooms/${id}`);
    }

    // Add this to refresh rooms when coming back from a room
    useEffect(() => {
        // If we're back on the main dashboard (no roomId) and we have a user
        if (!roomId && user && rooms.length > 0) {
            console.log("🔄 Back to dashboard - refreshing rooms");
            loadRooms();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, user]);

    // Delete room (only for creators) - IMPROVED
    const handleDeleteRoom = async (roomToDelete) => {
        if (!window.confirm(`Are you sure you want to DELETE "${roomToDelete.name}"? This will permanently delete the room and ALL tasks inside it. This action cannot be undone.`)) {
            return;
        }

        try {
            console.log("🗑️ Deleting room:", roomToDelete.name);
            await axiosInstance.delete(`/rooms/${roomToDelete._id}`, {
                withCredentials: true
            });
            
            console.log("✅ Room deleted successfully");
            
            // If currently in the deleted room, navigate back to dashboard first
            if (roomId === roomToDelete._id) {
                navigate("/rooms");
            }
            
            // Then refresh the rooms list
            await loadRooms();
            
        } catch (error) {
            console.error("Error deleting room:", error);
            if (error.response?.status === 403) {
                alert("Only the room creator can delete this room. Use 'Leave Room' to exit as a member.");
            } else {
                alert("Failed to delete room: " + (error.response?.data?.message || error.message));
            }
        }
    };

    // Leave room (for non-creators)
    const handleLeaveRoom = async (roomToLeave) => {
        if (!window.confirm(`Are you sure you want to leave "${roomToLeave.name}"?`)) {
            return;
        }

        try {
            console.log("👋 Leaving room:", roomToLeave.name);
            await axiosInstance.patch(`/rooms/${roomToLeave._id}/leave`, {}, {
                withCredentials: true
            });
            
            console.log("✅ Left room successfully");
            
            // If currently in the left room, navigate back to dashboard first
            if (roomId === roomToLeave._id) {
                navigate("/rooms");
            }
            
            // Then refresh the rooms list
            await loadRooms();
            
        } catch (error) {
            console.error("Error leaving room:", error);
            if (error.response?.status === 400) {
                alert(error.response.data.message);
            } else {
                alert("Failed to leave room: " + (error.response?.data?.message || error.message));
            }
        }
    };

    return (
        <div className="h-screen bg-[#0F0F0F] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-[#1A1A1A] backdrop-blur-xl border-b border-gray-700 flex-shrink-0 z-30">
                <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 flex justify-between items-center">
                    {/* Left side - Hamburger and Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Hamburger Menu Button - visible below xl (1280px) */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors xl:hidden cursor-pointer"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? (
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            ) : (
                                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                        </button>
                        
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            TaskSync
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Username Greeting - hidden on very small screens */}
                        <span className="text-gray-300 text-sm sm:text-base">
                            <span className="hidden sm:inline">Hi, </span>
                            <span className="text-white font-medium">{user?.name || 'User'}</span>
                        </span>
                        
                        {/* Logout Button */}
                        <button 
                            onClick={logout}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-800 hover:bg-blue-900 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-blue-800/25 cursor-pointer text-sm sm:text-base flex items-center gap-2"
                        >
                            <span className="hidden sm:inline">Logout</span>
                            <LogOut className="w-5 h-5 sm:hidden" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 relative">
                {/* Overlay - visible below xl when sidebar is open */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 xl:hidden"
                        onClick={closeSidebar}
                    />
                )}
                
                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-30 w-72 sm:w-80 bg-gray-900 xl:bg-gray-900 backdrop-blur-lg border-r border-gray-700 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    xl:relative xl:translate-x-0 xl:w-80
                `}>
                    {/* Sidebar header with close button - visible below xl */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 xl:hidden">
                        <span className="text-lg font-semibold text-blue-400">Menu</span>
                        <button
                            onClick={closeSidebar}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {!roomId ? (
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
                            <CreateRoomForm onRoomCreated={(id) => { closeSidebar(); handleEnterRoom(id); }} />
                            <JoinRoomForm onRoomJoined={(id) => { closeSidebar(); handleEnterRoom(id); }} />
                        </div>
                    ) : loadingRoom ? (
                        <div className="flex items-center justify-center h-32 p-4 sm:p-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-blue-400 text-sm sm:text-base">Loading room...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full p-4 sm:p-6 gap-4 sm:gap-6 overflow-hidden">
                            {/* Create Task Button */}
                            <div className="flex-shrink-0">
                                <CreateTaskButton onClick={() => { closeSidebar(); setShowCreateTaskModal(true); }} />
                            </div>
                            
                            {/* Activity Feed */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <LogsTable logs={logs} />
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {!roomId ? (
                        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-4 sm:mb-6 md:mb-8">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white">
                                        Your Workspaces
                                    </h2>
                                    <p className="text-gray-400 text-sm sm:text-base">Collaborate and manage tasks with your team</p>
                                </div>
                                
                                {loadingRooms ? (
                                    <div className="flex items-center justify-center h-48 sm:h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 sm:ml-4 text-blue-400 text-sm sm:text-lg">Loading workspaces...</span>
                                    </div>
                                ) : !user ? (
                                    <div className="text-center py-12 sm:py-16">
                                        <p className="text-gray-400 text-sm sm:text-base">Loading user data...</p>
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <div className="text-center py-12 sm:py-16">
                                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-300">No workspaces yet</h3>
                                        <p className="text-gray-400 text-sm sm:text-base">Create or join a workspace to get started!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                        {rooms.map(room => {
                                            console.log("🔍 Debug:", { 
                                                roomCreatedBy: room.createdBy, 
                                                userId: user?._id, 
                                                roomCreatedByType: typeof room.createdBy,
                                                userIdType: typeof user?._id,
                                                isEqual: room.createdBy === user?._id,
                                                roomObject: room
                                            });
                                            
                                            // Safe comparison with proper null checks
                                            const isCreator = room?.createdBy && user?._id && 
                                                             room.createdBy.toString() === user._id.toString();
                                            
                                            return (
                                                <div
                                                    key={room._id}
                                                    className="group bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-5 md:p-6 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                >
                                                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                                                        <h3 className="text-base sm:text-lg md:text-xl font-semibold group-hover:text-blue-400 transition-colors truncate mr-2 text-white">
                                                            {room.name}
                                                        </h3>
                                                        {isCreator ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRoom(room);
                                                                }}
                                                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded cursor-pointer flex-shrink-0"
                                                                title="Delete Room"
                                                            >
                                                                🗑️
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLeaveRoom(room);
                                                                }}
                                                                className="p-1.5 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded cursor-pointer flex-shrink-0"
                                                                title="Leave Room"
                                                            >
                                                                👋
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                                        Active workspace
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => handleEnterRoom(room._id)}
                                                        className="w-full py-2 bg-blue-800/20 hover:bg-blue-800/30 border border-blue-800/30 rounded-lg transition-all text-blue-300 hover:text-blue-200 cursor-pointer text-sm sm:text-base"
                                                    >
                                                        Enter Workspace
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : loadingRoom ? (
                        <div className="flex items-center justify-center flex-1">
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 sm:ml-4 text-blue-400 text-sm sm:text-lg">Loading task board...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-6 min-h-0 overflow-hidden">
                            {/* Back button */}
                            <div className="flex-shrink-0 mb-3 sm:mb-4 md:mb-6">
                                <button 
                                    onClick={handleBackToRooms}
                                    className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-200 text-gray-300 hover:text-white cursor-pointer text-sm sm:text-base"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1.5 sm:mr-2" />
                                    <span className="hidden sm:inline">Back to Workspaces</span>
                                    <span className="sm:hidden">Back</span>
                                </button>
                            </div>
                            
                            {/* Kanban Board */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <KanbanBoard
                                    tasks={tasks}
                                    roomId={roomId}
                                    socketId={socketId}
                                    userId={user._id}
                                    members={members}
                                    onTaskUpdated={(id, changes, log) => {
                                        console.log("🔄 Task update received:", { id, changes, log });
                                        
                                        // Update task with changes
                                        setTasks(prev => {
                                          const updated = prev.map(t => 
                                            t._id === id ? { ...t, ...changes } : t
                                          );
                                          console.log("📝 Tasks after update:", updated.find(t => t._id === id));
                                          return updated;
                                        });
                                        
                                        // Add log only if it's valid and has required properties
                                        if (log && log.action && typeof log.action === 'string' && log.action.trim()) {
                                            console.log("📋 Adding valid log:", log);
                                            setLogs(prev => [log, ...prev]);
                                        } else if (log) {
                                            console.warn("⚠️ Invalid log received:", log);
                                        }
                                    }}
                                    onTaskDeleted={(id, log) => {
                                        console.log("🗑️ Task deletion:", { id, log });
                                        setTasks(prev => prev.filter(t => t._id !== id));
                                        // Add log only if it's valid
                                        if (log && log.action && typeof log.action === 'string' && log.action.trim()) {
                                            setLogs(prev => [log, ...prev]);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={showCreateTaskModal}
                onClose={() => setShowCreateTaskModal(false)}
                roomId={roomId}
                members={members}
                socketId={socketId}
                onTaskCreated={(task, log) => {
                    console.log("➕ Task created:", { task, log });
                    setTasks(prev => [...prev, task]);
                    // Add log only if it's valid
                    if (log && log.action && typeof log.action === 'string' && log.action.trim()) {
                        setLogs(prev => [log, ...prev]);
                    }
                }}
            />
        </div>
    );
};

export default Dashboard;