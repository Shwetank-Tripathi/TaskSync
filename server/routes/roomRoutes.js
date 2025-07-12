const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/auth");
const { handleGetRooms, handleGetUserRooms, handleCreateRoom, handleGetRoom, handleUpdateRoom, handleDeleteRoom } = require("../controllers/room");

router.get("/all", isAuthenticated, handleGetRooms);
router.get("/", isAuthenticated, handleGetUserRooms);
router.post("/create", isAuthenticated, handleCreateRoom);
router.get("/:id", isAuthenticated, handleGetRoom);
router.patch("/:id", isAuthenticated, handleUpdateRoom);
router.delete("/:id", isAuthenticated, handleDeleteRoom);

module.exports = router;