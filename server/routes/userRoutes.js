const express = require("express");
const { handleLogin, handleSignup, handleLogout, handleGetUsers, handleVerifyUser } = require("../controllers/user");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.get("/verify", handleVerifyUser);
router.post("/login", handleLogin);
router.post("/signup", handleSignup);
router.get("/logout", isAuthenticated, handleLogout);
router.get("/", isAuthenticated, handleGetUsers);

module.exports = router;
