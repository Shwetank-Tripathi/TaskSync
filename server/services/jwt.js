import jwt from "jsonwebtoken";
process.loadEnvFile();
const secret = process.env.JWT_SECRET;

export function setUser(user) {
  try {
    return jwt.sign(user, secret);
  } catch (error) {
    console.error("Error signing JWT:", error);
    return null;
  }
}

export function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}
