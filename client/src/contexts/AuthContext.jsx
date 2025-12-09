import { createContext, useState, useEffect } from "react";
import { socket } from "../socket";
import axiosInstance from "../axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null while loading, false = not logged in
  const [loading, setLoading] = useState(true);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    axiosInstance.get("/user/verify", {
      withCredentials: true, // send the httpOnly cookie
    })
      .then((res) => {
        const data = res.data;
        if (data.isLoggedIn) {
          setUser(data.user);
        } else {
          setUser(false);
        }
      })
      .catch(() => setUser(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(()=>{
    if(user && !socket.connected){
      socket.connect();
    }

    const handleConnect = () => {
      setSocketId(socket.id);
    }
    socket.on("connect", handleConnect);

    return ()=>{
      socket.off("connect", handleConnect);
      if(user===false && socket.connected){
        socket.disconnect();
        setSocketId(null);
      }
    }
  }, [user]);

  const logout = async () => {
    try {
      await axiosInstance.get("/user/logout", {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally{
      setUser(false);
      if (socket.connected) {
        socket.disconnect();
        setSocketId(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, socketId, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };