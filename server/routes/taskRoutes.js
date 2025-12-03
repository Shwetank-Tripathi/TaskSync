import express from "express";
import { handleCreateTask, handleDeleteTask, handleUpdateTask, handleGetTasks } from "../controllers/task.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", isAuthenticated, handleGetTasks);
router.post("/add", isAuthenticated, handleCreateTask);
router.delete("/delete/:id", isAuthenticated, handleDeleteTask);
router.patch("/update/:id", isAuthenticated, handleUpdateTask);

export default router;