const User = require("../models/user");
const bcrypt = require("bcrypt");
const { setUser } = require("../services/jwt");

async function handleGetUsers(req, res) {
    const users = await User.find();
    return res.status(200).json({ users });
}

async function handleVerifyUser(req, res) {
    if (!req.user) {
        return res.status(401).json({ isLoggedIn: false });
    }
    return res.status(200).json({ isLoggedIn: true, user: req.user });
}

async function handleLogin(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required" });
        }
        
        if (!password || !password.trim()) {
            return res.status(400).json({ message: "Password is required" });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const {password: _, ...userWithoutPassword} = user.toObject(); //remove password from user object to avoid sending it with jwt
        const uid = setUser(userWithoutPassword);//converting the user object to token and signing it
        return res.status(200).cookie("uid", uid, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 }).json({ message: "Login successful"});
    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleSignup(req, res) {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required" });
        }
        if (!password || !password.trim()) {
            return res.status(400).json({ message: "Password is required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ message: "User already exists. Kindly login" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword });
        const {password: _, ...userWithoutPassword} = newUser.toObject(); //remove password from user object to avoid sending it with jwt
        const uid = setUser(userWithoutPassword);//converting the user object to token and signing it
        return res.status(201).cookie("uid", uid, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 }).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error in signup:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleLogout(req, res) {
    return res.status(200).clearCookie("uid").json({ message: "Logout successful" });
}

module.exports = {
    handleGetUsers,
    handleVerifyUser,
    handleLogin,
    handleSignup,
    handleLogout
}
