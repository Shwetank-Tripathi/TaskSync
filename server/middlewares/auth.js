const { getUser } = require("../services/jwt");

const auth = async (req, res, next) => {
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

const isAuthenticated = (req, res, next) => {
    if(!req.user){
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}


module.exports = {
    auth,
    isAuthenticated
}