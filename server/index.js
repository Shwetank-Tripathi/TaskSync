const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./connection");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const roomRoutes = require("./routes/roomRoutes");
const Room = require("./models/room");
const dotenv = require("dotenv");
const { auth } = require("./middlewares/auth");

dotenv.config();

connectDB(process.env.MONGODB_URI);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;


//For HTTP requests
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization","roomid", "socketid"]
}));

app.use(cookieParser());
app.use(express.json()); //built-in function in Express.js used to parse incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); //built-in function in Express.js used to parse incoming requests with URL-encoded payloads
app.use(auth);

app.use("/user", userRoutes);
app.use("/task", taskRoutes);
app.use("/rooms", roomRoutes);

//For WebSocket requests
const io = new Server(server,{
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"]  //In Socket.io, websocket is based on ws protocols, but if it's unavailable, it will use pooling that uses http protocols
  }
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("joinRoom", async ({roomId}) =>{
    try{
      const room = await Room.findById(roomId);
      if(!room) {
        socket.emit("joinRoomError", {message: "Room does not exist!"});
        return;
      }
      socket.join(roomId);
      console.log(`User joined room ${roomId}`);
    }catch(error){
      console.error("Error joining room", error);
      socket.emit("joinRoomError", error.message);
    }
  });

  socket.on("leaveRoom", ({roomId}) => {
    socket.leave(roomId);
    console.log(`User left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);
  });
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});