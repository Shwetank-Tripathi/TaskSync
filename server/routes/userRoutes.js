import express from "express";
import { handleLogin, handleSignup, handleLogout, handleGetUsers, handleVerifyUser } from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/verify", handleVerifyUser);
router.post("/login", handleLogin);
router.post("/signup", handleSignup);
router.get("/logout", isAuthenticated, handleLogout);
router.get("/", isAuthenticated, handleGetUsers);

export default router;
