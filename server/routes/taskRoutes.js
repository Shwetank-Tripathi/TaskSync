const express = require("express");
const { handleCreateTask, handleDeleteTask, handleUpdateTask, handleGetTasks } = require("../controllers/task");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.get("/", isAuthenticated, handleGetTasks);
router.post("/add", isAuthenticated, handleCreateTask);
router.delete("/delete/:id", isAuthenticated, handleDeleteTask);
router.patch("/update/:id", isAuthenticated, handleUpdateTask);

module.exports = router;