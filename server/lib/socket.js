import { Server } from "socket.io";
import http from "http";
import express from "express";
import Room from "../models/room.js";

process.loadEnvFile();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const app = express();
const httpServer = http.createServer(app); //need to pass the express instance to the http server to handle the express routes and middleware.

//For WebSocket requests
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"], //In Socket.io, websocket is based on ws protocols, but if it's unavailable, it will use pooling that uses http protocols
  },
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("joinRoom", async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit("joinRoomError", { message: "Room does not exist!" });
        return;
      }
      socket.join(roomId);
      console.log(`User joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining room", error);
      socket.emit("joinRoomError", error.message);
    }
  });

  socket.on("leaveRoom", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`User left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);
  });
});

app.set("io", io);

// export function getReceiverSocketId(userId) {
//   return userSocketMap[userId];
// }

export { io, app, httpServer };
