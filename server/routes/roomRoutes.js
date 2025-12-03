import express from "express";
const router = express.Router();
import { isAuthenticated } from "../middlewares/auth.js";
import { handleGetRooms, handleGetUserRooms, handleCreateRoom, handleGetRoom, handleUpdateRoom, handleDeleteRoom, handleLeaveRoom } from "../controllers/room.js";

router.get("/all", isAuthenticated, handleGetRooms);
router.get("/", isAuthenticated, handleGetUserRooms);
router.post("/create", isAuthenticated, handleCreateRoom);
router.get("/:id", isAuthenticated, handleGetRoom);
router.patch("/:id", isAuthenticated, handleUpdateRoom);
router.delete("/:id", isAuthenticated, handleDeleteRoom);
router.patch("/:id/leave", isAuthenticated, handleLeaveRoom);

export default router;