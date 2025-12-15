import { createContext, useState, useEffect } from "react";
import { socket } from "../socket";
import axiosInstance from "../axios";

const AuthContext = createContext();

const isUidValid = (token) => {
  if(!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now()/1000;

    if(payload.exp && payload.exp < currentTime){
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null while loading, false = not logged in
  const [loading, setLoading] = useState(true);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("uid");

    if(token && !isUidValid(token)){
      localStorage.removeItem("uid");
      setUser(false);
      setLoading(false);
      return;
    }

    axiosInstance.get("/user/verify")
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
      localStorage.removeItem("uid");
    } catch (error) {
      console.error("Logout error:", error);
    } finally{
      setUser(null);
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