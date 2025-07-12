const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const secret = process.env.JWT_SECRET;

function setUser(user) {
    try{
        return jwt.sign(user, secret);
    } catch (error) {
        console.error("Error signing JWT:", error);
        return null;
    }
}

function getUser(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        console.error("Error verifying JWT:", error);
        return null;
    }
}

module.exports = {
    setUser,
    getUser
}
