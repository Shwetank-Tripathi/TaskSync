import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CreateRoomForm from "../components/sidebar/CreateRoomForm";
import JoinRoomForm from "../components/sidebar/JoinRoomForm";
import CreateTaskForm from "../components/sidebar/CreateTaskForm";
import LogsTable from "../components/sidebar/LogsTable";
import KanbanBoard from "../components/Kanban/KanbanBoard";
import "../styles/dashboard.css";
import { socket } from "../socket";
import axios from "../axios";

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

    //1. Fetch all rooms on mount
    useEffect(()=>{
        setLoadingRooms(true);
        axios.get("/rooms", {
            withCredentials: true,
        })
        .then(res => setRooms(res.data.rooms || []))
        .catch(error => {
            console.error("Error fetching rooms:", error);
            alert("Failed to load rooms");
        })
        .finally(() => setLoadingRooms(false));
    }, []);

    //2. Load room if URL has roomId
    useEffect(() => {
        if (!roomId || !user) return;
      
        const loadRoom = async (roomId) => {
          setLoadingRoom(true);
          try {
            const res = await axios.get(`/rooms/${roomId}`, {
              withCredentials: true,
            });
            const data = res.data;

            if(res.status !== 200){
                throw new Error(data.message || "Failed to load room");
            }

            setTasks(data.room.tasks || []);
            setLogs((data.room.logs || []).slice(-20).reverse());
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
          setTasks(prev => [...prev, task]);
          setLogs(prev => [log, ...prev.slice(0, 19)]);
        };
        
        const handleTaskUpdated = ({ id, changes, log }) => {
          setTasks(prev => prev.map(t => (t._id === id ? { ...t, ...changes } : t)));
          setLogs(prev => [log, ...prev.slice(0, 19)]);
        };
        
        const handleTaskDeleted = ({ id, log }) => {
          setTasks(prev => prev.filter(t => t._id !== id));
          setLogs(prev => [log, ...prev.slice(0, 19)]);
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

    return (
        <div className="dashboard-container">
            <button onClick={logout}>
                Logout
            </button>
            <div className="sidebar">
                {!roomId?(
                    <>
                        <CreateRoomForm onRoomCreated={handleEnterRoom} />
                        <JoinRoomForm onRoomJoined={handleEnterRoom} />
                    </>
                ):loadingRoom ? (
                    <p>Loading room...</p>
                ):(
                    <>
                        <CreateTaskForm 
                            roomId={roomId} 
                            members={members}
                            socketId={socketId} 
                            onTaskCreated={(task, log) => {
                                setTasks(prev => [...prev, task]);
                                setLogs(prev => [log, ...prev]);
                            }}
                        />
                        <LogsTable logs={logs} />
                    </>
                )}
            </div>

            <div className="main-panel">
                {!roomId ? (
                    <div className="room-list">
                        <h2>Your Rooms</h2>
                        {loadingRooms ? (
                            <p>Loading rooms...</p>
                        ) : rooms.length===0 ? (
                            <p>No rooms yet. Create or Join one!</p>
                        ):(
                            <div>
                                {(rooms || []).map(room => (
                                    <div
                                        key={room._id}
                                        className="room-card"
                                        onClick={() => handleEnterRoom(room._id)}
                                    >
                                        <h3>{room.name}</h3>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : loadingRoom ? (
                    <p>Loading Task Board...</p>
                ) : (
                    <>
                        <div>
                            <button className="back-btn" onClick={handleBackToRooms}>
                                 Back to Rooms
                            </button>
                        </div>
                        <div>
                            <KanbanBoard
                                tasks={tasks}
                                roomId={roomId}
                                socketId={socketId}
                                userId={user._id}
                                members={members}
                                onTaskUpdated={(id, changes, log) => {
                                    setTasks(prev => prev.map(t => (t._id === id ? { ...t, ...changes } : t)));
                                    setLogs(prev => [log, ...prev]);
                                }}
                                onTaskDeleted={(id, log) => {
                                    setTasks(prev => prev.filter(t => t._id !== id));
                                    setLogs(prev => [log, ...prev]);
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;