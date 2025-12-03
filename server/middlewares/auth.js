import { getUser } from "../services/jwt.js";

export const auth = async (req, res, next) => {
    const userUid = req.cookies?.uid;
    if (!userUid) {
        req.user = null;
        return next();
    }
    try {
        const user = getUser(userUid);
        req.user = user;
        next();
    } catch (error) {
        req.user = null;
        return next();
    }
}

export const isAuthenticated = (req, res, next) => {
    if(!req.user){
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}