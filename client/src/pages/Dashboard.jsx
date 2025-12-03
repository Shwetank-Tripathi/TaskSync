import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
        <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 flex-shrink-0">
                <div className="px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        TaskSync
                    </h1>
                    
                    <div className="flex items-center gap-4">
                        {/* Username Greeting */}
                        <span className="text-slate-300">
                            Hi, <span className="text-white font-medium">{user?.name || 'User'}</span>! 👋
                        </span>
                        
                        {/* Logout Button */}
                        <button 
                            onClick={logout}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-red-500/25"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <aside className="w-80 bg-slate-800/30 backdrop-blur-lg border-r border-purple-500/20 flex flex-col">
                    {!roomId ? (
                        <div className="p-6 space-y-6">
                            <CreateRoomForm onRoomCreated={handleEnterRoom} />
                            <JoinRoomForm onRoomJoined={handleEnterRoom} />
                        </div>
                    ) : loadingRoom ? (
                        <div className="flex items-center justify-center h-32 p-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                            <span className="ml-3 text-purple-300">Loading room...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full p-6 gap-6">
                            {/* Create Task Button */}
                            <div className="flex-shrink-0">
                                <CreateTaskButton onClick={() => setShowCreateTaskModal(true)} />
                            </div>
                            
                            {/* Activity Feed */}
                            <div className="flex-1 min-h-0">
                                <LogsTable logs={logs} />
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-0">
                    {!roomId ? (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Your Workspaces
                                    </h2>
                                    <p className="text-slate-400">Collaborate and manage tasks with your team</p>
                                </div>
                                
                                {loadingRooms ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                                        <span className="ml-4 text-purple-300 text-lg">Loading workspaces...</span>
                                    </div>
                                ) : !user ? (
                                    <div className="text-center py-16">
                                        <p className="text-slate-400">Loading user data...</p>
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="text-6xl mb-4">🚀</div>
                                        <h3 className="text-xl font-semibold mb-2 text-slate-300">No workspaces yet</h3>
                                        <p className="text-slate-400">Create or join a workspace to get started!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                                    className="group bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-xl font-semibold group-hover:text-purple-300 transition-colors">
                                                            {room.name}
                                                        </h3>
                                                        {isCreator ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRoom(room);
                                                                }}
                                                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
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
                                                                className="p-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded"
                                                                title="Leave Room"
                                                            >
                                                                👋
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center text-sm text-slate-400 mb-3">
                                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                                        Active workspace
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => handleEnterRoom(room._id)}
                                                        className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all text-purple-300 hover:text-purple-200"
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                            <span className="ml-4 text-purple-300 text-lg">Loading task board...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 p-6 min-h-0">
                            {/* Back button */}
                            <div className="flex-shrink-0 mb-6">
                                <button 
                                    onClick={handleBackToRooms}
                                    className="flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg transition-all duration-200 text-slate-300 hover:text-white"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Workspaces
                                </button>
                            </div>
                            
                            {/* Kanban Board */}
                            <div className="flex-1 min-h-0">
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