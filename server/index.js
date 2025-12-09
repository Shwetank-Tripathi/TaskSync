import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./lib/connectDB.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import { auth } from "./middlewares/auth.js";
import { app, httpServer } from "./lib/socket.js";

if (process.env.NODE_ENV !== "production") {
  process.loadEnvFile();
}

const PORT = process.env.PORT || 3000;

//For HTTP requests
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL || "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "roomid", "socketid"],
  })
);

app.use(cookieParser());
app.use(express.json()); //built-in function in Express.js used to parse incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); //built-in function in Express.js used to parse incoming requests with URL-encoded payloads

app.get("/", (req, res) => {
  res.send("Hello,World");
});

app.use(auth);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/user", apiLimiter, userRoutes);
app.use("/task", apiLimiter, taskRoutes);
app.use("/rooms", apiLimiter, roomRoutes);

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log("ERROR FOUND", err);
  }
})();
